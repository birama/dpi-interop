"""Generate nivellement SQL v2 — direct psql approach."""
import subprocess

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        print(f"-- ERROR: {r.stderr}", flush=True)
    if r.stderr:
        pass  # psql sends warnings to stderr
    return r.stdout.strip()

# Test connection
print("-- Testing connection...", flush=True)
t = run(['docker', 'exec', 'questionnaire-interop-db-1', 'psql', '-U', 'pins', '-d', 'questionnaire_interop', '-t', '-A', '-c', "SELECT COUNT(*) FROM cas_usage_mvp"])
print(f"-- cas_usage_mvp count: {t}", flush=True)

# Generate INSERT for cas_usage_mvp with code-based FK mapping
print("BEGIN;", flush=True)
print("", flush=True)

# cas_usage_mvp: all columns, map phaseMVPId by code, NULLify some
q = """
SELECT
  'INSERT INTO cas_usage_mvp ('
  || string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  || ') VALUES ('
  || string_agg(
       CASE
         WHEN column_name = 'phaseMVPId' THEN
           '(SELECT id FROM phases_mvp WHERE code = (SELECT code FROM phases_mvp WHERE id = ''' || COALESCE(cmv."phaseMVPId"::text, '') || '''::uuid))'
         WHEN column_name = 'adopteParUserId' THEN 'NULL'
         WHEN column_name = 'adopteParInstitutionId' THEN 'NULL'
         WHEN column_name = 'fusionneVersId' THEN 'NULL'
         WHEN column_name = 'conventionLieeId' THEN 'NULL'
         WHEN column_name = 'reclassementsTypologie' THEN 'NULL'
         ELSE
           CASE
             WHEN cmv IS NULL OR cmv IS NULL THEN 'NULL'
             WHEN pg_typeof(cmv) = 'boolean' THEN quote_literal(cmv)
             WHEN pg_typeof(cmv) = 'integer' OR pg_typeof(cmv) = 'smallint' THEN cmv::text
             WHEN pg_typeof(cmv) = 'jsonb' THEN quote_literal(cmv::text)
             ELSE quote_literal(cmv::text)
           END
       END,
       ', ' ORDER BY ordinal_position
     )
  || ') ON CONFLICT (code) DO NOTHING;' AS sql
FROM information_schema.columns col
LEFT JOIN cas_usage_mvp cmv ON true
WHERE col.table_name = 'cas_usage_mvp' AND col.table_schema = 'public'
GROUP BY cmv.id, cmv.code
ORDER BY cmv.code
LIMIT 1
"""
result = run(['docker', 'exec', 'questionnaire-interop-db-1', 'psql', '-U', 'pins', '-d', 'questionnaire_interop', '-t', '-A', '-c', q])
print(result, flush=True)
"""

This dynamic cross-join approach is fragile. Let me use a simpler method:
dump as INSERT statements and post-process to replace values.
"""

# SIMPLEST APPROACH: pg_dump then Python replace of UUID values
import re

# Step 1: Get raw pg_dump
result = run([
    'docker', 'exec', 'questionnaire-interop-db-1',
    'pg_dump', '-U', 'pins', '-d', 'questionnaire_interop',
    '--data-only', '--column-inserts',
    '-t', 'cas_usage_mvp',
    '-t', 'use_case_status_history',
    '-t', 'cas_usage_registre',
    '-t', 'institution_pressentie',
    '-t', 'expertises'
])

if not result:
    print("-- ERROR: pg_dump returned empty", flush=True)
    exit(1)

lines = result.split('\n')
clean_lines = []
for line in lines:
    # Skip pg_dump metadata
    if line.startswith('pg_dump:') or line.startswith('\\restrict') or line.startswith('--') or line.startswith('SET ') or line.startswith('SELECT pg_catalog'):
        if line.strip():
            continue
    if not line.strip():
        continue
    clean_lines.append(line)

all_sql = '\n'.join(clean_lines)
print(f"-- Cleaned lines: {len(clean_lines)}", flush=True)

# Step 2: Get UUID-to-code mappings for FK resolution
def get_map(table, code_col='code'):
    """Get mapping of UUID -> code from local DB."""
    out = run([
        'docker', 'exec', 'questionnaire-interop-db-1',
        'psql', '-U', 'pins', '-d', 'questionnaire_interop',
        '-t', '-A', '-c',
        f"SELECT id, {code_col} FROM {table}"
    ])
    mapping = {}
    for line in out.split('\n'):
        if '|' in line:
            uid, code = line.split('|', 1)
            mapping[uid] = code
    return mapping

print("-- Building maps...", flush=True)
phase_map = get_map('phases_mvp')
inst_map = get_map('institutions')
reg_map = get_map('registres_nationaux')
print(f"-- Maps: {len(phase_map)} phases, {len(inst_map)} institutions, {len(reg_map)} registres", flush=True)

# Step 3: Replace UUID FKs with subqueries
# Pattern: phaseMVPId value appears as '<uuid>' in VALUES list
# We need to find UUIDs in the right column positions and replace them

# Simpler: use regex to replace known UUID patterns with subqueries
processed = all_sql

# Replace phase UUIDs with subquery
for uuid, code in phase_map.items():
    processed = processed.replace(f"'{uuid}'", f"(SELECT id FROM phases_mvp WHERE code = '{code}')")

# Replace institution UUIDs (be careful — only in FK context, not in VALUES generally)
# Actually, institution_pressentie has institutionId FK
# For institutionId in institution_pressentie:
for uuid, code in inst_map.items():
    # Only replace in institution_pressentie INSERTs (not in cas_usage_mvp general fields)
    # This is hard to do selectively with simple replace...
    pass

# Too complex. Let me use a different approach.
# Write INSERT statements with subqueries directly.

