import "server-only";

import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { requireEnv } from "@/lib/env";

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function sql<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  const result = await getPool().query<T>(text, values);
  return result;
}
