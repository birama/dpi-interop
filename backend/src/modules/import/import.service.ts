// @ts-nocheck
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';

const isNeant = (val: string | null | undefined): boolean => {
  if (!val) return true;
  const v = val.trim().toLowerCase();
  return ['neant', 'néant', 'n/a', '-', 'aucun', 'aucune', 'non applicable', '', '…', '...'].includes(v);
};

const clean = (val: string | null | undefined): string | null => {
  if (!val || isNeant(val)) return null;
  return val.trim();
};

const parseBool = (val: string | null | undefined): boolean | null => {
  if (!val) return null;
  const v = val.trim().toLowerCase();
  if (['oui', 'yes', '1'].includes(v) || parseInt(v) > 0) return true;
  if (['non', 'no', '0', 'neant', 'néant', 'inexistante', 'inexistente'].includes(v)) return false;
  return null;
};

const parseDirection = (val: string | null | undefined): string => {
  if (!val) return 'BIDIRECTIONNEL';
  const v = val.toLowerCase();
  if (v.includes('bidirectionnel')) return 'BIDIRECTIONNEL';
  if (v.includes('envoi') && v.includes('réception')) return 'BIDIRECTIONNEL';
  if (v.includes('envoi')) return 'ENVOI';
  if (v.includes('réception') || v.includes('reception')) return 'RECEPTION';
  return 'BIDIRECTIONNEL';
};

interface ParsedData {
  sectionA: any;
  applications: any[];
  registres: any[];
  infrastructure: any[];
  donneesConsommer: any[];
  donneesFournir: any[];
  fluxExistants: any[];
  casUsage: any[];
  contraintes: any;
  maturite: any[];
  forces: any[];
  faiblesses: any[];
  attentes: any;
  institutionNomDeclare: string;
  institutionTrouvee: boolean;
  institutionId: string | null;
  institutionCode: string | null;
}

function identifyTable(headerText: string): string | null {
  const h = headerText.toLowerCase();
  if (h.includes('information demandée') || h.includes('information demand')) return 'A';
  if (h.includes('nom du si') || h.includes('application')) return 'B1';
  if (h.includes('nom du registre') || h.includes('base de référence')) return 'B2';
  if (h.includes('élément évalué') || h.includes('element evalu') || h.includes('disponibilité')) return 'B3';
  if (h.includes('donnée recherchée') || h.includes('donnee recherch')) return 'C1';
  if (h.includes('donnée proposée') || h.includes('donnee propos')) return 'C2';
  if ((h.includes('partenaire') && h.includes('convention')) || (h.includes('partenaire') && h.includes('problème'))) return 'C3';
  if ((h.includes('cas d') && h.includes('complexité')) || (h.includes('cas d') && h.includes('impact'))) return 'C4';
  if (h.includes('contrainte') && (h.includes('concerné') || h.includes('détail'))) return 'D1';
  if (h.includes('dimension') && h.includes('note')) return 'D2';
  if (h.includes('force identifiée') || h.includes('force identifi')) return 'E1';
  if (h.includes('faiblesse identifiée') || h.includes('faiblesse identifi')) return 'E2';
  if (h.includes('f.1') || (h.includes('question') && h.includes('réponse') && h.includes('préoccup'))) return 'F';
  return null;
}

function getDomain(text: string): string | null {
  const t = text.toUpperCase().replace(/[ÉÈÊË]/g, 'E').replace(/[ÀÂ]/g, 'A');
  if (t.includes('EQUIPEMENT') || t.includes('SYSTEME')) return 'EQUIPEMENTS_SYSTEME';
  if (t.includes('RESEAU') || t.includes('CONNECTIVITE')) return 'RESEAU_CONNECTIVITE';
  if (t.includes('API') && t.includes('SERVICE')) return 'API_SERVICES';
  if (t.includes('SECURITE') || t.includes('CERTIFICAT')) return 'SECURITE_CERTIFICATS';
  if (t.includes('ENERGIE') || t.includes('CONTINUITE')) return 'ENERGIE_CONTINUITE';
  if (t.includes('RESSOURCES') && t.includes('HUMAIN')) return 'RESSOURCES_HUMAINES';
  if (t.includes('LICENCE') || t.includes('LOGICIEL')) return 'LICENCES_LOGICIELS';
  return null;
}

