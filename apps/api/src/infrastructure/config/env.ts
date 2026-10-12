import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().optional().default("postgres://postgres:postgres@localhost:5432/nba_live"),
  NBA_PROVIDER: z.enum(["balldontlie", "mock"]).default("mock"),
  BALLDONTLIE_API_KEY: z.string().optional().default(""),
  SYNC_INTERVAL_MS: z.coerce.number().default(10000), // 10s default
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
