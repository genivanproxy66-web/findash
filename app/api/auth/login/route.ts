import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await initDB();

    const body     = await req.json();
    const email    = (body.email    ?? '').toString().trim().toLowerCase();
    const password = (body.password ?? '').toString();

    if (!email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, name, email, role, active, group_id, password_hash
      FROM users WHERE email = ${email}
    `;
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

    // Calcula group_id para o JWT
    let group_id: number;
    if (user.role === 'superadmin') {
      group_id = 0;
    } else if (user.role === 'admin') {
      group_id = Number(user.group_id) || user.id;
    } else {
      group_id = Number(user.group_id) || 0;
    }

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, group_id });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[login] erro interno:', err);
    return NextResponse.json({ error: 'Erro interno. Tente novamente em instantes.', _debug: msg }, { status: 500 });
  }
}
