import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  await initDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }

  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  const user = rows[0];

  if (!user) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  if (!user.active) {
    return NextResponse.json({
      error: 'Conta aguardando aprovação. Um administrador precisa liberar seu acesso.',
    }, { status: 403 });
  }

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
