# Database Migrations

This directory contains database migrations for the Rhizome project, managed by [node-pg-migrate](https://github.com/salsita/node-pg-migrate).

## Overview

Database migrations provide version control for your database schema, similar to how Git manages your code. Each migration file represents a discrete change to the database structure.

## Migration System

- **Tool**: node-pg-migrate (Flyway-like migration tool for Node.js/PostgreSQL)
- **Migrations Directory**: `/backend/migrations/`
- **Tracking Table**: `pgmigrations` (stores which migrations have been applied)
- **File Format**: SQL files with timestamp prefix
- **Execution**: Sequential, in filename order

## Commands

### Run Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration (use with caution!)
npm run migrate:down

# Create a new migration file
npm run migrate:create <name>
```

### Example: Creating a New Migration

```bash
cd backend
npm run migrate:create add-user-preferences-table
```

This creates a new file like `1234567890000_add-user-preferences-table.sql` in the migrations directory.

## Migration Behavior

### Local Development (without Docker)
- Migrations are **NOT** automatically run on server start
- Run manually using `npm run migrate`
- Provides control during development
- Start server with `npm run dev`

### Docker Development
- Migrations **automatically run** on container startup
- Enabled by `DOCKER=true` environment variable in docker-compose.yml
- No manual database access needed
- Start with `docker-compose up`

### Production Mode
- Migrations **automatically run** on server startup
- Enabled by `NODE_ENV=production`
- Ensures database is always up-to-date
- Application fails to start if migrations fail (fail-fast behavior)

### Skip Migrations
You can disable auto-migrations with:
```bash
SKIP_MIGRATIONS=true npm start
```

## Writing Migrations

### Migration File Structure

Migrations are pure SQL files:

```sql
-- Migration: add-user-preferences-table.sql

-- Create table
CREATE TABLE user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme text DEFAULT 'light',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comments
COMMENT ON TABLE user_preferences IS 'User application preferences';
```

### Best Practices

1. **Idempotency**: Use `IF EXISTS` / `IF NOT EXISTS` where possible
   ```sql
   CREATE TABLE IF NOT EXISTS table_name (...);
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name type;
   ```

2. **Forward-Only**: Generally don't modify existing migrations after they've been applied
   - Instead, create a new migration to make changes

3. **Atomic Changes**: Each migration should represent a single, logical change

4. **Add Comments**: Document why changes are being made
   ```sql
   COMMENT ON COLUMN users.is_admin IS 'Boolean flag indicating if user has admin privileges';
   ```

5. **Use Constraints**: Validate data at the database level
   ```sql
   CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
   ```

6. **Test Migrations**: Always test migrations on development database first

## Existing Migrations

1. **1600000000000_initial-schema.sql** - Complete initial database schema
2. **1600000001000_add-is-visible-to-projects.sql** - Project visibility flag
3. **1600000002000_add-is-enabled-to-users.sql** - User soft-delete functionality
4. **1600000003000_add-admin-role-to-users.sql** - Admin user flag
5. **1600000004000_web3auth-migration.sql** - Web3Auth integration tables
6. **1600000005000_remove-legacy-auth.sql** - Remove email/password auth
7. **1600000006000_allow-null-email.sql** - Support wallet-only users
8. **1600000007000_simplify-auth-system.sql** - Streamline auth tables

## Migration Tracking

The `pgmigrations` table tracks which migrations have been applied:

```sql
SELECT * FROM pgmigrations ORDER BY run_on;
```

This table is automatically managed by node-pg-migrate.

## Rollback Strategy

While `npm run migrate:down` exists, rollbacks should be used sparingly:

- **In Development**: Rollback is fine for experimentation
- **In Production**: Prefer forward-only migrations (create a new migration to undo changes)

### Why Forward-Only?

1. Rollbacks can be risky if data has changed
2. Multiple deployments may have run the migration
3. Forward migrations maintain a clear audit trail

## Troubleshooting

### Migration Failed

If a migration fails:

1. Check the error message
2. Fix the SQL in the migration file
3. Manually rollback the failed migration if needed:
   ```bash
   npm run migrate:down
   ```
4. Re-run migrations:
   ```bash
   npm run migrate
   ```

### Out-of-Order Migrations

node-pg-migrate enforces migration order. If you have:
- Migration A (timestamp 100)
- Migration C (timestamp 300) - already applied
- Migration B (timestamp 200) - trying to apply

This will fail. Always create new migrations with later timestamps.

### Manual Database Changes

If you make manual database changes outside of migrations:

1. Create a migration that represents those changes
2. Apply it to all environments
3. Avoid manual changes in the future - use migrations!

## Environment Variables

Migrations use the same database connection as the application:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Deployment

### Deployment Workflow

1. **Development**: Create and test migrations locally
2. **Commit**: Add migration files to Git
3. **Deploy**: Push to production
4. **Auto-Run**: Migrations run automatically on server startup (production mode)

### Terraform/Cloud Deployment

When deploying to cloud infrastructure:

- Migrations run automatically when backend container starts
- No manual database access required
- No proxy/tunnel needed
- Fail-fast behavior ensures database consistency

## References

- [node-pg-migrate Documentation](https://github.com/salsita/node-pg-migrate)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Project main documentation: `/CLAUDE.md`
