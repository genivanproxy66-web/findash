import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const users = await sql`
    SELECT id, name, email, role, active, created_at
    FROM users
    ORDER BY created_at ASC
  `;

  return NextResponse.json(users);
}
