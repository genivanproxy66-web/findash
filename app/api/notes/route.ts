import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { randomUUID } from 'crypto';

const MAX_TITLE = 200;
const MAX_CONTENT = 50_000;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const notes = await sql`
    SELECT id, title, content, is_public, share_token, created_at, updated_at
    FROM notes WHERE created_by = ${session.id}
    ORDER BY updated_at DESC
  `;
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const { title, content } = await req.json();

  const safeTitle = (title ?? 'Sem título').toString().slice(0, MAX_TITLE);
  const safeContent = (content ?? '').toString().slice(0, MAX_CONTENT);

  const share_token = randomUUID();
  const rows = await sql`
    INSERT INTO notes (title, content, created_by, share_token)
    VALUES (${safeTitle}, ${safeContent}, ${session.id}, ${share_token})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
