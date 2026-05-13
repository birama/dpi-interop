/**
 * Script paramétré : promeut une liste de cas d'usage vers `statutVueSection = PRIORISE`.
 *
 * Usage :
 *   docker cp promote_demo_cases.cjs pins-api:/app/promote_demo_cases.cjs
 *   docker exec pins-api node /app/promote_demo_cases.cjs PINS-METIER-001 PINS-TECH-0001 PINS-TECH-0002 PINS-TECH-0004
 *
 * Pour chaque code passé en argument :
 *   - vérifie l'existence du cas
 *   - applique la transition (statutVueSection actuel → PRIORISE) en une transaction
 *   - insère une ligne dans use_case_status_history pour la traçabilité
 *   - aligne statutImpl sur PRIORISE
 *
 * Sécurité :
 *   - Si le cas est déjà PRIORISE, SKIP
 *   - Si le cas est en PROPOSE et n'a pas d'adopteParInstitutionId, SKIP (refus d'adoption auto)
 *   - Si le cas est en ARCHIVE/FUSIONNE/RETIRE, SKIP
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const MOTIF = 'Promotion pré-atelier stratégique 19 mai 2026 — démo pilotée par DU MCTN';

async function main() {
  const codes = process.argv.slice(2);
  if (codes.length === 0) {
    console.error('Usage: node promote_demo_cases.cjs CODE1 CODE2 ...');
    process.exit(1);
  }

  const admin = await p.user.findUnique({ where: { email: 'admin@senum.sn' } });
  if (!admin) {
    console.error('Utilisateur admin@senum.sn introuvable');
    process.exit(1);
  }

  const SKIP_STATUSES = ['ARCHIVE', 'FUSIONNE', 'RETIRE'];
  let promoted = 0;
  let skipped = 0;

  for (const code of codes) {
    const cu = await p.casUsageMVP.findUnique({ where: { code } });
    if (!cu) {
      console.log(`[SKIP] ${code} : cas introuvable`);
      skipped++;
      continue;
    }
    if (cu.statutVueSection === 'PRIORISE') {
      console.log(`[SKIP] ${code} : déjà en PRIORISE`);
      skipped++;
      continue;
    }
    if (SKIP_STATUSES.includes(cu.statutVueSection)) {
      console.log(`[SKIP] ${code} : statut ${cu.statutVueSection} non-promouvable`);
      skipped++;
      continue;
    }
    if (cu.statutVueSection === 'PROPOSE' && !cu.adopteParInstitutionId) {
      console.log(`[SKIP] ${code} : PROPOSE sans institution adopteuse — utiliser /catalogue/propositions/:id/prioriser-rapide`);
      skipped++;
      continue;
    }

    const fromStatus = cu.statutVueSection;
    await p.$transaction(async tx => {
      await tx.casUsageMVP.update({
        where: { id: cu.id },
        data: { statutVueSection: 'PRIORISE', statutImpl: 'PRIORISE' },
      });
      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId: cu.id,
          statusFrom: fromStatus,
          statusTo: 'PRIORISE',
          motif: MOTIF,
          auteurUserId: admin.id,
          auteurNom: admin.email,
          auteurInstitution: 'SENUM SA',
        },
      });
    });

    console.log(`[OK] ${code} : ${fromStatus} → PRIORISE`);
    promoted++;
  }

  console.log(`\n${promoted} promus, ${skipped} skippés.`);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => p.$disconnect());
