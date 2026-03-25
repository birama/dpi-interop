import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, PageBreak,
  TableOfContents, Header, Footer,
} from 'docx';
import { FastifyInstance } from 'fastify';

const NAVY = '0C1F3A';
const TEAL = '0A6B68';
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F2F2F2';

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: WHITE, font: 'Tahoma', size: 18 })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { fill: NAVY },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function dataCell(text: string, shaded = false): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: text || '—', font: 'Times New Roman', size: 20 })],
    })],
    shading: shaded ? { fill: LIGHT_GRAY } : undefined,
  });
}

function sectionTitle(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 400, after: 200 },
    run: { color: NAVY, font: 'Tahoma' },
  });
}

export class WordExportService {
  constructor(private app: FastifyInstance) {}

  async generateInstitutionReport(submissionId: string): Promise<Buffer> {
    const submission = await this.app.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        institution: true,
        applications: { orderBy: { ordre: 'asc' } },
        registres: { orderBy: { ordre: 'asc' } },
        infrastructureItems: true,
        donneesConsommer: { orderBy: { ordre: 'asc' } },
        donneesFournir: { orderBy: { ordre: 'asc' } },
        fluxExistants: { orderBy: { ordre: 'asc' } },
        casUsage: { orderBy: { priorite: 'desc' } },
      },
    });

    if (!submission) throw { statusCode: 404, message: 'Soumission non trouvée' };

    const inst = submission.institution;
    const sections: Paragraph[] = [];

    // PAGE DE GARDE
    sections.push(
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ children: [new TextRun({ text: 'REPUBLIQUE DU SENEGAL', font: 'Tahoma', size: 24, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Un Peuple – Un But – Une Foi', font: 'Tahoma', size: 20, italics: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: 'Ministère de la Communication, des Télécommunications et du Numérique', font: 'Tahoma', size: 22, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Plateforme Nationale d\'Interopérabilité (e-jokkoo)', font: 'Tahoma', size: 22, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 1000 } }),
      new Paragraph({ children: [new TextRun({ text: 'Recueil de l\'existant', font: 'Tahoma', size: 36, bold: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: inst.nom, font: 'Tahoma', size: 28, bold: true, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 800 } }),
      new Paragraph({ children: [new TextRun({ text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`, font: 'Tahoma', size: 20, color: '666666' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // SECTION A — Identification
    sections.push(sectionTitle('Section A — Identification'));
    sections.push(new Table({
      rows: [
        new TableRow({ children: [headerCell('Champ', 30), headerCell('Valeur', 70)] }),
        new TableRow({ children: [dataCell('Code'), dataCell(inst.code)] }),
        new TableRow({ children: [dataCell('Nom', true), dataCell(inst.nom, true)] }),
        new TableRow({ children: [dataCell('Ministère'), dataCell(inst.ministere)] }),
        new TableRow({ children: [dataCell('Responsable', true), dataCell(inst.responsableNom, true)] }),
        new TableRow({ children: [dataCell('Fonction'), dataCell(inst.responsableFonction)] }),
        new TableRow({ children: [dataCell('Email', true), dataCell(inst.responsableEmail, true)] }),
        new TableRow({ children: [dataCell('Téléphone'), dataCell(inst.responsableTel)] }),
        ...(submission.dataOwnerNom ? [
          new TableRow({ children: [dataCell('Data Owner', true), dataCell(`${submission.dataOwnerNom} — ${submission.dataOwnerFonction || ''}`, true)] }),
          new TableRow({ children: [dataCell('Email Data Owner'), dataCell(submission.dataOwnerEmail || '')] }),
        ] : []),
        ...(submission.dataStewardNom ? [
          new TableRow({ children: [dataCell('Data Steward', true), dataCell(`${submission.dataStewardNom} — ${submission.dataStewardFonction || ''}`, true)] }),
          new TableRow({ children: [dataCell('Email Data Steward'), dataCell(submission.dataStewardEmail || '')] }),
        ] : []),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    // SECTION B.1 — Applications
    if (submission.applications.length > 0) {
      sections.push(sectionTitle('Section B.1 — Applications en production', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Nom'), headerCell('Éditeur'), headerCell('Description')] }),
          ...submission.applications.map((app, i) =>
            new TableRow({ children: [dataCell(app.nom, i % 2 === 1), dataCell(app.editeur || '', i % 2 === 1), dataCell(app.description || '', i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    // SECTION B.2 — Registres
    if (submission.registres.length > 0) {
      sections.push(sectionTitle('Section B.2 — Registres / Bases de référence', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Nom'), headerCell('Volumétrie'), headerCell('Description')] }),
          ...submission.registres.map((reg, i) =>
            new TableRow({ children: [dataCell(reg.nom, i % 2 === 1), dataCell(reg.volumetrie || '', i % 2 === 1), dataCell(reg.description || '', i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    // SECTION C — Échanges de données
    if (submission.donneesConsommer.length > 0) {
      sections.push(sectionTitle('Section C.1 — Données à consommer', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Donnée'), headerCell('Source'), headerCell('Usage')] }),
          ...submission.donneesConsommer.map((dc, i) =>
            new TableRow({ children: [dataCell(dc.donnee, i % 2 === 1), dataCell(dc.source, i % 2 === 1), dataCell(dc.usage || '', i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    if (submission.donneesFournir.length > 0) {
      sections.push(sectionTitle('Section C.2 — Données à fournir', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Donnée'), headerCell('Destinataires'), headerCell('Fréquence'), headerCell('Format')] }),
          ...submission.donneesFournir.map((df, i) =>
            new TableRow({ children: [dataCell(df.donnee, i % 2 === 1), dataCell(df.destinataires || '', i % 2 === 1), dataCell(df.frequence || '', i % 2 === 1), dataCell(df.format || '', i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    if (submission.fluxExistants.length > 0) {
      sections.push(sectionTitle('Section C.3 — Flux existants', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Source'), headerCell('Destination'), headerCell('Données'), headerCell('Mode'), headerCell('Fréquence')] }),
          ...submission.fluxExistants.map((f, i) =>
            new TableRow({ children: [dataCell(f.source, i % 2 === 1), dataCell(f.destination, i % 2 === 1), dataCell(f.donnee || '', i % 2 === 1), dataCell(f.mode || '', i % 2 === 1), dataCell(f.frequence || '', i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    if (submission.casUsage.length > 0) {
      sections.push(sectionTitle('Section C.4 — Cas d\'usage prioritaires', HeadingLevel.HEADING_2));
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Titre'), headerCell('Description'), headerCell('Acteurs'), headerCell('Priorité')] }),
          ...submission.casUsage.map((cu, i) =>
            new TableRow({ children: [dataCell(cu.titre, i % 2 === 1), dataCell(cu.description, i % 2 === 1), dataCell(cu.acteurs || '', i % 2 === 1), dataCell(`${cu.priorite}/5`, i % 2 === 1)] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    // SECTION D — Maturité
    sections.push(sectionTitle('Section D — Maturité numérique', HeadingLevel.HEADING_2));
    sections.push(new Table({
      rows: [
        new TableRow({ children: [headerCell('Dimension'), headerCell('Note (1-5)')] }),
        new TableRow({ children: [dataCell('Infrastructure technique'), dataCell(`${submission.maturiteInfra}/5`)] }),
        new TableRow({ children: [dataCell('Données', true), dataCell(`${submission.maturiteDonnees}/5`, true)] }),
        new TableRow({ children: [dataCell('Compétences'), dataCell(`${submission.maturiteCompetences}/5`)] }),
        new TableRow({ children: [dataCell('Gouvernance', true), dataCell(`${submission.maturiteGouvernance}/5`, true)] }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    if (submission.contraintesJuridiques || submission.contraintesTechniques) {
      sections.push(sectionTitle('Contraintes', HeadingLevel.HEADING_3));
      if (submission.contraintesJuridiques) {
        sections.push(new Paragraph({ children: [new TextRun({ text: 'Juridiques : ', bold: true }), new TextRun({ text: submission.contraintesJuridiques })] }));
      }
      if (submission.contraintesTechniques) {
        sections.push(new Paragraph({ children: [new TextRun({ text: 'Techniques : ', bold: true }), new TextRun({ text: submission.contraintesTechniques })] }));
      }
    }

    // SECTION E — Forces / Faiblesses
    if (submission.forces || submission.faiblesses) {
      sections.push(sectionTitle('Section E — Auto-diagnostic', HeadingLevel.HEADING_2));
      if (submission.forces) sections.push(new Paragraph({ children: [new TextRun({ text: 'Forces : ', bold: true }), new TextRun({ text: submission.forces })] }));
      if (submission.faiblesses) sections.push(new Paragraph({ children: [new TextRun({ text: 'Faiblesses : ', bold: true }), new TextRun({ text: submission.faiblesses })] }));
    }

    // SECTION F — Attentes
    if (submission.attentes || submission.contributions) {
      sections.push(sectionTitle('Section F — Attentes et contributions', HeadingLevel.HEADING_2));
      if (submission.attentes) sections.push(new Paragraph({ children: [new TextRun({ text: 'Attentes : ', bold: true }), new TextRun({ text: submission.attentes })] }));
      if (submission.contributions) sections.push(new Paragraph({ children: [new TextRun({ text: 'Contributions : ', bold: true }), new TextRun({ text: submission.contributions })] }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [new TextRun({ text: 'MCTN / SENUM — Plateforme d\'Interopérabilité e-jokkoo', font: 'Tahoma', size: 16, color: TEAL })],
              alignment: AlignmentType.RIGHT,
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [new TextRun({ text: `Document confidentiel — Généré le ${new Date().toLocaleDateString('fr-FR')}`, font: 'Tahoma', size: 14, color: '999999' })],
              alignment: AlignmentType.CENTER,
            })],
          }),
        },
        children: sections,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  async generateCompilation(): Promise<Buffer> {
    const submissions = await this.app.prisma.submission.findMany({
      where: { status: { in: ['SUBMITTED', 'VALIDATED'] } },
      include: {
        institution: true,
        applications: { orderBy: { ordre: 'asc' } },
        registres: { orderBy: { ordre: 'asc' } },
        donneesConsommer: { orderBy: { ordre: 'asc' } },
        donneesFournir: { orderBy: { ordre: 'asc' } },
        fluxExistants: { orderBy: { ordre: 'asc' } },
        casUsage: { orderBy: { priorite: 'desc' } },
      },
      orderBy: { institution: { code: 'asc' } },
    });

    const totalInstitutions = await this.app.prisma.institution.count();
    const allSections: Paragraph[] = [];

    // PAGE DE GARDE
    allSections.push(
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ children: [new TextRun({ text: 'REPUBLIQUE DU SENEGAL', font: 'Tahoma', size: 24, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Un Peuple – Un But – Une Foi', font: 'Tahoma', size: 20, italics: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: 'Plateforme Nationale d\'Interopérabilité (e-jokkoo)', font: 'Tahoma', size: 24, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 800 } }),
      new Paragraph({ children: [new TextRun({ text: 'Compilation des réponses', font: 'Tahoma', size: 36, bold: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'au questionnaire pré-atelier', font: 'Tahoma', size: 28, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({ children: [new TextRun({ text: `${submissions.length} institutions ayant répondu sur ${totalInstitutions}`, font: 'Tahoma', size: 22, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Taux de réponse : ${Math.round((submissions.length / totalInstitutions) * 100)}%`, font: 'Tahoma', size: 20, color: '666666' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`, font: 'Tahoma', size: 20, color: '666666' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // NOTE DE SYNTHÈSE
    allSections.push(sectionTitle('Note de synthèse'));

    // Stats
    const avgMaturite = submissions.length > 0
      ? ((submissions.reduce((s, sub) => s + sub.maturiteInfra + sub.maturiteDonnees + sub.maturiteCompetences + sub.maturiteGouvernance, 0) / (submissions.length * 4))).toFixed(1)
      : '0';

    // Top données demandées
    const donneesCount: Record<string, number> = {};
    submissions.forEach(sub => {
      sub.donneesConsommer.forEach(dc => {
        donneesCount[dc.donnee] = (donneesCount[dc.donnee] || 0) + 1;
      });
    });
    const topDonnees = Object.entries(donneesCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top cas d'usage
    const casCount: Record<string, number> = {};
    submissions.forEach(sub => {
      sub.casUsage.forEach(cu => {
        casCount[cu.titre] = (casCount[cu.titre] || 0) + 1;
      });
    });
    const topCas = Object.entries(casCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    allSections.push(new Table({
      rows: [
        new TableRow({ children: [headerCell('Indicateur', 50), headerCell('Valeur', 50)] }),
        new TableRow({ children: [dataCell('Nombre de réponses'), dataCell(`${submissions.length}`)] }),
        new TableRow({ children: [dataCell('Taux de réponse', true), dataCell(`${Math.round((submissions.length / totalInstitutions) * 100)}%`, true)] }),
        new TableRow({ children: [dataCell('Score moyen de maturité'), dataCell(`${avgMaturite}/5`)] }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    if (topDonnees.length > 0) {
      allSections.push(sectionTitle('Top données les plus demandées', HeadingLevel.HEADING_2));
      topDonnees.forEach(([donnee, count], i) => {
        allSections.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${donnee} (${count} demandes)`, font: 'Times New Roman', size: 22 })] }));
      });
    }

    if (topCas.length > 0) {
      allSections.push(sectionTitle('Top cas d\'usage', HeadingLevel.HEADING_2));
      topCas.forEach(([cas, count], i) => {
        allSections.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${cas} (${count} citations)`, font: 'Times New Roman', size: 22 })] }));
      });
    }

    allSections.push(new Paragraph({ children: [new PageBreak()] }));

    // CHAPITRES PAR INSTITUTION
    for (const sub of submissions) {
      const inst = sub.institution;
      allSections.push(sectionTitle(`${inst.code} — ${inst.nom}`));

      // Info
      allSections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Champ', 30), headerCell('Valeur', 70)] }),
          new TableRow({ children: [dataCell('Ministère'), dataCell(inst.ministere)] }),
          new TableRow({ children: [dataCell('Responsable', true), dataCell(`${inst.responsableNom} — ${inst.responsableFonction}`, true)] }),
          ...(sub.dataOwnerNom ? [new TableRow({ children: [dataCell('Data Owner'), dataCell(`${sub.dataOwnerNom} — ${sub.dataOwnerEmail || ''}`)] })] : []),
          ...(sub.dataStewardNom ? [new TableRow({ children: [dataCell('Data Steward', true), dataCell(`${sub.dataStewardNom} — ${sub.dataStewardEmail || ''}`, true)] })] : []),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));

      // Applications
      if (sub.applications.length > 0) {
        allSections.push(sectionTitle('Applications', HeadingLevel.HEADING_3));
        allSections.push(new Table({
          rows: [
            new TableRow({ children: [headerCell('Nom'), headerCell('Éditeur'), headerCell('Description')] }),
            ...sub.applications.map((app, i) =>
              new TableRow({ children: [dataCell(app.nom, i % 2 === 1), dataCell(app.editeur || '', i % 2 === 1), dataCell(app.description || '', i % 2 === 1)] })
            ),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
      }

      // Flux
      if (sub.fluxExistants.length > 0) {
        allSections.push(sectionTitle('Flux existants', HeadingLevel.HEADING_3));
        allSections.push(new Table({
          rows: [
            new TableRow({ children: [headerCell('Source'), headerCell('Destination'), headerCell('Données'), headerCell('Mode')] }),
            ...sub.fluxExistants.map((f, i) =>
              new TableRow({ children: [dataCell(f.source, i % 2 === 1), dataCell(f.destination, i % 2 === 1), dataCell(f.donnee || '', i % 2 === 1), dataCell(f.mode || '', i % 2 === 1)] })
            ),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
      }

      // Maturité
      allSections.push(sectionTitle('Maturité', HeadingLevel.HEADING_3));
      allSections.push(new Paragraph({ children: [
        new TextRun({ text: `Infra: ${sub.maturiteInfra}/5 | Données: ${sub.maturiteDonnees}/5 | Compétences: ${sub.maturiteCompetences}/5 | Gouvernance: ${sub.maturiteGouvernance}/5`, font: 'Times New Roman', size: 20 }),
      ] }));

      allSections.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ANNEXE — Points focaux
    allSections.push(sectionTitle('Annexe — Points focaux désignés'));
    const focauxRows = submissions
      .filter(s => s.dataOwnerNom || s.dataStewardNom)
      .map((s, i) => [
        new TableRow({ children: [
          dataCell(s.institution.code, i % 2 === 1),
          dataCell(s.dataOwnerNom || '—', i % 2 === 1),
          dataCell(s.dataOwnerEmail || '—', i % 2 === 1),
          dataCell(s.dataStewardNom || '—', i % 2 === 1),
          dataCell(s.dataStewardEmail || '—', i % 2 === 1),
        ] }),
      ]).flat();

    if (focauxRows.length > 0) {
      allSections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Institution'), headerCell('Data Owner'), headerCell('Email DO'), headerCell('Data Steward'), headerCell('Email DS')] }),
          ...focauxRows,
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [new TextRun({ text: 'MCTN / SENUM — Compilation Questionnaires Interopérabilité', font: 'Tahoma', size: 16, color: TEAL })],
              alignment: AlignmentType.RIGHT,
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [new TextRun({ text: `Document confidentiel — Généré le ${new Date().toLocaleDateString('fr-FR')}`, font: 'Tahoma', size: 14, color: '999999' })],
              alignment: AlignmentType.CENTER,
            })],
          }),
        },
        children: allSections,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  async generateNoteFinancement(ptfCode: string): Promise<Buffer> {
    const ptf = await this.app.prisma.pTF.findUnique({
      where: { code: ptfCode },
      include: {
        programmes: {
          include: {
            financements: {
              include: { casUsageMVP: { include: { phaseMVP: true } } },
            },
            expertises: true,
          },
        },
      },
    });

    if (!ptf) throw { statusCode: 404, message: 'PTF non trouvé' };

    // Cas d'usage orphelins (potentiels pour ce PTF)
    const allCU = await this.app.prisma.casUsageMVP.findMany({
      include: { financements: true, phaseMVP: true },
      orderBy: [{ impact: 'desc' }, { code: 'asc' }],
    });
    const orphelins = allCU.filter(cu => !cu.financements.some(f => ['ACCORDE', 'EN_COURS'].includes(f.statut)));

    // Stats générales
    const totalInstitutions = await this.app.prisma.institution.count();
    const totalSubmissions = await this.app.prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'VALIDATED'] } } });

    const sections: Paragraph[] = [];

    // PAGE DE GARDE
    sections.push(
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ children: [new TextRun({ text: 'REPUBLIQUE DU SENEGAL', font: 'Tahoma', size: 24, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Un Peuple – Un But – Une Foi', font: 'Tahoma', size: 20, italics: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: 'Ministère de la Communication, des Télécommunications et du Numérique', font: 'Tahoma', size: 20, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Delivery Unit — SENUM', font: 'Tahoma', size: 20, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 800 } }),
      new Paragraph({ children: [new TextRun({ text: 'Note de cadrage', font: 'Tahoma', size: 36, bold: true, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Demande de financement — Interopérabilité', font: 'Tahoma', size: 28, color: NAVY })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({ children: [new TextRun({ text: `Destinataire : ${ptf.nom} (${ptf.acronyme})`, font: 'Tahoma', size: 24, bold: true, color: TEAL })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: `Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, font: 'Tahoma', size: 20, color: '666666' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // 1. CONTEXTE
    sections.push(sectionTitle('1. Contexte'));
    sections.push(new Paragraph({ children: [new TextRun({ text: 'Le Sénégal, dans le cadre du New Deal Technologique et de la Vision Sénégal 2050, a engagé la construction de son Infrastructure Publique Numérique (DPI) autour de trois piliers fondamentaux : l\'identité numérique, l\'échange de données (plateforme e-jokkoo basée sur X-Road) et la passerelle de paiement.', font: 'Times New Roman', size: 22 })] }));
    sections.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `État d'avancement : ${totalInstitutions} institutions cartographiées, ${totalSubmissions} questionnaires reçus, ${allCU.length} cas d'usage identifiés.`, font: 'Times New Roman', size: 22 })] }));

    // 2. BILAN FINANCEMENT EXISTANT
    sections.push(sectionTitle('2. Bilan du financement existant'));
    for (const prog of ptf.programmes) {
      sections.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Programme : ${prog.code} — ${prog.nom}`, font: 'Tahoma', size: 22, bold: true, color: TEAL })] }));
      if (prog.consortium) sections.push(new Paragraph({ children: [new TextRun({ text: `Consortium : ${prog.consortium}`, font: 'Times New Roman', size: 20 })] }));
      if (prog.composantsDPI) sections.push(new Paragraph({ children: [new TextRun({ text: `Composants DPI : ${prog.composantsDPI}`, font: 'Times New Roman', size: 20 })] }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `Statut : ${prog.statut}`, font: 'Times New Roman', size: 20 })] }));

      if (prog.financements.length > 0) {
        sections.push(new Table({
          rows: [
            new TableRow({ children: [headerCell('Cas d\'usage'), headerCell('Statut implémentation'), headerCell('Statut financement')] }),
            ...prog.financements.map((f, i) =>
              new TableRow({ children: [
                dataCell(f.casUsageMVP.titre, i % 2 === 1),
                dataCell(f.casUsageMVP.statutImpl, i % 2 === 1),
                dataCell(f.statut, i % 2 === 1),
              ] })
            ),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
      }

      if (prog.expertises.length > 0) {
        sections.push(new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: 'Experts mobilisés :', font: 'Times New Roman', size: 20, bold: true })] }));
        prog.expertises.forEach(exp => {
          sections.push(new Paragraph({ children: [new TextRun({ text: `• ${exp.nom} — ${exp.profil}${exp.prestataire ? ' (' + exp.prestataire + ')' : ''}`, font: 'Times New Roman', size: 20 })] }));
        });
      }
    }

    // 3. CAS D'USAGE PROPOSÉS
    sections.push(sectionTitle('3. Cas d\'usage proposés pour financement'));
    if (orphelins.length > 0) {
      sections.push(new Table({
        rows: [
          new TableRow({ children: [headerCell('Code'), headerCell('Titre'), headerCell('Institutions'), headerCell('Axe'), headerCell('Impact')] }),
          ...orphelins.map((cu, i) =>
            new TableRow({ children: [
              dataCell(cu.code, i % 2 === 1),
              dataCell(cu.titre, i % 2 === 1),
              dataCell([cu.institutionSourceCode, cu.institutionCibleCode].filter(Boolean).join(' → '), i % 2 === 1),
              dataCell(cu.axePrioritaire || '—', i % 2 === 1),
              dataCell(cu.impact, i % 2 === 1),
            ] })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    } else {
      sections.push(new Paragraph({ children: [new TextRun({ text: 'Tous les cas d\'usage identifiés ont un financement confirmé.', font: 'Times New Roman', size: 22, italics: true })] }));
    }

    // 4. CALENDRIER
    sections.push(sectionTitle('4. Calendrier proposé'));
    const phases = await this.app.prisma.phaseMVP.findMany({ orderBy: { code: 'asc' } });
    sections.push(new Table({
      rows: [
        new TableRow({ children: [headerCell('Phase'), headerCell('Période'), headerCell('Statut')] }),
        ...phases.map((p, i) =>
          new TableRow({ children: [
            dataCell(p.nom, i % 2 === 1),
            dataCell(`${p.dateDebutPrevue ? new Date(p.dateDebutPrevue).toLocaleDateString('fr-FR') : '?'} → ${p.dateFinPrevue ? new Date(p.dateFinPrevue).toLocaleDateString('fr-FR') : '?'}`, i % 2 === 1),
            dataCell(p.statut, i % 2 === 1),
          ] })
        ),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [new TextRun({ text: `MCTN / SENUM — Note de financement ${ptf.acronyme}`, font: 'Tahoma', size: 16, color: TEAL })],
              alignment: AlignmentType.RIGHT,
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [new TextRun({ text: `Document confidentiel — ${new Date().toLocaleDateString('fr-FR')}`, font: 'Tahoma', size: 14, color: '999999' })],
              alignment: AlignmentType.CENTER,
            })],
          }),
        },
        children: sections,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }
}
