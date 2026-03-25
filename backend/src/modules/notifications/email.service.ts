import nodemailer from 'nodemailer';
import { FastifyInstance } from 'fastify';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private app: FastifyInstance) {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      app.log.info('Email service configured');
    } else {
      app.log.info('Email service: SMTP not configured (set SMTP_HOST in .env)');
    }
  }

  private get from() {
    return process.env.SMTP_FROM || 'noreply@numerique.gouv.sn';
  }

  async sendInvitation(to: string, institutionNom: string, email: string, password: string) {
    if (!this.transporter) { this.app.log.warn('Email non envoyé (SMTP non configuré)'); return false; }

    await this.transporter.sendMail({
      from: `"SENUM — e-jokkoo" <${this.from}>`,
      to,
      subject: 'Invitation — Questionnaire d\'Interopérabilité e-jokkoo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1F3A; padding: 20px; text-align: center;">
            <h1 style="color: #D4A820; margin: 0;">e-jokkoo</h1>
            <p style="color: #ccc; margin: 5px 0 0;">Plateforme Nationale d'Interopérabilité</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Bonjour,</p>
            <p>Vous êtes invité(e) à remplir le <strong>Questionnaire d'Interopérabilité</strong> pour <strong>${institutionNom}</strong>.</p>
            <p>Ce questionnaire permet de cartographier vos systèmes d'information, vos besoins en échange de données et votre maturité numérique dans le cadre du projet e-jokkoo.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Identifiants :</strong></p>
              <p style="margin: 5px 0;">Email : <code>${email}</code></p>
              <p style="margin: 5px 0;">Mot de passe : <code>${password}</code></p>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}/login" style="background: #0A6B68; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accéder au questionnaire</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              SENUM / MCTN — Ministère de la Communication, des Télécommunications et du Numérique<br>
              République du Sénégal
            </p>
          </div>
        </div>
      `,
    });
    return true;
  }

  async sendSubmissionConfirmation(to: string, institutionNom: string) {
    if (!this.transporter) return false;

    await this.transporter.sendMail({
      from: `"SENUM — e-jokkoo" <${this.from}>`,
      to,
      subject: 'Questionnaire soumis avec succès — e-jokkoo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1F3A; padding: 20px; text-align: center;">
            <h1 style="color: #D4A820; margin: 0;">e-jokkoo</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Bonjour,</p>
            <p>Le questionnaire d'interopérabilité de <strong>${institutionNom}</strong> a été soumis avec succès.</p>
            <p>L'équipe SENUM procédera à la revue et la validation dans les meilleurs délais.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">SENUM / MCTN — République du Sénégal</p>
          </div>
        </div>
      `,
    });
    return true;
  }

  async sendRelance(to: string, institutionNom: string) {
    if (!this.transporter) return false;

    await this.transporter.sendMail({
      from: `"SENUM — e-jokkoo" <${this.from}>`,
      to,
      subject: 'Relance — Questionnaire d\'Interopérabilité en attente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1F3A; padding: 20px; text-align: center;">
            <h1 style="color: #D4A820; margin: 0;">e-jokkoo</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Bonjour,</p>
            <p>Nous n'avons pas encore reçu le questionnaire d'interopérabilité de <strong>${institutionNom}</strong>.</p>
            <p>Votre participation est essentielle pour la réussite du projet d'interopérabilité national. Merci de compléter le questionnaire dans les meilleurs délais.</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}/login" style="background: #C55A18; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Compléter le questionnaire</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">SENUM / MCTN — République du Sénégal</p>
          </div>
        </div>
      `,
    });
    return true;
  }
}
