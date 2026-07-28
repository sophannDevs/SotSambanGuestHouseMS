-- =============================================================================
--  Guest House Manager — drop the whole schema        *** DESTRUCTIVE, LOCAL ***
-- =============================================================================
--  Purpose : Wipe the schema completely, including Flyway's history, so the next
--            backend start re-runs EVERY migration from V001. Use this when a
--            migration was edited during development and Flyway reports a
--            checksum mismatch, or when you want a guaranteed clean slate.
--
--  Usage   : psql -U postgres -d guesthouse_db -f database/98-drop-schema.sql
--
--  WARNING : Everything in the database is destroyed — data AND structure.
--            Prefer 99-reset-database.sql if you only want to clear data.
--            Refuses to run against anything but guesthouse_db / guesthouse_test_db.
--
--  Local development only. There is no production equivalent of this script and
--  there must never be one.
-- =============================================================================

\set ON_ERROR_STOP on

DO $guard$
BEGIN
    IF current_database() NOT IN ('guesthouse_db', 'guesthouse_test_db') THEN
        RAISE EXCEPTION
            'Refusing to drop the schema of database "%". Only guesthouse_db or guesthouse_test_db are allowed.',
            current_database();
    END IF;
    RAISE NOTICE 'Dropping schema public in database "%" ...', current_database();
END
$guard$;

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore the grants a fresh database would have had.
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Re-create the extensions (they lived in the dropped schema).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- If a dedicated app role exists, hand the schema back to it.
DO $owner$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'guesthouse_app') THEN
        EXECUTE 'ALTER SCHEMA public OWNER TO guesthouse_app';
        EXECUTE 'GRANT ALL ON SCHEMA public TO guesthouse_app';
        RAISE NOTICE 'Schema ownership returned to guesthouse_app.';
    END IF;
END
$owner$;

\echo ''
\echo '=============================================================='
\echo ' Schema dropped and re-created. Extensions reinstalled.'
\echo ' Start the backend to run all Flyway migrations from V001:'
\echo '     cd guesthouse-api && ./mvnw spring-boot:run'
\echo '=============================================================='
