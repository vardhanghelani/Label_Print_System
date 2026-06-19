import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { config } from '../config/index.js';
import { ensureJewellerySheet } from './ensureJewellerySheet.js';

async function main() {
  await connectDatabase(config.mongoUri);
  const result = await ensureJewellerySheet();
  console.log(JSON.stringify(result, null, 2));
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
