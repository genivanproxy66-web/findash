import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const rows = await sql`SELECT * FROM products ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const { date, comum, com_doc, rest, verif, bm, repo } = await req.json();

  if (!date || typeof date !== 'string' || date.length > 20) {
    return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
  }

  const toInt = (v: unknown) => {
    const n = parseInt(String(v ?? 0), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const rows = await sql`
    INSERT INTO products (date, comum, com_doc, rest, verif, bm, repo)
    VALUES (${date}, ${toInt(comum)}, ${toInt(com_doc)}, ${toInt(rest)}, ${toInt(verif)}, ${toInt(bm)}, ${toInt(repo)})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
