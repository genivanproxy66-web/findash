import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB, FIXED_ADMINS } from '@/lib/db';
import { createSession } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  await initDB();
  const body     = await req.json();
  const name     = (body.name     ?? '').toString().trim();
  const email    = (body.email    ?? '').toString().trim().toLowerCase();
  const password = (body.password ?? '').toString();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: 'Nome muito longo (máx. 100 caracteres).' }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter no mínimo 8 caracteres.' }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: 'Senha muito longa.' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
  }

  const isFixedAdmin = FIXED_ADMINS.includes(email);
  const role   = isFixedAdmin ? 'admin' : 'user';
  const active = isFixedAdmin;

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role, active)
    VALUES (${name}, ${email}, ${password_hash}, ${role}, ${active})
    RETURNING id, name, email, role, active
  `;
  const user = rows[0];

  if (!user.active) {
    return NextResponse.json({
      pending: true,
      message: 'Cadastro realizado! Aguarde a aprovação de um administrador para acessar o sistema.',
    });
  }

  // Admins fixos: group_id = o próprio id
  await sql`UPDATE users SET group_id = ${user.id} WHERE id = ${user.id}`;

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    group_id: user.id,
  });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
