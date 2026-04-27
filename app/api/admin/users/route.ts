import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

const HIDDEN_EMAILS = ['manutencao@findash.io'];

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  // Superadmin vê todos (exceto o próprio superadmin oculto)
  // Admin normal vê apenas usuários do seu grupo
  const users = session.role === 'superadmin'
    ? await sql`
        SELECT id, name, email, role, active, group_id, created_at
        FROM users
        WHERE email <> ALL(${HIDDEN_EMAILS}::text[])
        ORDER BY created_at ASC
      `
    : await sql`
        SELECT id, name, email, role, active, group_id, created_at
        FROM users
        WHERE email <> ALL(${HIDDEN_EMAILS}::text[])
          AND (group_id = ${session.group_id} OR id = ${session.id})
        ORDER BY created_at ASC
      `;

  return NextResponse.json(users);
}
