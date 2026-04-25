import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB, FIXED_ADMINS } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  await initDB();
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
  }

  const isFixedAdmin = FIXED_ADMINS.includes(email.toLowerCase());
  const role = isFixedAdmin ? 'admin' : 'user';
  const active = isFixedAdmin;

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role, active)
    VALUES (${name}, ${email.toLowerCase()}, ${password_hash}, ${role}, ${active})
    RETURNING id, name, email, role, active
  `;

  const user = rows[0];

  if (!user.active) {
    return NextResponse.json({
      pending: true,
      message: 'Cadastro realizado! Aguarde a aprovação de um administrador para acessar o sistema.',
    });
  }

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
