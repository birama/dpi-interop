/**
 * Import idempotent ENRICH-2026-07 — 6 propositions de cas d'usage
 * Idempotent sur le code. Delta strict +3 METIER, +3 TECHNIQUE.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CasEntry {
  code_propose: string;
  intitule: string;
  typologie: 'METIER' | 'TECHNIQUE';
  domaine_propose: string;
  statut_propose: string;
  evenement_de_vie?: string;
  demarche_guichet_correspondante?: string;
  description?: string;
  acteurs?: string[];
  registres?: string[];
  flux_pins_associes?: string[];
  rattachement_ndt?: string;
  cadre_juridique?: string;
  prerequis?: string[];
  indicateurs?: string[];
  reference_internationale?: string;
  pilote_sectoriel_a_valider?: string;
  source_fiche?: string;
}

interface Referentiel {
  source: string;
  cas_usage: CasEntry[];
}

function section(title: string, items: string[] | undefined): string {
  if (!items || items.length === 0) return '';
  return `## ${title}\n${items.map((s) => `- ${s.trim()}`).join('\n')}\n`;
}

function buildNotes(entry: CasEntry): string | null {
  const parts: string[] = [];

  if (entry.demarche_guichet_correspondante) {
    parts.push(`## Démarche guichet correspondante\n${entry.demarche_guichet_correspondante.trim()}`);
  }
  const s = (t: string, d: string | undefined) => { if (d) parts.push(d); };
  s('', section('Acteurs', entry.acteurs));
  s('', section('Registres mobilisés', entry.registres));
  s('', section('Flux PINS associés', entry.flux_pins_associes));
  if (entry.rattachement_ndt) parts.push(`## Rattachement New Deal Technologique\n${entry.rattachement_ndt.trim()}`);
  if (entry.pilote_sectoriel_a_valider) parts.push(`## Pilote sectoriel (à valider)\n${entry.pilote_sectoriel_a_valider.trim()}`);
  s('', section('Prérequis', entry.prerequis));
  s('', section('Indicateurs de suivi', entry.indicateurs));
  if (entry.reference_internationale) parts.push(`## Référence internationale\n${entry.reference_internationale.trim()}`);
  if (entry.source_fiche) parts.push(`## Source\n${entry.source_fiche.trim()}`);

  return parts.length > 0 ? parts.join('\n\n') : null;
}

async function countTypologie() {
  const rows = await prisma.casUsageMVP.groupBy({ by: ['typologie'], _count: { _all: true } });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.typologie] = r._count._all;
  return counts;
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(__dirname, 'PINS_enrichissement_ENRICH-2026-07.json');
  console.log(`Source : ${jsonPath}`);
  const raw = readFileSync(jsonPath, 'utf-8');
  const ref = JSON.parse(raw) as Referentiel;

  // ---- AVANT ----
  const typoAvant = await countTypologie();
  const totalAvant = Object.values(typoAvant).reduce((a, b) => a + b, 0);
  console.log(`\n=== AVANT ===`);
  console.log(`Total       : ${totalAvant}`);
  console.log(`Typologie   : ${JSON.stringify(typoAvant)}`);

  // ---- IMPORT ----
  let crees = 0, majs = 0;
  for (const entry of ref.cas_usage) {
    const data = {
      titre: entry.intitule,
      typologie: entry.typologie as any,
      domaine: entry.domaine_propose as any,
      statutVueSection: 'PROPOSE' as any,
      statutImpl: 'IDENTIFIE' as any,
      sourceProposition: 'PROPOSITION_INSTITUTIONNELLE' as any,
      impact: 'MOYEN' as any,
      aFinancer: false,
      description: entry.description ?? null,
      resumeMetier: entry.evenement_de_vie ? `Événement de vie : ${entry.evenement_de_vie.trim()}` : null,
      baseLegale: entry.cadre_juridique ?? null,
      notes: buildNotes(entry),
    };

    const existing = await prisma.casUsageMVP.findUnique({ where: { code: entry.code_propose } });
    if (existing) {
      await prisma.casUsageMVP.update({ where: { code: entry.code_propose }, data });
      majs++;
    } else {
      await prisma.casUsageMVP.create({ data: { code: entry.code_propose, ...data } });
      crees++;
    }
  }

  // ---- APRÈS ----
  const typoApres = await countTypologie();
  const totalApres = Object.values(typoApres).reduce((a, b) => a + b, 0);
  console.log(`\n=== RÉCAP ===`);
  console.log(`Créés  : ${crees}`);
  console.log(`MAJ    : ${majs}`);
  console.log(`\n=== APRÈS ===`);
  console.log(`Total       : ${totalApres}`);
  console.log(`Typologie   : ${JSON.stringify(typoApres)}`);

  // ---- ASSERTION DELTA STRICT ----
  const deltaMetier = (typoApres['METIER'] ?? 0) - (typoAvant['METIER'] ?? 0);
  const deltaTech = (typoApres['TECHNIQUE'] ?? 0) - (typoAvant['TECHNIQUE'] ?? 0);

  console.log(`\nDelta METIER     : ${deltaMetier > 0 ? '+' : ''}${deltaMetier} (attendu +3)`);
  console.log(`Delta TECHNIQUE   : ${deltaTech > 0 ? '+' : ''}${deltaTech} (attendu +3)`);

  if (deltaMetier !== 3 || deltaTech !== 3) {
    console.error(`\n❌ ÉCHEC — delta non conforme. Attendu: METIER +3, TECHNIQUE +3. Rollback : supprimer les 6 codes manuellement.`);
    process.exit(2);
  }

  console.log('\n✅ Import OK. 6 cas créés/mis à jour, delta conforme.');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Échec :', e); await prisma.$disconnect(); process.exit(1); });
