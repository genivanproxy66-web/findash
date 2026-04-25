import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';

export async function GET() {
  await initDB();
  const rows = await sql`SELECT * FROM products ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await initDB();
  const { date, comum, com_doc, rest, verif, bm, repo } = await req.json();
  const rows = await sql`
    INSERT INTO products (date, comum, com_doc, rest, verif, bm, repo)
    VALUES (${date}, ${comum}, ${com_doc}, ${rest}, ${verif}, ${bm}, ${repo})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
