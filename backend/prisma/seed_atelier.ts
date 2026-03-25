import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Atelier@2026';

// Institutions invitées à l'atelier MVP 2.0
const INSTITUTIONS_ATELIER = [
  'DGID', 'DGD', 'ANSD', 'DGCPT', 'ANEC',    // Déjà avec comptes
  'DGPSN', 'IPRES', 'CSS', 'SEN-CSU', 'APIX',  // Nouvelles
  'ADIE', 'CDP', 'ARTP', 'GREFFE', 'CNCJ',
  'DAF', 'SENELEC', 'PETROSEN', 'ONAS', 'PAD',
  'SAED', 'ISRA', 'ANCAR', 'MSAS', 'PNA',
  'FONSIS', 'FONGIP', 'DER-FJ', 'ADEPME', 'SENUM',
];

async function main() {
  console.log('🎓 Création des comptes pour l\'atelier MVP 2.0');
  console.log('='.repeat(70));

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const csvLines: string[] = ['Institution;Code;Email;Mot de passe;Rôle'];
  let created = 0;
  let skipped = 0;

  for (const code of INSTITUTIONS_ATELIER) {
    // Trouver l'institution
    const institution = await prisma.institution.findUnique({
      where: { code },
    });

    if (!institution) {
      console.log(`⚠️  Institution ${code} non trouvée en base`);
      continue;
    }

    const email = `dsi@${code.toLowerCase().replace(/-/g, '')}.sn`;

    // Vérifier si le compte existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`⏭️  Existe: ${email}`);
      skipped++;
      csvLines.push(`${institution.nom};${code};${email};(compte existant);INSTITUTION`);
      continue;
    }

    // Créer le compte
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'INSTITUTION',
        institutionId: institution.id,
        mustChangePassword: true,
      },
    });

    console.log(`✅ Créé: ${email} → ${institution.nom}`);
    created++;
    csvLines.push(`${institution.nom};${code};${email};${DEFAULT_PASSWORD};INSTITUTION`);
  }

  // Ajouter le compte admin dans le CSV
  csvLines.push(`SENUM (Admin);ADMIN;admin@senum.sn;Admin@2026;ADMIN`);

  // Écrire le CSV
  const csvPath = path.join(__dirname, 'comptes_atelier.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

  console.log('\n' + '='.repeat(70));
  console.log('🎉 TERMINÉ');
  console.log(`   ✅ Comptes créés: ${created}`);
  console.log(`   ⏭️  Déjà existants: ${skipped}`);
  console.log(`   📄 CSV: ${csvPath}`);
  console.log('='.repeat(70));
  console.log('\n📋 Mot de passe par défaut: ' + DEFAULT_PASSWORD);
  console.log('   Les utilisateurs devront changer leur mot de passe à la première connexion.\n');
}

main()
  .catch((e) => { console.error('❌ Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
