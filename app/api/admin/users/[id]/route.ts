import { NextResponse } from 'next/server';
import { sql, FIXED_ADMINS } from '@/lib/db';
import { getSession } from '@/lib/auth';

const PROTECTED_EMAILS = [...FIXED_ADMINS, 'manutencao@findash.io'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;
  const numId  = parseInt(id, 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const body = await req.json();

  const rows = await sql`SELECT * FROM users WHERE id = ${numId}`;
  const target = rows[0];
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  // Protege admins fixos e superadmin
  if (PROTECTED_EMAILS.includes(target.email)) {
    return NextResponse.json({ error: 'Não é possível alterar administradores fixos.' }, { status: 403 });
  }

  // Admin normal só pode alterar usuários do seu grupo
  if (session.role !== 'superadmin' && Number(target.group_id) !== session.group_id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  // Ao ativar: define group_id do usuário como o grupo do admin que aprova
  if (typeof body.active === 'boolean') {
    if (body.active) {
      await sql`UPDATE users SET active = TRUE, group_id = ${session.group_id} WHERE id = ${numId}`;
    } else {
      await sql`UPDATE users SET active = FALSE WHERE id = ${numId}`;
    }
  }

  if (body.role === 'admin' || body.role === 'user') {
    await sql`UPDATE users SET role = ${body.role} WHERE id = ${numId}`;
  }

  const updated = await sql`SELECT id, name, email, role, active, group_id FROM users WHERE id = ${numId}`;
  return NextResponse.json(updated[0]);
}
