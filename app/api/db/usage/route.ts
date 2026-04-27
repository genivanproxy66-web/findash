import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const rows = await sql`SELECT pg_database_size(current_database()) AS bytes_used`;
  return NextResponse.json({ bytes_used: Number(rows[0].bytes_used) });
}
