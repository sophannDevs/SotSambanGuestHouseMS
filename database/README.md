# `database/` — standalone SQL helpers

Plain `psql` scripts for setting up, checking and resetting the **local** PostgreSQL instance.
They are deliberately independent of the backend so you can prepare or repair the database without
starting Java.

The schema itself is **not** in this folder. It is created by Flyway migrations that live in
`guesthouse-api/src/main/resources/db/migration/` and run automatically when the backend starts.
See [../docs/local-database-setup.md](../docs/local-database-setup.md) for the full guide.

> Local development only. No cloud database, no container, no production equivalent of these scripts.

---

## Scripts

| Script | What it does | Run as | Destructive? |
|---|---|---|---|
| `01-create-databases.sql` | Creates `guesthouse_db` and `guesthouse_test_db`, sets both to UTC, installs the four required extensions | `postgres` superuser | No |
| `02-create-app-role.sql` | Creates the least-privilege login role `guesthouse_app` and grants it the `public` schema (recommended over using `postgres`) | `postgres` superuser | No |
| `03-verify-setup.sql` | Read-only health report: server version, extensions, Flyway state, table and constraint inventory, plus assertions that no money column is a float and no timestamp is naive | any user with read access | No |
| `99-reset-database.sql` | Truncates every application table so the backend re-seeds demo data; keeps the schema and Flyway history | owner of the tables | **Yes — deletes all data** |
| `98-drop-schema.sql` | Drops and re-creates the `public` schema so every migration re-runs from `V001` | owner of the schema | **Yes — deletes data and structure** |

All five are idempotent or safely repeatable, and both destructive scripts refuse to run against any
database other than `guesthouse_db` or `guesthouse_test_db`.

---

## Usual order, first time

```bash
psql -U postgres -f database/01-create-databases.sql
```

```bash
psql -U postgres -f database/02-create-app-role.sql
```

```bash
psql -U postgres -d guesthouse_db -f database/03-verify-setup.sql
```

Then start the backend — Flyway creates the schema and seeds demo data:

```bash
cd guesthouse-api && ./mvnw spring-boot:run
```

On Windows PowerShell the last command is `.\mvnw.cmd spring-boot:run`.

To choose your own application password instead of the built-in local default:

```bash
psql -U postgres -v app_password="'my_local_password'" -f database/02-create-app-role.sql
```

Then set `DB_USERNAME=guesthouse_app` and `DB_PASSWORD=my_local_password` in `guesthouse-api/.env`.

---

## Which reset do I want?

| Situation | Use |
|---|---|
| I want the demo data back the way it was | `99-reset-database.sql`, then restart the backend |
| I created messy test bookings and want a clean slate | `99-reset-database.sql`, then restart the backend |
| Flyway says **checksum mismatch** because I edited an applied migration | `98-drop-schema.sql`, then restart the backend |
| A migration failed halfway and the schema is inconsistent | `98-drop-schema.sql`, then restart the backend |
| I also want the uploaded test files gone | the local dev endpoint `POST /api/v1/dev/reset-data?clearUploads=true`, or delete `guesthouse-api/uploads/*` by hand |

The `/api/v1/dev/*` endpoints exist **only** under the `local` Spring profile, require the
`dev:reset_data` permission and require an explicit confirmation flag. They are not registered in any
other profile.

---

## Backing up local work

Before an experiment worth being able to undo:

```bash
pg_dump -U postgres -Fc -f guesthouse_db_backup.dump guesthouse_db
```

Restore it over the existing database:

```bash
pg_restore -U postgres -d guesthouse_db --clean --if-exists guesthouse_db_backup.dump
```

`.dump` files are git-ignored. Automated and off-machine backups are a future-roadmap item — see
[../docs/future-deployment-roadmap.md](../docs/future-deployment-roadmap.md).

---

## Why these extensions

| Extension | Needed for |
|---|---|
| `pgcrypto` | `gen_random_uuid()` defaults on every UUID primary key |
| `btree_gist` | Lets one GiST exclusion constraint combine `room_id WITH =` and `daterange(...) WITH &&` — this is the database-level guarantee that a room can never hold two overlapping active stays |
| `pg_trgm` | GIN trigram indexes behind global search over guest names, phone numbers, emails and document numbers |
| `unaccent` | Accent-insensitive matching so `Sok` finds `Sŏk` |

They are installed by `01-create-databases.sql` as superuser so that the application role never needs
`CREATE EXTENSION` rights. Migration `V001` also declares them with `IF NOT EXISTS` so a fresh
superuser-only setup still works.