export async function parseDocx(buffer: Buffer): Promise<ParsedData> {
  const result = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(result.value);

  const parsed: ParsedData = {
    sectionA: {}, applications: [], registres: [], infrastructure: [],
    donneesConsommer: [], donneesFournir: [], fluxExistants: [], casUsage: [],
    contraintes: { techniques: '', juridiques: '', organisationnelles: '' },
    maturite: [], forces: [], faiblesses: [], attentes: {},
    institutionNomDeclare: '', institutionTrouvee: false, institutionId: null, institutionCode: null,
  };

  const tables = $('table').toArray();

  for (const table of tables) {
    const rows = $(table).find('tr').toArray();
    if (rows.length < 2) continue;

    // Get header text from first row
    const headerCells = $(rows[0]).find('th, td').map((_, td) => $(td).text().trim()).get();
    const headerText = headerCells.join(' ');
    const tableType = identifyTable(headerText);

    if (!tableType) continue;

    const dataRows = rows.slice(1);

    switch (tableType) {
      case 'A': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 3) continue;
          const num = cells[0];
          const val = cells[2] || cells[1];
          if (num.includes('A.1')) parsed.sectionA.institutionNom = clean(val);
          if (num.includes('A.2')) parsed.sectionA.ministereTutelle = clean(val);
          if (num.includes('A.3')) parsed.sectionA.adresse = clean(val);
          if (num.includes('A.4')) parsed.sectionA.directeur = clean(val);
          if (num.includes('A.5')) {
            parsed.sectionA.dataOwnerNom = clean(val);
            const parts = (val || '').split(',').map(s => s.trim());
            if (parts.length > 1) { parsed.sectionA.dataOwnerNom = parts[0]; parsed.sectionA.dataOwnerFonction = parts.slice(1).join(', '); }
          }
          if (num.includes('A.6')) {
            parsed.sectionA.dataStewardNom = clean(val);
            const parts = (val || '').split(',').map(s => s.trim());
            if (parts.length > 1) { parsed.sectionA.dataStewardNom = parts[0]; parsed.sectionA.dataStewardProfil = parts.slice(1).join(', '); }
          }
          if (num.includes('A.7')) parsed.sectionA.telephone = clean(val);
          if (num.includes('A.8')) parsed.sectionA.email = clean(val);
          if (num.includes('A.9')) parsed.sectionA.mission = clean(val);
        }
        parsed.institutionNomDeclare = parsed.sectionA.institutionNom || '';
        break;
      }

      case 'B1': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2 || isNeant(cells[0])) continue;
          parsed.applications.push({ nom: clean(cells[0]), editeur: clean(cells[1]), description: clean(cells[2]), anneeInstallation: parseInt(cells[3]) || null });
        }
        break;
      }

      case 'B2': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2 || isNeant(cells[0])) continue;
          parsed.registres.push({ nom: clean(cells[0]), description: clean(cells[1]), volumetrie: clean(cells[2]) });
        }
        break;
      }

      case 'B3': {
        let currentDomain = 'EQUIPEMENTS_SYSTEME';
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 3) continue;
          const combined = cells.join(' ');
          const domain = getDomain(combined);
          if (domain) { currentDomain = domain; continue; }
          const element = clean(cells[1]) || clean(cells[0]);
          if (!element) continue;
          parsed.infrastructure.push({
            domain: currentDomain, element,
            disponibilite: parseBool(cells[2]),
            qualifications: clean(cells[3]),
            observations: clean(cells[4]),
          });
        }
        break;
      }

      case 'C1': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 3 || isNeant(cells[0])) continue;
          parsed.donneesConsommer.push({ donnee: clean(cells[0])!, source: clean(cells[1]) || '', usage: clean(cells[2]), priorite: parseInt(cells[6] || cells[5]) || 3 });
        }
        break;
      }

      case 'C2': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 3 || isNeant(cells[0])) continue;
          parsed.donneesFournir.push({ donnee: clean(cells[0])!, destinataires: clean(cells[1]), frequence: clean(cells[3]), format: clean(cells[2]) });
        }
        break;
      }

      case 'C3': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 4 || isNeant(cells[0])) continue;
          parsed.fluxExistants.push({
            partenaire: clean(cells[0])!, donneesEchangees: clean(cells[1]),
            direction: parseDirection(cells[2]), mode: clean(cells[3]),
            frequence: clean(cells[4]), problemes: clean(cells[5]),
            conventionFormalisee: parseBool(cells[6]),
          });
        }
        break;
      }

      case 'C4': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 3 || isNeant(cells[0])) continue;
          parsed.casUsage.push({ titre: clean(cells[0])!, acteurs: clean(cells[1]), impact: clean(cells[2]), complexite: clean(cells[3]), priorite: parseInt(cells[4]) || 3 });
        }
        break;
      }

      case 'D1': {
        let currentCategory = 'techniques';
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          const combined = cells.join(' ').toUpperCase();
          if (combined.includes('TECHNIQUE')) { currentCategory = 'techniques'; continue; }
          if (combined.includes('JURIDIQUE')) { currentCategory = 'juridiques'; continue; }
          if (combined.includes('ORGANISATIONNEL')) { currentCategory = 'organisationnelles'; continue; }
          if (cells.length >= 2 && !isNeant(cells[0])) {
            const detail = cells.slice(1).filter(c => !isNeant(c)).join(' — ');
            if (detail) parsed.contraintes[currentCategory] += (parsed.contraintes[currentCategory] ? '. ' : '') + cells[0] + ' : ' + detail;
          }
        }
        break;
      }

      case 'D2': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2 || isNeant(cells[0])) continue;
          parsed.maturite.push({ dimension: clean(cells[0])!, note: parseInt(cells[1]) || null, commentaire: clean(cells[2]) });
        }
        break;
      }

      case 'E1': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2 || isNeant(cells[1])) continue;
          parsed.forces.push({ numero: parseInt(cells[0]) || 0, description: clean(cells[1])!, domaine: clean(cells[2]) });
        }
        break;
      }

      case 'E2': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2 || isNeant(cells[1])) continue;
          parsed.faiblesses.push({ numero: parseInt(cells[0]) || 0, description: clean(cells[1])!, actionCorrective: clean(cells[2]) });
        }
        break;
      }

      case 'F': {
        for (const row of dataRows) {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          if (cells.length < 2) continue;
          const num = cells[0];
          const val = clean(cells[1] || cells[2]);
          if (num.includes('F.1')) parsed.attentes.questionsPreoccupations = val;
          if (num.includes('F.2')) parsed.attentes.risquesIdentifies = val;
          if (num.includes('F.3')) parsed.attentes.contributionsSpecifiques = val;
          if (num.includes('F.4')) parsed.attentes.besoinsFormation = val;
          if (num.includes('F.5')) parsed.attentes.suggestionsGouvernance = val;
          if (num.includes('F.6')) parsed.attentes.autresRemarques = val;
        }
        break;
      }
    }
  }

  return parsed;
}

