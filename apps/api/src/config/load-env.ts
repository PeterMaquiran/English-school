import { config as loadEnv } from 'dotenv';

// Must run before any module that reads process.env at import time (tracing).
// Order matches ConfigModule.envFilePath: first file wins, real env always wins.
for (const path of ['.env.local', '.env']) {
  loadEnv({ path, quiet: true });
}
