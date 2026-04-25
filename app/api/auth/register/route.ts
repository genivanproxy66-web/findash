import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDB } from '@/lib/db';
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

  const count = await sql`SELECT COUNT(*) as total FROM users`;
  const total = Number(count[0].total);
  const role = total < 2 ? 'admin' : 'user';

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${password_hash}, ${role})
    RETURNING id, name, email, role
  `;

  const user = rows[0];
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