# Final approach: write BEGIN, generate INSERT with FK subsqueries per table, write COMMIT

print("BEGIN;")
print("")

# cas_usage_mvp
# phaseMVPId is the only FK that matters (others are nullable and can be NULL)
# Get the raw rows and generate INSERTs

# Get all cas_usage_mvp with phase code mapped
q = """SELECT
  id, code, "ancienCode", titre, description,
  "institutionSourceCode", "institutionCibleCode", "autresInstitutions",
  "donneesEchangees", "registresConcernes", "axePrioritaire",
  impact, complexite,
  (SELECT code FROM phases_mvp WHERE id = cm."phaseMVPId") as phase_code,
  "statutImpl", prerequis, "conventionRequise", "conventionSignee",
  "dateIdentification", "dateLancement", "dateMiseEnProd",
  notes, timeline, observations,
  "statutVueSection", "resumeMetier", "baseLegale",
  "createdAt", "updatedAt",
  "sourceProposition", "sourceDetail", "niveauMaturite",
  "dateAdoption", typologie, "codeHistorique"
FROM cas_usage_mvp cm ORDER BY code"""

stuff = run([
    'docker', 'exec', 'questionnaire-interop-db-1', 'psql', '-U', 'pins', '-d', 'questionnaire_interop',
    '-t', '-A', '-F', '|', '-c', q
])

n = 0
for line in stuff.split('\n'):
    if not line.strip(): continue
    f = line.split('|')
    id_v = f[0]; code_v = f[1]; anc_code = f[2]; titre_v = f[3]; desc = f[4]
    src_code = f[5]; cible_code = f[6]; autres = f[7]
    donnees = f[8]; reg_conc = f[9]; axe = f[10]
    impact_v = f[11]; complexite_v = f[12]; phase_code_v = f[13]
    statut_impl = f[14]; prerequis_v = f[15]; conv_req = f[16]; conv_sign = f[17]
    date_id = f[18]; date_lan = f[19]; date_mep = f[20]
    notes_v = f[21]; timeline_v = f[22]; obs = f[23]
    statut_vue = f[24]; resume = f[25]; base_leg = f[26]
    created = f[27]; updated = f[28]
    src_prop = f[29]; src_detail = f[30]; niv_mat = f[31]
    adopted_at = f[32]; typo = f[33]; code_hist = f[34]

    phase_sub = f"(SELECT id FROM phases_mvp WHERE code = '{phase_code_v}')" if phase_code_v and phase_code_v != r'\N' else 'NULL'

    print(f"INSERT INTO cas_usage_mvp (id, code, \"ancienCode\", titre, description, \"institutionSourceCode\", \"institutionCibleCode\", \"autresInstitutions\", \"donneesEchangees\", \"registresConcernes\", \"axePrioritaire\", impact, complexite, \"phaseMVPId\", \"statutImpl\", prerequis, \"conventionRequise\", \"conventionSignee\", \"dateIdentification\", \"dateLancement\", \"dateMiseEnProd\", notes, timeline, observations, \"statutVueSection\", \"resumeMetier\", \"baseLegale\", \"createdAt\", \"updatedAt\", \"sourceProposition\", \"sourceDetail\", \"niveauMaturite\", \"dateAdoption\", typologie, \"codeHistorique\") VALUES ('{id_v}', '{code_v}', {f"'{anc_code}'" if anc_code and anc_code != r'\N' else 'NULL'}, {f"'{titre_v}'" if titre_v else 'NULL'}, {f"'{desc}'" if desc and desc != r'\N' else 'NULL'}, {f"'{src_code}'" if src_code and src_code != r'\N' else 'NULL'}, {f"'{cible_code}'" if cible_code and cible_code != r'\N' else 'NULL'}, {f"'{autres}'" if autres and autres != r'\N' else 'NULL'}, {f"'{donnees}'" if donnees and donnees != r'\N' else 'NULL'}, {f"'{reg_conc}'" if reg_conc and reg_conc != r'\N' else 'NULL'}, {f"'{axe}'" if axe and axe != r'\N' else 'NULL'}, '{impact_v}', '{complexite_v}', {phase_sub}, '{statut_impl}', {f"'{prerequis_v}'" if prerequis_v and prerequis_v != r'\N' else 'NULL'}, {conv_req}, {conv_sign}, {f"'{date_id}'" if date_id and date_id != r'\N' else 'NULL'}, {f"'{date_lan}'" if date_lan and date_lan != r'\N' else 'NULL'}, {f"'{date_mep}'" if date_mep and date_mep != r'\N' else 'NULL'}, {f"'{notes_v}'" if notes_v and notes_v != r'\N' else 'NULL'}, {f"'{timeline_v}'" if timeline_v and timeline_v != r'\N' else 'NULL'}, {f"'{obs}'" if obs and obs != r'\N' else 'NULL'}, '{statut_vue}', {f"'{resume}'" if resume and resume != r'\N' else 'NULL'}, {f"'{base_leg}'" if base_leg and base_leg != r'\N' else 'NULL'}, '{created}', '{updated}', {f"'{src_prop}'" if src_prop and src_prop != r'\N' else 'NULL'}, {f"'{src_detail}'" if src_detail and src_detail != r'\N' else 'NULL'}, {f"'{niv_mat}'" if niv_mat and niv_mat != r'\N' else 'NULL'}, {f"'{adopted_at}'" if adopted_at and adopted_at != r'\N' else 'NULL'}, '{typo}', {f"'{code_hist}'" if code_hist and code_hist != r'\N' else 'NULL'}) ON CONFLICT (code) DO NOTHING;")
    n += 1

print(f"-- {n} cas_usage_mvp INSERTs")
