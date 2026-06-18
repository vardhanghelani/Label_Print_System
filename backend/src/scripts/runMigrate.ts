import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { config } from '../config/index.js';
import { runAllMigrations } from './migrateLegacyProducts.js';

async function main() {
  await connectDatabase(config.mongoUri);
  const { products, layouts } = await runAllMigrations();
  console.log(`Migrated ${products} product(s) and ${layouts} layout(s).`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
