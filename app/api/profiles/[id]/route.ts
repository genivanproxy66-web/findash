import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

const VALID_STATUSES = ['disponivel', 'ativo', 'aquecendo', 'bloqueado', 'vendido'];
type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { id } = await params;
  const numId  = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const rows = session.group_id === 0
    ? await sql`UPDATE profiles SET status = ${status} WHERE id = ${numId} RETURNING *`
    : await sql`UPDATE profiles SET status = ${status} WHERE id = ${numId} AND group_id = ${session.group_id} RETURNING *`;

  if (!rows.length) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { id } = await params;
  const numId  = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  if (session.group_id === 0) {
    await sql`DELETE FROM profiles WHERE id = ${numId}`;
  } else {
    await sql`DELETE FROM profiles WHERE id = ${numId} AND group_id = ${session.group_id}`;
  }

  return NextResponse.json({ success: true });
}