export async function matchInstitution(app: FastifyInstance, parsed: ParsedData): Promise<ParsedData> {
  const nom = parsed.institutionNomDeclare;
  if (!nom) return parsed;

  // Try exact match
  let inst = await app.prisma.institution.findFirst({ where: { nom: { equals: nom, mode: 'insensitive' } } });
  // Try partial match
  if (!inst) inst = await app.prisma.institution.findFirst({ where: { nom: { contains: nom.split(' ').slice(-2).join(' '), mode: 'insensitive' } } });
  // Try code extraction (acronym from first letters)
  if (!inst) {
    const words = nom.split(/[\s-]+/).filter(w => w.length > 2 && w[0] === w[0].toUpperCase());
    const code = words.map(w => w[0]).join('');
    if (code.length >= 2) inst = await app.prisma.institution.findFirst({ where: { code: { equals: code, mode: 'insensitive' } } });
  }

  if (inst) {
    parsed.institutionTrouvee = true;
    parsed.institutionId = inst.id;
    parsed.institutionCode = inst.code;
  }

  return parsed;
}

export async function confirmImport(app: FastifyInstance, data: ParsedData & { institutionId: string; contentHash?: string; filename?: string }): Promise<any> {
  const instId = data.institutionId;

  // Check existing submission (any status, not just DRAFT)
  let sub = await app.prisma.submission.findFirst({
    where: { institutionId: instId },
    orderBy: { createdAt: 'desc' },
  });

  // If same hash → skip (exact same file already imported)
  if (sub && data.contentHash && (sub as any).importHash === data.contentHash) {
    return { submissionId: sub.id, skipped: true, message: 'Fichier déjà importé (contenu identique). Aucune modification.' };
  }

  if (sub) {
    // Clean existing related data before re-import
    await app.prisma.application.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.registre.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.infrastructureItem.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.donneeConsommer.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.donneeFournir.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.fluxExistant.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.casUsage.deleteMany({ where: { submissionId: sub.id } });
    await app.prisma.niveauInterop.deleteMany({ where: { submissionId: sub.id } });
  } else {
    sub = await app.prisma.submission.create({ data: { institutionId: instId, status: 'DRAFT', currentStep: 0 } });
  }

  const subId = sub.id;
  const sa = data.sectionA;
  const avgMaturite = data.maturite.length > 0 ? Math.round(data.maturite.reduce((s, m) => s + (m.note || 0), 0) / data.maturite.length) : 3;

  // Update submission
  await app.prisma.submission.update({
    where: { id: subId },
    data: {
      currentStep: 7, status: 'SUBMITTED', submittedAt: new Date(),
      importHash: data.contentHash || null, importFilename: data.filename || null, importedAt: new Date(),
      dataOwnerNom: sa.dataOwnerNom || sa.directeur, dataOwnerFonction: sa.dataOwnerFonction,
      dataStewardNom: sa.dataStewardNom, dataStewardProfil: sa.dataStewardProfil,
      dataStewardEmail: sa.email, dataStewardTelephone: sa.telephone,
      contraintesJuridiques: data.contraintes.juridiques || null,
      contraintesTechniques: data.contraintes.techniques || null,
      maturiteInfra: avgMaturite, maturiteDonnees: avgMaturite, maturiteCompetences: avgMaturite, maturiteGouvernance: avgMaturite,
      forces: data.forces.map(f => f.description).join('. ') || null,
      faiblesses: data.faiblesses.map(f => f.description).join('. ') || null,
      attentes: [data.attentes.questionsPreoccupations, data.attentes.besoinsFormation, data.attentes.suggestionsGouvernance].filter(Boolean).join('. ') || null,
      contributions: data.attentes.contributionsSpecifiques || null,
    },
  });

  // Applications
  if (data.applications.length > 0) {
    await app.prisma.application.createMany({ data: data.applications.map((a, i) => ({ submissionId: subId, nom: a.nom, description: a.description || a.editeur, editeur: a.editeur, anneeInstallation: a.anneeInstallation, ordre: i })) });
  }

  // Registres
  if (data.registres.length > 0) {
    await app.prisma.registre.createMany({ data: data.registres.map((r, i) => ({ submissionId: subId, nom: r.nom, description: r.description, volumetrie: r.volumetrie, ordre: i })) });
  }

  // Infrastructure
  if (data.infrastructure.length > 0) {
    await app.prisma.infrastructureItem.createMany({ data: data.infrastructure.map(item => ({ submissionId: subId, domain: item.domain, element: item.element, disponibilite: item.disponibilite, qualifications: item.qualifications, observations: item.observations })) });
  }

  // Données à consommer
  if (data.donneesConsommer.length > 0) {
    await app.prisma.donneeConsommer.createMany({ data: data.donneesConsommer.map((d, i) => ({ submissionId: subId, donnee: d.donnee, source: d.source, usage: d.usage, priorite: d.priorite || 3, ordre: i })) });
  }

  // Données à fournir
  if (data.donneesFournir.length > 0) {
    await app.prisma.donneeFournir.createMany({ data: data.donneesFournir.map((d, i) => ({ submissionId: subId, donnee: d.donnee, destinataires: d.destinataires, frequence: d.frequence, format: d.format, ordre: i })) });
  }

  // Flux existants
  if (data.fluxExistants.length > 0) {
    const inst = await app.prisma.institution.findUnique({ where: { id: instId } });
    const code = inst?.code || 'UNKNOWN';
    await app.prisma.fluxExistant.createMany({ data: data.fluxExistants.map((f, i) => ({
      submissionId: subId,
      source: f.direction === 'RECEPTION' ? f.partenaire : code,
      destination: f.direction === 'RECEPTION' ? code : f.partenaire,
      donnee: f.donneesEchangees, mode: f.mode || 'Fichier (CSV/Excel)', frequence: f.frequence, ordre: i,
    })) });
  }

  // Cas d'usage
  if (data.casUsage.length > 0) {
    await app.prisma.casUsage.createMany({ data: data.casUsage.map((c, i) => ({ submissionId: subId, titre: c.titre, description: c.titre, acteurs: c.acteurs, priorite: c.priorite || 3, ordre: i })) });
  }

  // Maturité
  if (data.maturite.length > 0) {
    await app.prisma.niveauInterop.createMany({ data: data.maturite.map(m => ({ submissionId: subId, niveau: 'TECHNIQUE', question: m.dimension, reponse: `${m.note}/5`, details: m.commentaire })) });
  }

  // Create user if email available
  if (sa.email) {
    const existing = await app.prisma.user.findUnique({ where: { email: sa.email } });
    if (!existing) {
      const hash = await bcrypt.hash('Password@123', 10);
      await app.prisma.user.create({ data: { email: sa.email, password: hash, role: 'INSTITUTION', institutionId: instId, mustChangePassword: true } });
    }
  }

  return {
    submissionId: subId,
    institutionCode: data.institutionCode,
    updated: !!sub,
    nbApps: data.applications.length,
    nbRegistres: data.registres.length,
    nbInfra: data.infrastructure.length,
    nbConsommer: data.donneesConsommer.length,
    nbFournir: data.donneesFournir.length,
    nbFlux: data.fluxExistants.length,
    nbCasUsage: data.casUsage.length,
    nbMaturite: data.maturite.length,
    scoreMoyenMaturite: avgMaturite,
    nbForces: data.forces.length,
    nbFaiblesses: data.faiblesses.length,
  };
}
