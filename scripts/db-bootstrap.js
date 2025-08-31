import fs from 'fs';
import path from 'path';

async function main() {
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Ensure DB file exists before client initialization
  const dbFile = path.join(dataDir, 'local.db');
  if (!fs.existsSync(dbFile)) {
    fs.closeSync(fs.openSync(dbFile, 'w'));
  }

  // Dynamically import database after file exists
  const { db } = await import('../lib/database.js');

  // Apply schema and migrations
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  const migratePath = path.join(process.cwd(), 'db', 'migrate.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  const migrateSql = fs.readFileSync(migratePath, 'utf-8');

  // Split on semicolons safely (simple split fits our schema files)
  const statements = (schemaSql + '\n' + migrateSql)
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => ({ sql: s }));

  await db.transaction(statements);
  console.log('Local DB bootstrapped');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 