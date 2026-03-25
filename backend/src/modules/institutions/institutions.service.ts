import { FastifyInstance } from 'fastify';
import { CreateInstitutionInput, UpdateInstitutionInput, InstitutionQuery } from './institutions.schema.js';

export class InstitutionsService {
  constructor(private app: FastifyInstance) {}

  async create(input: CreateInstitutionInput) {
    // Check code uniqueness
    const existing = await this.app.prisma.institution.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw { statusCode: 409, message: 'Une institution avec ce code existe déjà' };
    }

    // Check email uniqueness
    const existingEmail = await this.app.prisma.institution.findUnique({
      where: { responsableEmail: input.responsableEmail },
    });

    if (existingEmail) {
      throw { statusCode: 409, message: 'Cet email est déjà utilisé par une autre institution' };
    }

    const institution = await this.app.prisma.institution.create({
      data: input,
    });

    return institution;
  }

  async findAll(query: InstitutionQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { nom: { contains: search, mode: 'insensitive' as const } },
            { ministere: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [institutions, total] = await Promise.all([
      this.app.prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nom: 'asc' },
        include: {
          _count: {
            select: { submissions: true, users: true },
          },
        },
      }),
      this.app.prisma.institution.count({ where }),
    ]);

    return {
      data: institutions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const institution = await this.app.prisma.institution.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLoginAt: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            currentStep: true,
            submittedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { submissions: true, users: true },
        },
      },
    });

    if (!institution) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    return institution;
  }

  async findByCode(code: string) {
    const institution = await this.app.prisma.institution.findUnique({
      where: { code },
    });

    if (!institution) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    return institution;
  }

  async update(id: string, input: UpdateInstitutionInput) {
    const existing = await this.app.prisma.institution.findUnique({
      where: { id },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    // Check code uniqueness if changing
    if (input.code && input.code !== existing.code) {
      const codeExists = await this.app.prisma.institution.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw { statusCode: 409, message: 'Ce code est déjà utilisé' };
      }
    }

    // Check email uniqueness if changing
    if (input.responsableEmail && input.responsableEmail !== existing.responsableEmail) {
      const emailExists = await this.app.prisma.institution.findUnique({
        where: { responsableEmail: input.responsableEmail },
      });
      if (emailExists) {
        throw { statusCode: 409, message: 'Cet email est déjà utilisé' };
      }
    }

    const institution = await this.app.prisma.institution.update({
      where: { id },
      data: input,
    });

    return institution;
  }

  async delete(id: string) {
    const existing = await this.app.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true, users: true } },
      },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Institution non trouvée' };
    }

    if (existing._count.submissions > 0) {
      throw {
        statusCode: 409,
        message: 'Impossible de supprimer: cette institution a des soumissions',
      };
    }

    await this.app.prisma.institution.delete({
      where: { id },
    });

    return { message: 'Institution supprimée avec succès' };
  }

  async getStats() {
    const [total, withSubmissions, byMinistere] = await Promise.all([
      this.app.prisma.institution.count(),
      this.app.prisma.institution.count({
        where: { submissions: { some: {} } },
      }),
      this.app.prisma.institution.groupBy({
        by: ['ministere'],
        _count: true,
        orderBy: { _count: { ministere: 'desc' } },
      }),
    ]);

    return {
      total,
      withSubmissions,
      withoutSubmissions: total - withSubmissions,
      byMinistere,
    };
  }
}
