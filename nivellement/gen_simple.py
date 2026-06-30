"""Simple: pg_dump export, replace UUID FKs with code-based subqueries."""
import subprocess, re

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout

# 1. Get mappings from local
def get_map(table, key_col='code'):
    out = run(['docker', 'exec', 'questionnaire-interop-db-1', 'psql', '-U', 'pins', '-d', 'questionnaire_interop', '-t', '-A', '-c', f"SELECT id, {key_col} FROM {table}"])
    m = {}
    for line in out.split('\n'):
        if '|' in line:
            uid, code = line.split('|', 1)
            m[uid] = code.strip()
    return m

print("Getting maps...", flush=True)
phase_map = get_map('phases_mvp')
inst_map = get_map('institutions')
reg_map = get_map('registres_nationaux')
print(f"  phases={len(phase_map)} institutions={len(inst_map)} registres={len(reg_map)}", flush=True)

# 2. pg_dump the 5 tables
dump = run(['docker', 'exec', 'questionnaire-interop-db-1', 'pg_dump', '-U', 'pins', '-d', 'questionnaire_interop',
    '--data-only', '--column-inserts', '--no-comments',
    '-t', 'cas_usage_mvp',
    '-t', 'use_case_status_history',
    '-t', 'cas_usage_registre',
    '-t', 'institution_pressentie',
    '-t', 'expertises'])

# 3. Clean pg_dump output
lines = []
skip = True
for line in dump.split('\n'):
    if 'INSERT INTO' in line:
        skip = False
    if skip:
        continue
    if line.strip():
        lines.append(line)

sql = '\n'.join(lines)

# 4. Replace UUID values with code-based subqueries
# phaseMVPId: replace '<phase-uuid>' with (SELECT id FROM phases_mvp WHERE code = '<code>')
for uuid, code in phase_map.items():
    sql = sql.replace(f"'{uuid}'", f"(SELECT id FROM phases_mvp WHERE code = '{code}')")

# For cas_usage_registre: registreId FK
for uuid, code in reg_map.items():
    sql = sql.replace(f"'{uuid}'", f"(SELECT id FROM registres_nationaux WHERE code = '{code}')")

# For institution_pressentie: institutionId FK
for uuid, code in inst_map.items():
    # Only replace in institution_pressentie context — risky but we have no choice
    sql = sql.replace(f"'{uuid}'", f"(SELECT id FROM institutions WHERE code = '{code}')")

# 5. Add ON CONFLICT DO NOTHING
new_lines = []
for line in sql.split('\n'):
    if line.startswith('INSERT INTO ') and line.rstrip().endswith(');'):
        line = line.rstrip()[:-1] + ' ON CONFLICT DO NOTHING;'
    new_lines.append(line)
sql = '\n'.join(new_lines)

# 6. Wrap in transaction
print('BEGIN;')
print()
print(sql)
print()
print('COMMIT;')

inserts = sql.count('INSERT INTO')
print(f'-- {inserts} INSERTs total', flush=True)
