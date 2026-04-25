import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  await initDB();
  const body = await req.json();
  const email: string = (body.email ?? '').toString().trim().toLowerCase();
  const password: string = (body.password ?? '').toString();

  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, name, email, role, active, password_hash
    FROM users WHERE email = ${email}
  `;
  const user = rows[0];

  // Constant-time response to prevent user enumeration
  if (!user) {
    await bcrypt.hash('dummy-prevent-timing-attack', 12);
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
