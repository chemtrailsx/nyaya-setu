/** Side-effect import: load .env.local before any @/lib/config-dependent module
 *  is evaluated. ESM runs imports in source order, so importing this FIRST makes
 *  process.env ready before config.ts reads it. */
import { config } from "dotenv";
config({ path: ".env.local" });
