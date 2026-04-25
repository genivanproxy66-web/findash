import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      client TEXT NOT NULL,
      value NUMERIC(10,2) NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      comum INTEGER DEFAULT 0,
      com_doc INTEGER DEFAULT 0,
      rest INTEGER DEFAULT 0,
      verif INTEGER DEFAULT 0,
      bm INTEGER DEFAULT 0,
      repo INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
