import { FastifyInstance } from 'fastify';
import {
  CreateSubmissionInput,
  UpdateSubmissionInput,
  SubmissionQuery,
  UpdateStatusInput,
} from './submissions.schema.js';

export class SubmissionsService {
  constructor(private app: FastifyInstance) {}

  async create(input: CreateSubmissionInput, userId: string) {
    const { institutionId } = input;

    // Verify institution exists
    const institution = await this.app.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    // Check for existing draft
    const existingDraft = await this.app.prisma.submission.findFirst({
      where: {
        institutionId,
        status: 'DRAFT',
      },
    });

    if (existingDraft) {
      return existingDraft;
    }

    const submission = await this.app.prisma.submission.create({
      data: {
        institutionId,
        status: 'DRAFT',
        currentStep: 0,
      },
      include: {
        institution: {
          select: { id: true, code: true, nom: true },
        },
      },
    });

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'submissions',
        entityId: submission.id,
      },
    });

    return submission;
  }

  async findAll(query: SubmissionQuery, userRole: string, userInstitutionId?: string) {
    const { status, institutionId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Non-admin users can only see their institution's submissions
    const whereInstitution =
      userRole === 'ADMIN' ? (institutionId ? { institutionId } : {}) : { institutionId: userInstitutionId };

    const where = {
      ...whereInstitution,
      ...(status ? { status } : {}),
    };

    const [submissions, total] = await Promise.all([
      this.app.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          institution: {
            select: { id: true, code: true, nom: true, ministere: true },
          },
          _count: {
            select: {
              applications: true,
              registres: true,
              donneesConsommer: true,
              donneesFournir: true,
              fluxExistants: true,
              casUsage: true,
            },
          },
        },
      }),
      this.app.prisma.submission.count({ where }),
    ]);

    return {
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userRole: string, userInstitutionId?: string) {
    const submission = await this.app.prisma.submission.findUnique({
      where: { id },
      include: {
        institution: true,
        applications: { orderBy: { ordre: 'asc' } },
        registres: { orderBy: { ordre: 'asc' } },
        infrastructureItems: { orderBy: { domain: 'asc' } },
        niveauxInterop: { orderBy: { niveau: 'asc' } },
        dictionnaireDonnees: true,
        conformitePrincipes: { orderBy: { principeNumero: 'asc' } },
        preparationDecret: true,
        donneesConsommer: { orderBy: { ordre: 'asc' } },
        donneesFournir: { orderBy: { ordre: 'asc' } },
        fluxExistants: { orderBy: { ordre: 'asc' } },
        casUsage: { orderBy: { priorite: 'desc' } },
      },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Soumission non trouvée' };
    }

    // Check access for non-admin
    if (userRole !== 'ADMIN' && submission.institutionId !== userInstitutionId) {
      throw { statusCode: 403, message: 'Accès non autorisé' };
    }

    return submission;
  }

  async update(id: string, input: UpdateSubmissionInput, userId: string) {
    const existing = await this.app.prisma.submission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Soumission non trouvée' };
    }

    if (existing.status !== 'DRAFT') {
      throw { statusCode: 400, message: 'Seules les soumissions en brouillon peuvent être modifiées' };
    }

    // Transaction for complex update
    const result = await this.app.prisma.$transaction(async tx => {
      // Update main submission fields
      const submissionData: any = {
        dataOwnerNom: input.dataOwnerNom,
        dataOwnerFonction: input.dataOwnerFonction,
        dataOwnerEmail: input.dataOwnerEmail,
        dataOwnerTelephone: input.dataOwnerTelephone,
        dataStewardNom: input.dataStewardNom,
        dataStewardProfil: input.dataStewardProfil,
        dataStewardFonction: input.dataStewardFonction,
        dataStewardEmail: input.dataStewardEmail,
        dataStewardTelephone: input.dataStewardTelephone,
        infrastructure: input.infrastructure,
        contraintesJuridiques: input.contraintesJuridiques,
        contraintesTechniques: input.contraintesTechniques,
        maturiteInfra: input.maturiteInfra,
        maturiteDonnees: input.maturiteDonnees,
        maturiteCompetences: input.maturiteCompetences,
        maturiteGouvernance: input.maturiteGouvernance,
        forces: input.forces,
        faiblesses: input.faiblesses,
        attentes: input.attentes,
        contributions: input.contributions,
        currentStep: input.currentStep,
      };

      // Remove undefined values
      Object.keys(submissionData).forEach(
        key => submissionData[key] === undefined && delete submissionData[key]
      );

      // Update applications if provided
      if (input.applications) {
        await tx.application.deleteMany({ where: { submissionId: id } });
        if (input.applications.length > 0) {
          await tx.application.createMany({
            data: input.applications.map((app, idx) => ({
              ...app,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update registres if provided
      if (input.registres) {
        await tx.registre.deleteMany({ where: { submissionId: id } });
        if (input.registres.length > 0) {
          await tx.registre.createMany({
            data: input.registres.map((reg, idx) => ({
              ...reg,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update donneesConsommer if provided
      if (input.donneesConsommer) {
        await tx.donneeConsommer.deleteMany({ where: { submissionId: id } });
        if (input.donneesConsommer.length > 0) {
          await tx.donneeConsommer.createMany({
            data: input.donneesConsommer.map((d, idx) => ({
              ...d,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update donneesFournir if provided
      if (input.donneesFournir) {
        await tx.donneeFournir.deleteMany({ where: { submissionId: id } });
        if (input.donneesFournir.length > 0) {
          await tx.donneeFournir.createMany({
            data: input.donneesFournir.map((d, idx) => ({
              ...d,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update fluxExistants if provided
      if (input.fluxExistants) {
        await tx.fluxExistant.deleteMany({ where: { submissionId: id } });
        if (input.fluxExistants.length > 0) {
          await tx.fluxExistant.createMany({
            data: input.fluxExistants.map((f, idx) => ({
              ...f,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update casUsage if provided
      if (input.casUsage) {
        await tx.casUsage.deleteMany({ where: { submissionId: id } });
        if (input.casUsage.length > 0) {
          await tx.casUsage.createMany({
            data: input.casUsage.map((c, idx) => ({
              ...c,
              submissionId: id,
              ordre: idx,
            })),
          });
        }
      }

      // Update submission
      return tx.submission.update({
        where: { id },
        data: submissionData,
        include: {
          institution: { select: { id: true, code: true, nom: true } },
        },
      });
    });

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'submissions',
        entityId: id,
        changes: input as any,
      },
    });

    return result;
  }

  async updateStatus(id: string, input: UpdateStatusInput, userId: string) {
    const existing = await this.app.prisma.submission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Soumission non trouvée' };
    }

    const updateData: any = { status: input.status };

    if (input.status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    } else if (input.status === 'REVIEWED' || input.status === 'VALIDATED') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = userId;
    }

    const submission = await this.app.prisma.submission.update({
      where: { id },
      data: updateData,
      include: {
        institution: { select: { id: true, code: true, nom: true } },
      },
    });

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        userId,
        action: 'STATUS_CHANGE',
        entity: 'submissions',
        entityId: id,
        changes: { oldStatus: existing.status, newStatus: input.status },
      },
    });

    return submission;
  }

  async delete(id: string, userId: string) {
    const existing = await this.app.prisma.submission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Soumission non trouvée' };
    }

    if (existing.status !== 'DRAFT') {
      throw { statusCode: 400, message: 'Seules les soumissions en brouillon peuvent être supprimées' };
    }

    await this.app.prisma.submission.delete({
      where: { id },
    });

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'submissions',
        entityId: id,
      },
    });

    return { message: 'Soumission supprimée avec succès' };
  }

  async getStats() {
    const [byStatus, byInstitution, recentSubmissions] = await Promise.all([
      this.app.prisma.submission.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.app.prisma.submission.groupBy({
        by: ['institutionId'],
        _count: true,
        where: { status: 'SUBMITTED' },
      }),
      this.app.prisma.submission.findMany({
        where: { status: 'SUBMITTED' },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        include: {
          institution: { select: { code: true, nom: true } },
        },
      }),
    ]);

    const total = byStatus.reduce((acc, s) => acc + s._count, 0);

    return {
      total,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
      submittedCount: byInstitution.length,
      recentSubmissions,
    };
  }
}
