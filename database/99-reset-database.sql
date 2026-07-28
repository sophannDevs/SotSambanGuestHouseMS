-- =============================================================================
--  Guest House Manager — reset local demo data          *** LOCAL ONLY ***
-- =============================================================================
--  Purpose : Empty every application table so the backend re-seeds demo data on
--            its next start. The schema and the Flyway history are preserved,
--            so no migration re-runs.
--
--  Usage   : psql -U postgres -d guesthouse_db -f database/99-reset-database.sql
--
--  WARNING : This deletes ALL data in the target database, including any
--            reservations, payments and invoices you created by hand. It exists
--            for local development only. It refuses to run against any database
--            other than guesthouse_db or guesthouse_test_db.
--
--  After running this, restart the backend with SEED_DEMO_DATA=true to recreate
--  the demo property, rooms, guests, reservations, payments and tasks.
--
--  To also clear uploaded test files, delete guesthouse-api/uploads/* — or use
--  the local-profile dev endpoint, which does both:
--      POST /api/v1/dev/reset-data?clearUploads=true
-- =============================================================================

\set ON_ERROR_STOP on

-- -----------------------------------------------------------------------------
-- Guard: never let this run against an unexpected database.
-- -----------------------------------------------------------------------------
DO $guard$
BEGIN
    IF current_database() NOT IN ('guesthouse_db', 'guesthouse_test_db') THEN
        RAISE EXCEPTION
            'Refusing to reset database "%". This script only runs against guesthouse_db or guesthouse_test_db.',
            current_database();
    END IF;
    RAISE NOTICE 'Resetting data in database "%" ...', current_database();
END
$guard$;

-- -----------------------------------------------------------------------------
-- Truncate every base table in the public schema except Flyway's own history.
--
-- Discovering the table list dynamically means this script never goes stale as
-- migrations add tables. A single TRUNCATE ... CASCADE handles the foreign-key
-- graph in one statement, and RESTART IDENTITY resets any serial counters.
-- -----------------------------------------------------------------------------
DO $reset$
DECLARE
    table_list text;
    table_count int;
BEGIN
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', '),
           count(*)
      INTO table_list, table_count
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename <> 'flyway_schema_history';

    IF table_list IS NULL THEN
        RAISE NOTICE 'No application tables found. Has the backend been started yet?';
        RETURN;
    END IF;

    EXECUTE format('TRUNCATE TABLE %s RESTART IDENTITY CASCADE', table_list);
    RAISE NOTICE 'Truncated % table(s).', table_count;
END
$reset$;

-- -----------------------------------------------------------------------------
-- Report the result so the operator can see it worked.
-- -----------------------------------------------------------------------------
\echo ''
\echo '-- Row counts after reset (all should be 0) -------------------'
SELECT relname AS table_name, n_live_tup AS approx_rows
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY relname;

\echo ''
\echo '-- Flyway history is preserved -------------------------------'
SELECT count(*) AS migrations_applied FROM flyway_schema_history WHERE success;

\echo ''
\echo '=============================================================='
\echo ' Reset complete.'
\echo ' Restart the backend to re-seed demo data:'
\echo '     cd guesthouse-api && ./mvnw spring-boot:run'
\echo '=============================================================='
