import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';

export async function GET() {
  await initDB();
  const rows = await sql`SELECT * FROM transactions ORDER BY timestamp DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await initDB();
  const { client, value, type, category, timestamp } = await req.json();
  const rows = await sql`
    INSERT INTO transactions (client, value, type, category, timestamp)
    VALUES (${client}, ${value}, ${type}, ${category}, ${timestamp})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
