import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const { title, content } = await req.json();
  const rows = await sql`
    UPDATE notes SET title = ${title}, content = ${content}, updated_at = NOW()
    WHERE id = ${id} AND created_by = ${session.id}
    RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const { is_public } = await req.json();
  const rows = await sql`
    UPDATE notes SET is_public = ${is_public}
    WHERE id = ${id} AND created_by = ${session.id}
    RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM notes WHERE id = ${id} AND created_by = ${session.id}`;
  return NextResponse.json({ success: true });
}
