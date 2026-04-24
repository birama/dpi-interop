/**
 * Seed demo catalogue des propositions (P8) + typologie (P9)
 *
 * Usage : npx tsx prisma/seed-catalogue-p8p9.ts
 *
 * Cree 10 propositions typologiques :
 *   - 4 parcours METIER (coordinateur + pressenties)
 *   - 6 services TECHNIQUES (detenteur + consommateurs)
 *
 * Institutions pressenties coherentes avec les missions. Registres associes
 * realistes. Sources variees (ATELIER_CADRAGE, ETUDE_SENUM, RECOMMANDATION,
 * CADRAGE_STRATEGIQUE, PROPOSITION_INSTITUTIONNELLE).
 *
 * 100% idempotent : upsert sur codes PINS-PROP-DEMO-XX.
 * Pre-requis : institutions + admin@senum.sn + registres seeded.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PropSeed = {
  code: string;
  titre: string;
  resumeMetier: string;
  baseLegale?: string;
  typologie: 'METIER' | 'TECHNIQUE';
  sourceProposition: 'ATELIER_CADRAGE' | 'ETUDE_SENUM' | 'RECOMMANDATION' | 'CADRAGE_STRATEGIQUE' | 'PROPOSITION_INSTITUTIONNELLE';
  sourceDetail?: string;
  niveauMaturite: 'ESQUISSE' | 'PRE_CADREE' | 'PRETE_A_ADOPTER';
  axePrioritaire?: string;
  pressenties: Array<{ code: string; role: 'INITIATEUR_PRESSENTI' | 'FOURNISSEUR_PRESSENTI' | 'CONSOMMATEUR_PRESSENTI' | 'PARTIE_PRENANTE_PRESSENTIE'; commentaire?: string }>;
  registres?: Array<{ code: string; mode: 'CONSOMME' | 'ALIMENTE' | 'CREE'; champs?: string }>;
};

const PROPOSITIONS: PropSeed[] = [
  // ======= 4 PARCOURS METIER =======
  {
    code: 'PINS-PROP-DEMO-01',
    titre: 'Creation d\'entreprise en ligne',
    resumeMetier: 'Parcours entrepreneur unifie : de l\'immatriculation jusqu\'a l\'affiliation sociale, en passant par la verification NINEA, l\'enregistrement RCCM, l\'obtention d\'un NIF et l\'affiliation CSS/IPRES. Un seul point d\'entree, coordonne par APIX.',
    baseLegale: 'Acte uniforme OHADA sur le droit commercial, Loi 2008-08 sur le creation d\'entreprise au Senegal',
    typologie: 'METIER',
    sourceProposition: 'ATELIER_CADRAGE',
    sourceDetail: 'Identifie en atelier de cadrage Doing Business 2026 — priorite n°1 pour ameliorer le rang du Senegal sur la dimension "starting a business".',
    niveauMaturite: 'PRETE_A_ADOPTER',
    axePrioritaire: 'Doing Business',
    pressenties: [
      { code: 'APIX',  role: 'INITIATEUR_PRESSENTI', commentaire: 'APIX comme coordinateur naturel du guichet unique' },
      { code: 'DGID',  role: 'FOURNISSEUR_PRESSENTI', commentaire: 'Attribution du NIF et verification NINEA' },
      { code: 'ANSD',  role: 'FOURNISSEUR_PRESSENTI', commentaire: 'Repertoire national des entreprises' },
      { code: 'DGCPT', role: 'CONSOMMATEUR_PRESSENTI' },
    ],
    registres: [
      { code: 'NINEA', mode: 'CONSOMME', champs: 'NINEA, denomination, forme juridique' },
      { code: 'RCCM',  mode: 'ALIMENTE', champs: 'immatriculation, capital, gerants' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-02',
    titre: 'Attribution de bourse universitaire',
    resumeMetier: 'Parcours etudiant national : depot unique de demande, verification automatique de la situation fiscale des parents, de l\'inscription academique, de la situation de famille et consolidation de la decision. Suppression des depots redondants de pieces justificatives.',
    typologie: 'METIER',
    sourceProposition: 'CADRAGE_STRATEGIQUE',
    sourceDetail: 'Cadrage strategique national Senegal 2050 — axe education et transformation numerique du service public.',
    niveauMaturite: 'PRE_CADREE',
    axePrioritaire: 'Equite sociale',
    pressenties: [
      { code: 'MEN',   role: 'INITIATEUR_PRESSENTI', commentaire: 'Ministere de l\'Education Nationale — orchestrateur parcours etudiant' },
      { code: 'DGID',  role: 'FOURNISSEUR_PRESSENTI', commentaire: 'Verification de la situation fiscale familiale' },
      { code: 'ANSD',  role: 'FOURNISSEUR_PRESSENTI' },
      { code: 'IPRES', role: 'CONSOMMATEUR_PRESSENTI', commentaire: 'Coherence avec les donnees de retraite parentales' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-03',
    titre: 'Demande et renouvellement de passeport',
    resumeMetier: 'Parcours citoyen de bout en bout : depot en ligne, recuperation des pieces d\'etat civil depuis le registre national, verification casier judiciaire, paiement en ligne, convocation biometrique et suivi jusqu\'a la remise.',
    baseLegale: 'Decret 2021-XXX relatif aux titres de voyage',
    typologie: 'METIER',
    sourceProposition: 'RECOMMANDATION',
    sourceDetail: 'Recommandation de la CDP et de l\'ARTP dans le cadre de la simplification des demarches administratives.',
    niveauMaturite: 'ESQUISSE',
    axePrioritaire: 'Service au citoyen',
    pressenties: [
      { code: 'DGPN', role: 'INITIATEUR_PRESSENTI', commentaire: 'Direction generale de la Police nationale' },
      { code: 'MJ',   role: 'FOURNISSEUR_PRESSENTI', commentaire: 'Extrait casier judiciaire automatique' },
      { code: 'ANSD', role: 'FOURNISSEUR_PRESSENTI' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-04',
    titre: 'Inscription scolaire premier cycle',
    resumeMetier: 'Parcours famille pour l\'inscription d\'un enfant en primaire ou secondaire : verification de l\'etat civil, affectation d\'ecole selon le lieu de residence, confirmation d\'inscription, transfert du dossier scolaire.',
    typologie: 'METIER',
    sourceProposition: 'PROPOSITION_INSTITUTIONNELLE',
    sourceDetail: 'Proposition soumise conjointement par le Ministere de l\'Education nationale et l\'Association des Maires du Senegal.',
    niveauMaturite: 'PRE_CADREE',
    axePrioritaire: 'Service au citoyen',
    pressenties: [
      { code: 'MEN',  role: 'INITIATEUR_PRESSENTI', commentaire: 'Ministere de l\'Education nationale' },
      { code: 'ANSD', role: 'FOURNISSEUR_PRESSENTI', commentaire: 'Donnees demographiques pour affectation geographique' },
    ],
  },

  // ======= 6 SERVICES TECHNIQUES =======
  {
    code: 'PINS-PROP-DEMO-05',
    titre: 'Consultation RCCM',
    resumeMetier: 'API de consultation du Registre du Commerce et du Credit Mobilier pour verifier l\'immatriculation d\'une entreprise, ses gerants, son capital et son statut actif/radie.',
    typologie: 'TECHNIQUE',
    sourceProposition: 'ATELIER_CADRAGE',
    niveauMaturite: 'PRETE_A_ADOPTER',
    pressenties: [
      { code: 'MJ',    role: 'INITIATEUR_PRESSENTI', commentaire: 'Ministere de la Justice — detenteur du RCCM' },
      { code: 'APIX',  role: 'CONSOMMATEUR_PRESSENTI' },
      { code: 'DGID',  role: 'CONSOMMATEUR_PRESSENTI' },
    ],
    registres: [{ code: 'RCCM', mode: 'CONSOMME', champs: 'immatriculation, raison sociale, capital, statut' }],
  },
  {
    code: 'PINS-PROP-DEMO-06',
    titre: 'Verification casier judiciaire',
    resumeMetier: 'API de verification du casier judiciaire B3 d\'une personne physique, avec retour structure (vide / non vide) sans exposition des detailsprobants — respect de la proportionnalite.',
    baseLegale: 'Code de procedure penale, Loi 2008-12 sur la protection des donnees personnelles',
    typologie: 'TECHNIQUE',
    sourceProposition: 'RECOMMANDATION',
    sourceDetail: 'Recommandation CDP sur la proportionnalite : privilegier une API booleenne plutot qu\'un extrait complet.',
    niveauMaturite: 'PRE_CADREE',
    pressenties: [
      { code: 'MJ',   role: 'INITIATEUR_PRESSENTI' },
      { code: 'DGPN', role: 'CONSOMMATEUR_PRESSENTI' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-07',
    titre: 'Affiliation CSS',
    resumeMetier: 'API d\'affiliation d\'un salarie ou d\'un employeur a la Caisse de Securite Sociale, avec declenchement automatique depuis les processus metier amonts (embauche, creation d\'entreprise).',
    typologie: 'TECHNIQUE',
    sourceProposition: 'PROPOSITION_INSTITUTIONNELLE',
    niveauMaturite: 'ESQUISSE',
    pressenties: [
      { code: 'CSS',  role: 'INITIATEUR_PRESSENTI' },
      { code: 'APIX', role: 'CONSOMMATEUR_PRESSENTI' },
      { code: 'DGID', role: 'CONSOMMATEUR_PRESSENTI' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-08',
    titre: 'Affiliation IPRES',
    resumeMetier: 'API d\'affiliation a l\'Institution de Prevoyance Retraite du Senegal, automatisation de la declaration d\'emploi.',
    typologie: 'TECHNIQUE',
    sourceProposition: 'PROPOSITION_INSTITUTIONNELLE',
    niveauMaturite: 'ESQUISSE',
    pressenties: [
      { code: 'IPRES', role: 'INITIATEUR_PRESSENTI' },
      { code: 'APIX',  role: 'CONSOMMATEUR_PRESSENTI' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-09',
    titre: 'Requete GAINDE douaniere',
    resumeMetier: 'API structurant l\'interrogation du systeme douanier GAINDE pour recuperer une declaration, son statut, les droits et taxes applicables.',
    typologie: 'TECHNIQUE',
    sourceProposition: 'ETUDE_SENUM',
    niveauMaturite: 'PRE_CADREE',
    pressenties: [
      { code: 'DGD',   role: 'INITIATEUR_PRESSENTI' },
      { code: 'DGID',  role: 'CONSOMMATEUR_PRESSENTI' },
      { code: 'DGCPT', role: 'CONSOMMATEUR_PRESSENTI' },
    ],
  },
  {
    code: 'PINS-PROP-DEMO-10',
    titre: 'Extrait RNU beneficiaire',
    resumeMetier: 'API d\'extraction structure du Registre National Unique (RNU) pour qualifier un beneficiaire de programme social (bourse familiale, CMU, etc.).',
    typologie: 'TECHNIQUE',
    sourceProposition: 'CADRAGE_STRATEGIQUE',
    sourceDetail: 'Strategie nationale de protection sociale (SNPS) — pilier identification unique des beneficiaires.',
    niveauMaturite: 'PRETE_A_ADOPTER',
    pressenties: [
      { code: 'DGPSN', role: 'INITIATEUR_PRESSENTI', commentaire: 'Delegation generale a la Protection sociale et a la Solidarite nationale' },
      { code: 'ANSD',  role: 'FOURNISSEUR_PRESSENTI' },
    ],
  },
];

async function main() {
  console.log('=== Seed catalogue P8+P9 — 10 propositions demo ===');

  // 1. Resolutions prealables : codes d'institutions et registres
  const institutions = await prisma.institution.findMany({ select: { id: true, code: true } });
  const institutionsByCode = new Map(institutions.map(i => [i.code, i.id]));

  const registres = await prisma.registreNational.findMany({ select: { id: true, code: true } });
  const registresByCode = new Map(registres.map(r => [r.code, r.id]));

  const admin = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin@senum.sn' }, { role: 'ADMIN' }] },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });
  if (!admin) throw new Error('Aucun admin trouve — impossible d\'assigner un auteur pour les status history');

  let created = 0;
  let skipped = 0;
  const missingInstitutions = new Set<string>();
  const missingRegistres = new Set<string>();

  for (const prop of PROPOSITIONS) {
    // Verifier unicite par code
    const existing = await prisma.casUsageMVP.findUnique({ where: { code: prop.code } });
    if (existing) {
      skipped++;
      continue;
    }

    const cu = await prisma.$transaction(async (tx) => {
      const cu = await tx.casUsageMVP.create({
        data: {
          code: prop.code,
          titre: prop.titre,
          resumeMetier: prop.resumeMetier,
          baseLegale: prop.baseLegale || null,
          typologie: prop.typologie,
          statutVueSection: 'PROPOSE',
          statutImpl: 'IDENTIFIE',
          sourceProposition: prop.sourceProposition,
          sourceDetail: prop.sourceDetail || null,
          niveauMaturite: prop.niveauMaturite,
          axePrioritaire: prop.axePrioritaire || null,
          impact: 'MOYEN',
          dateIdentification: new Date(),
        },
      });

      for (const p of prop.pressenties) {
        const instId = institutionsByCode.get(p.code);
        if (!instId) {
          missingInstitutions.add(p.code);
          continue;
        }
        await tx.institutionPressentie.create({
          data: {
            casUsageId: cu.id,
            institutionId: instId,
            rolePressenti: p.role,
            commentaire: p.commentaire || null,
          },
        });
      }

      if (prop.registres) {
        for (const r of prop.registres) {
          const regId = registresByCode.get(r.code);
          if (!regId) {
            missingRegistres.add(r.code);
            continue;
          }
          await tx.casUsageRegistre.create({
            data: {
              casUsageId: cu.id,
              registreId: regId,
              mode: r.mode,
              champsConcernes: r.champs || null,
              ajoutePar: admin.id,
            },
          });
        }
      }

      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId: cu.id,
          statusFrom: null,
          statusTo: 'PROPOSE',
          motif: `Creation de proposition — seed demo P8+P9 — source ${prop.sourceProposition}`,
          auteurUserId: admin.id,
          auteurNom: admin.email,
          auteurInstitution: 'SENUM SA',
        },
      });

      return cu;
    });

    created++;
    console.log(`  + ${cu.code} [${prop.typologie}] — ${prop.titre.substring(0, 60)}${prop.titre.length > 60 ? '…' : ''}`);
  }

  console.log(`\nResume : ${created} cree(s), ${skipped} ignore(s) (deja presents).`);
  if (missingInstitutions.size > 0) {
    console.log(`Institutions non trouvees (ignorees) : ${[...missingInstitutions].join(', ')}`);
  }
  if (missingRegistres.size > 0) {
    console.log(`Registres non trouves (ignores) : ${[...missingRegistres].join(', ')}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
