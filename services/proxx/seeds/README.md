# Seeds Directory

## PURPOSE: CREDENTIAL SEEDING ONLY

Files in this directory are used **exclusively** to seed credentials into the
PostgreSQL database on first boot or when explicitly imported. They are NOT
mounted into running containers and are NOT the runtime source of truth.

## HOW IT WORKS

1. Place a `keys.json` file here with your credentials
2. On startup, proxx reads the file and seeds accounts into PostgreSQL
3. After seeding, the database is the single source of truth
4. The seed file is NOT mounted — it is read once at build/init time

## IMPORTANT

- The `keys.json` file in this directory is copied into the container image
  during `docker compose build` (not mounted at runtime)
- Never mount `keys.json` as a volume — this causes the file to be treated as
  a runtime config source instead of a seed file
- After credentials are seeded into the database, you can remove the seed file
- The database volume persists all accounts across container restarts

## FORMAT

See `keys.example.json` for the expected structure.

## RUNTIME CONFIG

At runtime, credentials come from:
1. PostgreSQL database (primary — SqlCredentialStore)
2. Environment variables (fallback for single-key setups)
3. Seed files (only during initial seeding)
