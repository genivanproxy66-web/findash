import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const rows = await sql`SELECT * FROM transactions ORDER BY timestamp DESC`;
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
    return NextResponse.json({ error: 'Nome do cliente muito longo.' }, { status: 400 });
  }
  const numValue = Number(value);
  if (!isFinite(numValue) || numValue <= 0) {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
  }
  if (!['entrada', 'saida'].includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO transactions (client, value, type, category, timestamp)
    VALUES (${client.trim()}, ${numValue}, ${type}, ${category ?? null}, ${Number(timestamp)})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
