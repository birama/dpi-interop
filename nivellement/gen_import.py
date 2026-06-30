"""Generate clean SQL for nivellement local -> prod using code-based FK mapping."""
import subprocess, re

def psql_local(query):
    r = subprocess.run(
        ['docker', 'exec', 'questionnaire-interop-db-1', 'psql', '-U', 'pins', '-d', 'questionnaire_interop', '-t', '-A', '-c', query],
        capture_output=True, text=True, timeout=30
    )
    return r.stdout.strip()

def cols(table):
    out = psql_local(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND table_schema='public' ORDER BY ordinal_position")
    return [c.strip() for c in out.split('\n') if c.strip() and c.strip() != 'id']

def esc(v):
    """Escape a value for SQL."""
    if v == r'\N' or v == '' or v is None:
        return 'NULL'
    if v == 'true':
        return 'true'
    if v == 'false':
        return 'false'
    if re.match(r'^-?\d+$', v):
        return v
    if re.match(r'^-?\d+\.\d+$', v):
        return v
    s = v.replace("'", "''")
    return f"'{s}'"

def map_by_code(table, col, id_val):
    """Generate subquery: (SELECT id FROM {table} WHERE code = (SELECT code FROM {table} WHERE id = '{id_val}'::uuid))"""
    return f"(SELECT id FROM {table} WHERE code = (SELECT code FROM {table} WHERE id = '{id_val}'::uuid))"

def generate_table(table, fk_mappings=None, unique_col='code', skip_cols=None, fallback_null_cols=None):
    """Generate INSERT statements for a table with FK mapping.

    fk_mappings: dict of column_name -> (ref_table, ref_code_col)
    skip_cols: list of columns to skip entirely (set to DEFAULT)
    fallback_null_cols: list of columns to set to NULL instead of their local value
    """
    if fk_mappings is None:
        fk_mappings = {}
    if skip_cols is None:
        skip_cols = []
    if fallback_null_cols is None:
        fallback_null_cols = []

    c = cols(table)
    c_filtered = [x for x in c if x not in skip_cols]

    cols_quoted = ', '.join(c_filtered)

    query = f"SELECT {cols_quoted} FROM {table} ORDER BY 1"
    out = psql_local(query)

    inserts = 0
    for line in out.split('\n'):
        if not line.strip():
            continue
        values = line.split('|')

        if len(values) != len(c_filtered):
            print(f"-- WARNING: column count mismatch in {table}: expected {len(c_filtered)}, got {len(values)}")
            continue

        vals = []
        for i, col in enumerate(c_filtered):
            v = values[i]

            if col in fallback_null_cols:
                vals.append('NULL')
                continue

            if col in fk_mappings:
                ref_table, ref_code = fk_mappings[col]
                if not v or v == r'\N':
                    vals.append('NULL')
                else:
                    vals.append(f"(SELECT id FROM {ref_table} WHERE {ref_code} = (SELECT {ref_code} FROM {ref_table} WHERE id = '{v}'::uuid))")
            else:
                vals.append(esc(v))

        vals_str = ', '.join(vals)

        if unique_col:
            print(f"INSERT INTO {table} ({cols_quoted}) VALUES ({vals_str}) ON CONFLICT ({unique_col}) DO NOTHING;")
        else:
            print(f"INSERT INTO {table} ({cols_quoted}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;")
        inserts += 1

    return inserts


# ================================================================
# MAIN
# ================================================================

print("BEGIN;")
print()
print("-- ================================================================")
print("-- Nivellement Local -> Prod — mapping par CODE (pas UUID)")
print("-- ================================================================")
print()

total = 0

# 1. cas_usage_mvp — FK: phaseMVPId, adopteParInstitutionId
print("-- 1. cas_usage_mvp")
n = generate_table('cas_usage_mvp',
    fk_mappings={
        '"phaseMVPId"': ('phases_mvp', 'code'),
        '"adopteParInstitutionId"': ('institutions', 'code'),
    },
    unique_col='code',
    fallback_null_cols=['"adopteParUserId"', '"fusionneVersId"', '"conventionLieeId"', '"adopteParInstitutionId"', '"adopteParUserId"']
)
total += n
print(f"-- {n} INSERTs")
print()

# 2. use_case_status_history — FK: casUsageId (map by cas_usage_mvp.code), auteurUserId=NULL
print("-- 2. use_case_status_history")
n = generate_table('use_case_status_history',
    fk_mappings={
        '"casUsageId"': ('cas_usage_mvp', 'code'),
    },
    unique_col=None,  # no unique constraint besides PK
    fallback_null_cols=['"auteurUserId"']
)
total += n
print(f"-- {n} INSERTs")
print()

# 3. cas_usage_registre — FK: casUsageId (map by code), registreId (map by code)
print("-- 3. cas_usage_registre")
n = generate_table('cas_usage_registre',
    fk_mappings={
        '"casUsageId"': ('cas_usage_mvp', 'code'),
        '"registreId"': ('registres_nationaux', 'code'),
    },
    unique_col=None,  # has composite unique but ON CONFLICT with composite is complex
    fallback_null_cols=['"ajoutePar"']
)
total += n
print(f"-- {n} INSERTs")
print()

# 4. institution_pressentie — FK: casUsageId (code), institutionId (code)
print("-- 4. institution_pressentie")
n = generate_table('institution_pressentie',
    fk_mappings={
        '"casUsageId"': ('cas_usage_mvp', 'code'),
        '"institutionId"': ('institutions', 'code'),
    },
    unique_col=None
)
total += n
print(f"-- {n} INSERTs")
print()

# 5. expertises — simple PK
print("-- 5. expertises")
n = generate_table('expertises',
    unique_col=None
)
total += n
print(f"-- {n} INSERTs")
print()

print("COMMIT;")
print()
print(f"-- Total: {total} INSERTs")
