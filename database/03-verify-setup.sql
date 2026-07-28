-- =============================================================================
--  Guest House Manager — verify the local database setup
-- =============================================================================
--  Purpose : Prove the database is ready before starting the backend, and prove
--            the schema is healthy after Flyway has run.
--  Usage   : psql -U postgres -d guesthouse_db -f database/03-verify-setup.sql
--  Read-only: yes, this script changes nothing.
-- =============================================================================

\pset pager off
\echo '=============================================================='
\echo ' Guest House Manager — local database verification'
\echo '=============================================================='

\echo ''
\echo '-- 1. Server version (need PostgreSQL 15 or later) ------------'
SELECT current_setting('server_version')            AS server_version,
       current_setting('server_version_num')::int   AS version_num,
       current_setting('server_version_num')::int >= 150000 AS version_ok;

\echo ''
\echo '-- 2. Connection context --------------------------------------'
SELECT current_database() AS database,
       current_user       AS connected_as,
       current_schema()   AS schema,
       current_setting('TimeZone')          AS timezone,
       current_setting('server_encoding')   AS encoding;

\echo ''
\echo '-- 3. Required extensions -------------------------------------'
WITH required(name, purpose) AS (
    VALUES ('pgcrypto',   'gen_random_uuid() for UUID primary keys'),
           ('btree_gist', 'uuid equality inside GiST exclusion constraints'),
           ('pg_trgm',    'trigram indexes for global search'),
           ('unaccent',   'accent-insensitive search')
)
SELECT r.name,
       (e.extname IS NOT NULL) AS installed,
       e.extversion            AS version,
       r.purpose
FROM required r
LEFT JOIN pg_extension e ON e.extname = r.name
ORDER BY r.name;

\echo ''
\echo '-- 4. Flyway migration state ----------------------------------'
\echo '   (empty until the backend has been started at least once)'
SELECT installed_rank,
       version,
       description,
       type,
       success,
       to_char(installed_on, 'YYYY-MM-DD HH24:MI:SS') AS installed_on,
       execution_time || ' ms'                        AS took
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 15;

\echo ''
\echo '-- 4b. Failed migrations (must be empty) ----------------------'
SELECT version, description, installed_on
FROM flyway_schema_history
WHERE success = false;

\echo ''
\echo '-- 5. Table count and row counts ------------------------------'
SELECT relname                       AS table_name,
       n_live_tup                    AS approx_rows
FROM pg_stat_user_tables
ORDER BY relname;

\echo ''
\echo '-- 6. Exclusion constraints (double-booking guarantee) --------'
\echo '   Expect ex_reservation_rooms__no_overlap and ex_room_blocks__no_overlap'
SELECT con.conname            AS constraint_name,
       rel.relname            AS table_name,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE con.contype = 'x'
  AND ns.nspname = 'public'
ORDER BY rel.relname;

\echo ''
\echo '-- 7. Constraint inventory by kind ---------------------------'
SELECT CASE con.contype
           WHEN 'p' THEN 'primary key'
           WHEN 'f' THEN 'foreign key'
           WHEN 'u' THEN 'unique'
           WHEN 'c' THEN 'check'
           WHEN 'x' THEN 'exclusion'
           ELSE con.contype::text
       END        AS constraint_kind,
       count(*)   AS total
FROM pg_constraint con
JOIN pg_class rel   ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public'
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '-- 8. Tables missing the common audit columns ----------------'
\echo '   (expected: only flyway_schema_history and append-only history tables)'
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema
          AND c.table_name  = t.table_name
          AND c.column_name = 'created_at')
ORDER BY t.table_name;

\echo ''
\echo '-- 9. Money columns must be numeric, never float -------------'
\echo '   (this result MUST be empty)'
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type IN ('double precision', 'real')
ORDER BY table_name, column_name;

\echo ''
\echo '-- 10. Naive timestamps must not exist -----------------------'
\echo '   (this result MUST be empty; all instants are timestamptz)'
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'timestamp without time zone'
ORDER BY table_name, column_name;

\echo ''
\echo '-- 11. Database size ----------------------------------------'
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

\echo ''
\echo '=============================================================='
\echo ' Verification complete.'
\echo ' Checks 9 and 10 must return no rows. Check 3 must show all'
\echo ' four extensions installed. Check 4b must return no rows.'
\echo '=============================================================='
