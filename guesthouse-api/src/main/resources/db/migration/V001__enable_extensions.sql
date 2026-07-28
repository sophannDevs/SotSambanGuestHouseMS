-- =============================================================================
--  V001 — PostgreSQL extensions and shared helpers
-- =============================================================================
--  First migration in the project. Establishes the database capabilities every
--  later migration depends on, so nothing downstream has to worry about them.
--
--  database/01-create-databases.sql normally installs these as superuser, in
--  which case each statement below is a no-op NOTICE. They are repeated here so
--  a database created by any other means still ends up correct.
-- =============================================================================

-- gen_random_uuid() for UUID primary key defaults, plus digest helpers.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Allows a GiST exclusion constraint to combine uuid equality with a daterange
-- overlap. This is what makes "one room can never hold two overlapping active
-- stays" enforceable by the database rather than only by application code.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Trigram GIN indexes behind global search (guest names, phone numbers, emails,
-- reservation / invoice / payment numbers).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Accent-insensitive matching, so a search for "Sok" also finds "Sŏk".
CREATE EXTENSION IF NOT EXISTS unaccent;


-- -----------------------------------------------------------------------------
--  Shared immutable helper: normalise text for search and duplicate detection.
--
--  Marked IMMUTABLE so it can be used inside expression indexes. unaccent() is
--  only STABLE because it depends on a dictionary, so it is called through
--  a fixed dictionary reference, which is safe to treat as immutable here.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gh_normalize_text(input text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
    RETURNS NULL ON NULL INPUT
AS $$
    SELECT lower(trim(unaccent('unaccent'::regdictionary, input)));
$$;

COMMENT ON FUNCTION gh_normalize_text(text) IS
    'Lower-cased, accent-stripped, trimmed form of a text value. Used by search and duplicate-detection indexes.';


-- -----------------------------------------------------------------------------
--  Sanity assertions: fail this migration loudly rather than let a later
--  migration fail with a confusing error.
-- -----------------------------------------------------------------------------
DO $check$
DECLARE
    missing text;
BEGIN
    SELECT string_agg(required.name, ', ' ORDER BY required.name)
      INTO missing
      FROM (VALUES ('pgcrypto'), ('btree_gist'), ('pg_trgm'), ('unaccent')) AS required(name)
     WHERE NOT EXISTS (SELECT 1 FROM pg_extension e WHERE e.extname = required.name);

    IF missing IS NOT NULL THEN
        RAISE EXCEPTION
            'Required PostgreSQL extension(s) missing: %. Run database/01-create-databases.sql as the postgres superuser.',
            missing;
    END IF;

    IF current_setting('server_version_num')::int < 150000 THEN
        RAISE EXCEPTION
            'PostgreSQL 15 or later is required, found %.', current_setting('server_version');
    END IF;
END
$check$;
