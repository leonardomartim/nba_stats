import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../config/env";

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let pgClient: ReturnType<typeof postgres> | null = null;
let dbInstance: DrizzleDb | null = null;
let isConnected = false;

export async function initDb(): Promise<{ db: DrizzleDb | null; isPostgres: boolean }> {
  try {
    if (!env.DATABASE_URL) {
      console.warn("⚠️ No DATABASE_URL provided. Using memory fallback repository.");
      return { db: null, isPostgres: false };
    }

    pgClient = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 3,
      onnotice: () => {},
    });

    // Test connectivity
    await pgClient`SELECT 1`;
    dbInstance = drizzle(pgClient, { schema });
    isConnected = true;
    console.log("✅ Successfully connected to PostgreSQL via Drizzle ORM.");
    return { db: dbInstance, isPostgres: true };
  } catch (error) {
    console.warn("⚠️ Could not connect to PostgreSQL:", (error as Error).message);
    console.warn("ℹ️ Running in resilient mode with built-in in-memory/fallback persistence. Data will stay hot in memory.");
    isConnected = false;
    dbInstance = null;
    return { db: null, isPostgres: false };
  }
}

export function getDb(): DrizzleDb | null {
  return dbInstance;
}

export function isDbConnected(): boolean {
  return isConnected;
}

export async function closeDb() {
  if (pgClient) {
    await pgClient.end();
  }
}
