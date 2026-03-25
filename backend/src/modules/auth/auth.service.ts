import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schema.js';

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(input: RegisterInput) {
    const { email, password, role, institutionId } = input;

    // Check if user exists
    const existing = await this.app.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw { statusCode: 409, message: 'Un utilisateur avec cet email existe déjà' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.app.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'INSTITUTION',
        institutionId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        institutionId: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await this.app.prisma.user.findUnique({
      where: { email },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 401, message: 'Email ou mot de passe incorrect' };
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw { statusCode: 401, message: 'Email ou mot de passe incorrect' };
    }

    // Update last login
    await this.app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate access token (2h) and refresh token (7d)
    const payload = { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId || undefined };
    const token = this.app.jwt.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.app.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

    return {
      token,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        institution: user.institution,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.app.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        institutionId: true,
        lastLoginAt: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            code: true,
            nom: true,
            ministere: true,
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'Utilisateur non trouvé' };
    }

    return user;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const { currentPassword, newPassword } = input;

    const user = await this.app.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { statusCode: 404, message: 'Utilisateur non trouvé' };
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw { statusCode: 401, message: 'Mot de passe actuel incorrect' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear mustChangePassword flag
    await this.app.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }
}
