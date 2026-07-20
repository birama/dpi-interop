import { FastifyInstance } from 'fastify';
import { RecensementInput, ProjetInput } from './schema.js';
import crypto from 'crypto';

// Rôles autorisés pour l'accès au back-office recensement.
// Simple constante : pour élargir, ajouter un rôle ici suffit.
export const RECENSEMENT_ADMIN_ROLES = ['ADMIN'] as const;

interface StructureContact {
  ministereTutelle: string;
  ministereAutre?: string;
  structureNom: string;
  typeStructure: string;
  contactNom: string;
  contactFonction: string;
  contactEmail: string;
  contactTelephone?: string;
}

export class RecensementService {
  constructor(private app: FastifyInstance) {}

  async createFromProjet(
    projet: ProjetInput,
    sc: StructureContact,
    ipTronquee: string,
    existingSessionRef: string | undefined,
    origine: string,
    institutionId: string | null,
  ) {
    const sessionRef = existingSessionRef || crypto.randomUUID();

    return this.app.prisma.projetRecense.create({
      data: {
        origine: origine as any,
        institutionId,
        ministereTutelle: sc.ministereTutelle,
        ministereAutre: sc.ministereAutre || null,
        structureNom: sc.structureNom,
        typeStructure: sc.typeStructure as any,
        contactNom: sc.contactNom,
        contactFonction: sc.contactFonction,
        contactEmail: sc.contactEmail,
        contactTelephone: sc.contactTelephone || null,
        intitule: projet.intitule,
        description: projet.description,
        natures: projet.natures,
        statutAvancement: projet.statutAvancement as any,
        anneeDebut: projet.anneeDebut ?? null,
        anneeFin: projet.anneeFin ?? null,
        budgetFourchette: projet.budgetFourchette as any,
        budgetMontant: projet.budgetMontant ?? null,
        sourceFinancement: projet.sourceFinancement as any,
        sourceFinancementPrecision: projet.sourceFinancementPrecision || null,
        echangeDonnees: (projet.echangeDonnees ?? null) as any,
        echangeDonneesDetail: projet.echangeDonneesDetail || null,
        registresConcernes: projet.registresConcernes || [],
        hebergement: (projet.hebergement ?? null) as any,
        dossierArchitecture: (projet.dossierArchitecture ?? null) as any,
        souhaitAccompagnement: (projet.souhaitAccompagnement ?? null) as any,
        observations: projet.observations || null,
        ipTronquee,
        sessionRef,
      },
    });
  }

  async create(
    data: RecensementInput,
    ipTronquee: string,
    existingSessionRef?: string,
    origine: string = 'PUBLIQUE',
    institutionId: string | null = null,
  ) {
    const sessionRef = existingSessionRef || crypto.randomUUID();

    const projet = await this.app.prisma.projetRecense.create({
      data: {
        origine: origine as any,
        institutionId,

        ministereTutelle: data.ministereTutelle,
        ministereAutre: data.ministereAutre || null,
        structureNom: data.structureNom,
        typeStructure: data.typeStructure,

        contactNom: data.contactNom,
        contactFonction: data.contactFonction,
        contactEmail: data.contactEmail,
        contactTelephone: data.contactTelephone || null,

        intitule: data.intitule,
        description: data.description,
        natures: data.natures,
        statutAvancement: data.statutAvancement,
        anneeDebut: data.anneeDebut ?? null,
        anneeFin: data.anneeFin ?? null,
        budgetFourchette: data.budgetFourchette,
        budgetMontant: data.budgetMontant ?? null,
        sourceFinancement: data.sourceFinancement,
        sourceFinancementPrecision: data.sourceFinancementPrecision || null,

        echangeDonnees: data.echangeDonnees ?? null,
        echangeDonneesDetail: data.echangeDonneesDetail || null,
        registresConcernes: data.registresConcernes || [],
        hebergement: data.hebergement ?? null,
        dossierArchitecture: data.dossierArchitecture ?? null,
        souhaitAccompagnement: data.souhaitAccompagnement ?? null,

        observations: data.observations || null,

        ipTronquee,
        sessionRef,
      },
    });

    return { id: projet.id, sessionRef };
  }

