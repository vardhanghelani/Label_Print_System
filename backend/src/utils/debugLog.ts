import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(process.cwd(), '..', 'debug-602ec9.log');

export function debugLogBackend(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  const payload = {
    sessionId: '602ec9',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
    runId: 'backend',
  };
  try {
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(payload)}\n`);
  } catch {
    /* ignore */
  }
}
