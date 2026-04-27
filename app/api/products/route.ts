import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const rows = session.group_id === 0
    ? await sql`SELECT * FROM products ORDER BY date DESC`
    : await sql`SELECT * FROM products WHERE group_id = ${session.group_id} ORDER BY date DESC`;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();
  const { date, comum, com_doc, verif, bm, bm_1k, repo } = await req.json();

  if (!date || typeof date !== 'string' || date.length > 20) {
    return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
  }

  const toInt = (v: unknown) => {
    const n = parseInt(String(v ?? 0), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const gid = session.group_id === 0 ? null : session.group_id;

  const rows = await sql`
    INSERT INTO products (date, comum, com_doc, verif, bm, bm_1k, repo, group_id)
    VALUES (${date}, ${toInt(comum)}, ${toInt(com_doc)}, ${toInt(verif)},
            ${toInt(bm)}, ${toInt(bm_1k)}, ${toInt(repo)}, ${gid})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
