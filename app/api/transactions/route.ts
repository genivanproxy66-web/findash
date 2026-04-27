import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const rows = session.group_id === 0
    ? await sql`SELECT * FROM transactions ORDER BY timestamp DESC`
    : await sql`SELECT * FROM transactions WHERE group_id = ${session.group_id} ORDER BY timestamp DESC`;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const { client, value, type, category, timestamp } = await req.json();

  if (!client || typeof client !== 'string' || client.trim().length === 0) {
    return NextResponse.json({ error: 'Cliente inválido.' }, { status: 400 });
  }
  if (client.length > 200) {
    return NextResponse.json({ error: 'Nome muito longo.' }, { status: 400 });
  }
  const numValue = Number(value);
  if (!isFinite(numValue) || numValue <= 0) {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
  }
  if (!['Receita', 'Despesa'].includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  }

  const gid = session.group_id === 0 ? null : session.group_id;

  const rows = await sql`
    INSERT INTO transactions (client, value, type, category, timestamp, group_id)
    VALUES (${client.trim()}, ${numValue}, ${type}, ${category ?? null}, ${Number(timestamp)}, ${gid})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
