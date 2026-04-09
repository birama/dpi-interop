import { FastifyInstance } from 'fastify';
import { GenerateReportInput, ReportQuery } from './reports.schema.js';

export class ReportsService {
  constructor(private app: FastifyInstance) {}

  async generate(input: GenerateReportInput, userId: string) {
    const { type, format, institutionId, filters } = input;

    let data: any;
    let filename: string;

    switch (type) {
      case 'COMPILATION':
        data = await this.generateCompilation(filters);
        filename = `compilation_${Date.now()}`;
        break;

      case 'MATRICE_FLUX':
        data = await this.generateMatriceFlux();
        filename = `matrice_flux_${Date.now()}`;
        break;

      case 'STATISTIQUES':
        data = await this.generateStatistiques();
        filename = `statistiques_${Date.now()}`;
        break;

      case 'EXPORT_INSTITUTION':
        if (!institutionId) {
          throw { statusCode: 400, message: 'institutionId requis pour ce type de rapport' };
        }
        data = await this.generateExportInstitution(institutionId);
        filename = `export_institution_${Date.now()}`;
        break;

      case 'EXPORT_COMPLET':
        data = await this.generateExportComplet(filters);
        filename = `export_complet_${Date.now()}`;
        break;

      default:
        throw { statusCode: 400, message: 'Type de rapport invalide' };
    }

    // Save report record
    const report = await this.app.prisma.report.create({
      data: {
        type,
        format,
        filename: `${filename}.${format}`,
        generatedBy: userId,
        parameters: input as any,
      },
    });

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        userId,
        userEmail: 'system', userRole: 'SYSTEM',
        action: 'EXPORT',
        resource: 'reports',
        resourceId: report.id,
        details: { type, format },
      },
    });

    return {
      report,
      data,
    };
  }

  private async generateCompilation(filters?: any) {
    const where: any = { status: 'SUBMITTED' };

    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom) where.submittedAt = { gte: new Date(filters.dateFrom) };
    if (filters?.dateTo) {
      where.submittedAt = where.submittedAt || {};
      where.submittedAt.lte = new Date(filters.dateTo);
    }

    const submissions = await this.app.prisma.submission.findMany({
      where,
      include: {
        institution: true,
        applications: true,
        registres: true,
        donneesConsommer: true,
        donneesFournir: true,
        fluxExistants: true,
        casUsage: true,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      totalSubmissions: submissions.length,
      submissions: submissions.map(s => ({
        institution: {
          code: s.institution.code,
          nom: s.institution.nom,
          ministere: s.institution.ministere,
        },
        status: s.status,
        submittedAt: s.submittedAt,
        applications: s.applications.length,
        registres: s.registres.length,
        donneesConsommer: s.donneesConsommer,
        donneesFournir: s.donneesFournir,
        fluxExistants: s.fluxExistants,
        casUsage: s.casUsage,
        maturite: {
          infrastructure: s.maturiteInfra,
          donnees: s.maturiteDonnees,
          competences: s.maturiteCompetences,
          gouvernance: s.maturiteGouvernance,
        },
      })),
    };
  }

  private async generateMatriceFlux() {
    const submissions = await this.app.prisma.submission.findMany({
      where: { status: { in: ['SUBMITTED', 'VALIDATED'] } },
      include: {
        institution: { select: { code: true, nom: true } },
        donneesConsommer: true,
        donneesFournir: true,
        fluxExistants: true,
      },
    });

    // Build flux matrix
    const matrix: { source: string; destination: string; donnees: string[]; mode?: string }[] = [];
    const institutions = new Set<string>();

    submissions.forEach(s => {
      const instCode = s.institution.code;
      institutions.add(instCode);

      // From donneesConsommer
      s.donneesConsommer.forEach(dc => {
        matrix.push({
          source: dc.source,
          destination: instCode,
          donnees: [dc.donnee],
        });
        institutions.add(dc.source);
      });

      // From donneesFournir
      s.donneesFournir.forEach(df => {
        if (df.destinataires) {
          df.destinataires.split(',').forEach(dest => {
            matrix.push({
              source: instCode,
              destination: dest.trim(),
              donnees: [df.donnee],
            });
            institutions.add(dest.trim());
          });
        }
      });

      // From fluxExistants
      s.fluxExistants.forEach(fe => {
        matrix.push({
          source: fe.source,
          destination: fe.destination,
          donnees: fe.donnee ? [fe.donnee] : [],
          mode: fe.mode || undefined,
        });
        institutions.add(fe.source);
        institutions.add(fe.destination);
      });
    });

    return {
      generatedAt: new Date().toISOString(),
      institutions: Array.from(institutions).sort(),
      totalFlux: matrix.length,
      flux: matrix,
    };
  }

  private async generateStatistiques() {
    const [
      institutionsTotal,
      submissionsTotal,
      byStatus,
      byMinistere,
      avgMaturite,
      topCasUsage,
    ] = await Promise.all([
      this.app.prisma.institution.count(),
      this.app.prisma.submission.count(),
      this.app.prisma.submission.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.app.prisma.institution.groupBy({
        by: ['ministere'],
        _count: true,
      }),
      this.app.prisma.submission.aggregate({
        where: { status: { in: ['SUBMITTED', 'VALIDATED'] } },
        _avg: {
          maturiteInfra: true,
          maturiteDonnees: true,
          maturiteCompetences: true,
          maturiteGouvernance: true,
        },
      }),
      this.app.prisma.casUsage.findMany({
        orderBy: { priorite: 'desc' },
        take: 10,
        include: {
          submission: {
            include: {
              institution: { select: { code: true, nom: true } },
            },
          },
        },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      institutions: {
        total: institutionsTotal,
      },
      submissions: {
        total: submissionsTotal,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
      },
      institutions_by_ministere: byMinistere,
      maturite_moyenne: avgMaturite._avg,
      top_cas_usage: topCasUsage.map(c => ({
        titre: c.titre,
        description: c.description,
        priorite: c.priorite,
        institution: c.submission.institution,
      })),
    };
  }

  private async generateExportInstitution(institutionId: string) {
    const institution = await this.app.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        users: { select: { id: true, email: true, role: true } },
        submissions: {
          include: {
            applications: true,
            registres: true,
            donneesConsommer: true,
            donneesFournir: true,
            fluxExistants: true,
            casUsage: true,
          },
        },
      },
    });

    if (!institution) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    return {
      generatedAt: new Date().toISOString(),
      institution: {
        code: institution.code,
        nom: institution.nom,
        ministere: institution.ministere,
        responsable: {
          nom: institution.responsableNom,
          fonction: institution.responsableFonction,
          email: institution.responsableEmail,
          tel: institution.responsableTel,
        },
      },
      utilisateurs: institution.users,
      submissions: institution.submissions,
    };
  }

  private async generateExportComplet(filters?: any) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const [institutions, submissions] = await Promise.all([
      this.app.prisma.institution.findMany({
        include: { _count: { select: { submissions: true, users: true } } },
      }),
      this.app.prisma.submission.findMany({
        where,
        include: {
          institution: true,
          applications: true,
          registres: true,
          donneesConsommer: true,
          donneesFournir: true,
          fluxExistants: true,
          casUsage: true,
        },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      institutions,
      submissions,
    };
  }

  async findAll(query: ReportQuery) {
    const { type, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = type ? { type } : {};

    const [reports, total] = await Promise.all([
      this.app.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.app.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const report = await this.app.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw { statusCode: 404, message: 'Rapport non trouvé' };
    }

    return report;
  }
}
