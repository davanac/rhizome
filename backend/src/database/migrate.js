import pg from 'pg';
import { runner } from 'node-pg-migrate';
import path from 'path';
import { fileURLToPath } from 'url';
import Config from '#config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 * @param {Object} options - Migration options
 * @param {string} options.direction - 'up' or 'down'
 * @param {boolean} options.dryRun - If true, only show what would be run
 * @returns {Promise<Array>} Array of applied migrations
 */
export async function runMigrations({ direction = 'up', dryRun = false } = {}) {
  const migrationsDir = path.resolve(__dirname, '../../migrations');

  // Build connection string from Config.DB or use DATABASE_URL if available
  const connectionString = process.env.DATABASE_URL ||
    `postgresql://${Config.DB.USER}:${Config.DB.PASSWORD}@${Config.DB.HOST}:${Config.DB.PORT}/${Config.DB.NAME}`;

  // Create a new database client for migrations
  const dbClient = new pg.Client({
    connectionString,
  });

  try {
    await dbClient.connect();

    console.log(`Running database migrations ${direction}...`);
    if (dryRun) {
      console.log('DRY RUN MODE - No changes will be made');
    }

    const migrations = await runner({
      dbClient,
      dir: migrationsDir,
      direction,
      migrationsTable: 'pgmigrations',
      count: Infinity,
      ignorePattern: '.*\\.(map|md)$',
      schema: 'public',
      decamelize: true,
      checkOrder: true,
      dryRun,
      verbose: true,
      log: (msg) => console.log(msg),
      singleTransaction: false, // Run migrations separately to allow partial success
    });

    if (migrations.length === 0) {
      console.log('No pending migrations found.');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    return migrations;
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

/**
 * Run migrations on application startup
 * Runs automatically in production and Docker environments
 * Can be disabled with SKIP_MIGRATIONS=true environment variable
 */
export async function runMigrationsOnStartup() {
  // Allow skipping migrations with environment variable
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('Skipping migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  // Check if running in Docker
  const isDocker = process.env.DOCKER === 'true' || process.env.IS_DOCKER === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Run migrations in production or Docker environments
  if (!isProduction && !isDocker) {
    console.log('Skipping automatic migrations in local development mode.');
    console.log('Run migrations manually with: npm run migrate');
    console.log('Or set DOCKER=true to run migrations automatically.');
    return;
  }

  try {
    const env = isDocker ? 'Docker' : 'production';
    console.log(`Running database migrations on startup (${env} mode)...`);
    await runMigrations({ direction: 'up' });
    console.log('Database migrations completed successfully.');
  } catch (error) {
    console.error('Failed to run database migrations on startup:', error);
    // Fail fast if migrations fail
    throw new Error('Database migration failed. Application cannot start.');
  }
}