  async list(filters: {
    ministere?: string;
    typeStructure?: string;
    statutAvancement?: string;
    budgetFourchette?: string;
    souhaitAccompagnement?: string;
    echangeDonnees?: string;
    statutTraitement?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // RBAC : ADMIN voit tout, INSTITUTION voit uniquement son institution
    userRole?: string;
    userInstitutionId?: string | null;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const sortBy = filters.sortBy || 'dateSoumission';
    const sortOrder = filters.sortOrder || 'desc';

    const where: any = {};

    // RBAC : filtrage serveur obligatoire pour les non-ADMIN
    if (filters.userRole !== 'ADMIN' && filters.userInstitutionId) {
      where.institutionId = filters.userInstitutionId;
    }

    if (filters.ministere) where.ministereTutelle = filters.ministere;
    if (filters.typeStructure) where.typeStructure = filters.typeStructure;
    if (filters.statutAvancement) where.statutAvancement = filters.statutAvancement;
    if (filters.budgetFourchette) where.budgetFourchette = filters.budgetFourchette;
    if (filters.souhaitAccompagnement) where.souhaitAccompagnement = filters.souhaitAccompagnement;
    if (filters.echangeDonnees) where.echangeDonnees = filters.echangeDonnees;
    if (filters.statutTraitement) where.statutTraitement = filters.statutTraitement;

    if (filters.search) {
      const s = filters.search;
      where.OR = [
        { intitule: { contains: s, mode: 'insensitive' } },
        { structureNom: { contains: s, mode: 'insensitive' } },
        { contactEmail: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.app.prisma.projetRecense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.app.prisma.projetRecense.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, userRole?: string, userInstitutionId?: string | null) {
    const projet = await this.app.prisma.projetRecense.findUnique({ where: { id } });
    if (!projet) return null;

    // RBAC : un non-ADMIN ne peut voir que les soumissions de son institution
    if (userRole !== 'ADMIN' && userInstitutionId && projet.institutionId !== userInstitutionId) {
      return null; // on renvoie 404 plutôt qu'un 403 pour ne pas fuiter d'info
    }
    return projet;
  }

  async updateQualification(id: string, data: { statutTraitement: string; notesInternes?: string }, userId: string) {
    const projet = await this.app.prisma.projetRecense.update({
      where: { id },
      data: {
        statutTraitement: data.statutTraitement as any,
        notesInternes: data.notesInternes ?? undefined,
      },
    });

    try {
      await this.app.prisma.auditLog.create({
        data: {
          userId,
          userEmail: '',
          userRole: 'ADMIN',
          action: 'UPDATE',
          resource: 'projet_recense',
          resourceId: id,
          resourceLabel: projet.intitule,
          details: { statutTraitement: data.statutTraitement, notesInternes: data.notesInternes },
        },
      });
    } catch {}

    return projet;
  }

  async stats(userRole?: string, userInstitutionId?: string | null) {
    const where: any = {};

    if (userRole !== 'ADMIN' && userInstitutionId) {
      where.institutionId = userInstitutionId;
    }

    const [total, structures, comite, echange] = await Promise.all([
      this.app.prisma.projetRecense.count({ where }),
      this.app.prisma.projetRecense.groupBy({ by: ['structureNom'], where, _count: true }).then(r => new Set(r.map(x => x.structureNom)).size),
      this.app.prisma.projetRecense.count({ where: { ...where, souhaitAccompagnement: 'OUI' } }),
      this.app.prisma.projetRecense.count({ where: { ...where, echangeDonnees: 'OUI' } }),
    ]);

    const parStatutRaw = await this.app.prisma.projetRecense.groupBy({
      by: ['statutAvancement'],
      where,
      _count: true,
    });
    const parStatut: Record<string, number> = {};
    for (const s of parStatutRaw) parStatut[s.statutAvancement] = s._count;

    return { total, structures, comite, echange, parStatut };
  }

  async exportAll(filters: {
    ministere?: string;
    statutAvancement?: string;
    statutTraitement?: string;
    souhaitAccompagnement?: string;
    userRole?: string;
    userInstitutionId?: string | null;
  }) {
    const where: any = {};

    if (filters.userRole !== 'ADMIN' && filters.userInstitutionId) {
      where.institutionId = filters.userInstitutionId;
    }

    if (filters.ministere) where.ministereTutelle = filters.ministere;
    if (filters.statutAvancement) where.statutAvancement = filters.statutAvancement;
    if (filters.statutTraitement) where.statutTraitement = filters.statutTraitement;
    if (filters.souhaitAccompagnement) where.souhaitAccompagnement = filters.souhaitAccompagnement;

    return this.app.prisma.projetRecense.findMany({
      where,
      orderBy: { dateSoumission: 'desc' },
    });
  }
}
