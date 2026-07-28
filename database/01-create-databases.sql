-- =============================================================================
--  Guest House Manager — create local databases
-- =============================================================================
--  Purpose : Create the development and test databases plus the extensions the
--            schema needs, on a LOCAL PostgreSQL 15+ instance.
--  Run as  : the postgres superuser (extensions require superuser).
--  Usage   : psql -U postgres -f database/01-create-databases.sql
--  Safe to re-run: yes, every statement is idempotent.
--
--  This is local development only. No cloud database, no container.
-- =============================================================================

\set ON_ERROR_STOP on
\echo '== Guest House Manager: creating local databases =='

-- -----------------------------------------------------------------------------
-- 1. Databases
--    PostgreSQL has no CREATE DATABASE IF NOT EXISTS, so generate the statement
--    conditionally and execute it with psql's \gexec.
-- -----------------------------------------------------------------------------

SELECT format('CREATE DATABASE %I WITH ENCODING ''UTF8'' TEMPLATE template0', 'guesthouse_db')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'guesthouse_db')
\gexec

SELECT format('CREATE DATABASE %I WITH ENCODING ''UTF8'' TEMPLATE template0', 'guesthouse_test_db')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'guesthouse_test_db')
\gexec

\echo '-- databases ensured: guesthouse_db, guesthouse_test_db'

-- -----------------------------------------------------------------------------
-- 2. Store timestamps in UTC. The application derives business dates from the
--    property timezone; the database itself always speaks UTC.
--    (ALTER DATABASE SET takes effect for new connections.)
-- -----------------------------------------------------------------------------

ALTER DATABASE guesthouse_db      SET timezone TO 'UTC';
ALTER DATABASE guesthouse_test_db SET timezone TO 'UTC';

\echo '-- session timezone for both databases set to UTC'

-- -----------------------------------------------------------------------------
-- 3. Extensions, per database.
--
--    pgcrypto    gen_random_uuid() and digest helpers
--    btree_gist  lets a GiST exclusion constraint mix uuid equality with a
--                daterange overlap — this is what makes the "no overlapping
--                reservations for one room" constraint possible
--    pg_trgm     trigram GIN indexes behind global guest / document search
--    unaccent    accent-insensitive search
--
--    Flyway migration V001 also runs CREATE EXTENSION IF NOT EXISTS for these,
--    but creating them here means the application can connect with a plain,
--    non-superuser role.
-- -----------------------------------------------------------------------------

\connect guesthouse_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
\echo '-- extensions ensured in guesthouse_db'

\connect guesthouse_test_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
\echo '-- extensions ensured in guesthouse_test_db'

\echo ''
\echo '== Done. Next steps =='
\echo '   1. (recommended) create a dedicated app role:'
\echo '        psql -U postgres -f database/02-create-app-role.sql'
\echo '   2. verify the setup:'
\echo '        psql -U postgres -d guesthouse_db -f database/03-verify-setup.sql'
\echo '   3. start the backend; Flyway will create the schema.'
