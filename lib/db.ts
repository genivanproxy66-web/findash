import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export const FIXED_ADMINS = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'];

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT FALSE`;

  for (const email of FIXED_ADMINS) {
    await sql`UPDATE users SET role = 'admin', active = TRUE WHERE email = ${email}`;
  }

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

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Sem título',
      content TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      share_token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
