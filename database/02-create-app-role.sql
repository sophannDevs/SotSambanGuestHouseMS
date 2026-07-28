-- =============================================================================
--  Guest House Manager — dedicated local application role  (recommended)
-- =============================================================================
--  Purpose : Create a least-privilege role for the backend instead of connecting
--            as the postgres superuser. Recommended even locally, because it
--            catches "this migration needs superuser" mistakes now rather than
--            during a future deployment.
--  Run as  : the postgres superuser.
--  Usage   : psql -U postgres -v app_password="'change_me_locally'" \
--                 -f database/02-create-app-role.sql
--
--            If you omit -v app_password, the default below is used. Change it,
--            then put the same value in guesthouse-api/.env as DB_PASSWORD and
--            set DB_USERNAME=guesthouse_app.
--
--  Safe to re-run: yes.
-- =============================================================================

\set ON_ERROR_STOP on

-- Default password when -v app_password was not supplied on the command line.
\if :{?app_password}
\else
  \set app_password '''guesthouse_local_dev'''
\endif

\echo '== Guest House Manager: creating role guesthouse_app =='

-- -----------------------------------------------------------------------------
-- 1. The login role.
-- -----------------------------------------------------------------------------

SELECT format('CREATE ROLE guesthouse_app LOGIN PASSWORD %L', :app_password)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'guesthouse_app')
\gexec

-- Always (re)apply the password so re-running this script re-syncs it.
ALTER ROLE guesthouse_app WITH LOGIN PASSWORD :app_password;

-- Flyway needs to create tables, indexes, constraints and functions, so the
-- role owns the schema. It intentionally has no SUPERUSER, CREATEROLE or
-- CREATEDB attribute.
ALTER ROLE guesthouse_app SET timezone TO 'UTC';
ALTER ROLE guesthouse_app SET search_path TO public;

\echo '-- role guesthouse_app ensured'

-- -----------------------------------------------------------------------------
-- 2. Grants, per database.
-- -----------------------------------------------------------------------------

GRANT CONNECT ON DATABASE guesthouse_db      TO guesthouse_app;
GRANT CONNECT ON DATABASE guesthouse_test_db TO guesthouse_app;

\connect guesthouse_db
GRANT ALL ON SCHEMA public TO guesthouse_app;
ALTER SCHEMA public OWNER TO guesthouse_app;
-- Anything created later by any role stays usable by the app role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO guesthouse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO guesthouse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO guesthouse_app;
\echo '-- guesthouse_db grants applied'

\connect guesthouse_test_db
GRANT ALL ON SCHEMA public TO guesthouse_app;
ALTER SCHEMA public OWNER TO guesthouse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO guesthouse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO guesthouse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO guesthouse_app;
\echo '-- guesthouse_test_db grants applied'

\echo ''
\echo '== Done. Put these in guesthouse-api/.env =='
\echo '     DB_USERNAME=guesthouse_app'
\echo '     DB_PASSWORD=<the password you chose>'
\echo ''
\echo '   Extensions were already installed by 01-create-databases.sql as'
\echo '   superuser, so guesthouse_app does not need CREATE EXTENSION rights.'
