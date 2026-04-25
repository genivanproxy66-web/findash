import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

const MAX_TITLE = 200;
const MAX_CONTENT = 50_000;

export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  const { title, content } = await req.json();
  const safeTitle = (title ?? '').toString().slice(0, MAX_TITLE);
  const safeContent = (content ?? '').toString().slice(0, MAX_CONTENT);
  const rows = await sql`
    UPDATE notes SET title = ${safeTitle}, content = ${safeContent}, updated_at = NOW()
    WHERE id = ${numId} AND created_by = ${session.id}
    RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  const { is_public } = await req.json();
  if (typeof is_public !== 'boolean') {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
  }
  const rows = await sql`
    UPDATE notes SET is_public = ${is_public}
    WHERE id = ${numId} AND created_by = ${session.id}
    RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  await sql`DELETE FROM notes WHERE id = ${numId} AND created_by = ${session.id}`;
  return NextResponse.json({ success: true });
}
