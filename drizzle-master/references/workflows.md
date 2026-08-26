# Drizzle Workflows

The following workflows are standard for Drizzle ORM in this repository. All commands must be run from the `apps/backend/` directory.

## 1. Modifying the Schema

### Step-by-Step
1.  **Modify/Add Schema File**: Navigate to `src/db/schema/` and make changes to the existing file or create a new one.
2.  **Export the Table**: If it's a new file, ensure it's exported in `src/db/schema/index.ts`.
3.  **Define Relations**: If applicable, update `src/db/schema/relations.ts`.
4.  **Generate Migration**: Run `npm run db:generate`.
5.  **Review Migration**: Check the generated SQL file in `drizzle/migrations/`.
6.  **Apply Migration (Local)**: Run `npm run db:migrate` or `npm run db:push`.

## 2. Common Scripts

| Command | Description |
| :--- | :--- |
| `npm run db:generate` | Generates a new migration SQL file based on schema changes. |
| `npm run db:migrate` | Runs existing migrations against the database. |
| `npm run db:push` | Pushes schema changes directly to the DB (good for local prototyping). |
| `npm run seed` | Executes the seeder script in `src/db/schema/seed.ts`. |

## 3. Database Connection
Drizzle uses the `DATABASE_URL` from `.env`. Ensure your local PostgreSQL is running (likely via Docker in this project).
