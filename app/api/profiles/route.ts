import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const rows = session.group_id === 0
    ? await sql`SELECT * FROM profiles ORDER BY created_at DESC`
    : await sql`SELECT * FROM profiles WHERE group_id = ${session.group_id} ORDER BY created_at DESC`;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const { items, file_source } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Nenhum perfil enviado.' }, { status: 400 });
  }
  if (items.length > 2000) {
    return NextResponse.json({ error: 'Máximo 2.000 perfis por upload.' }, { status: 400 });
  }

  const contents: string[] = items
    .map((s: unknown) => String(s).slice(0, 500).trim())
    .filter(Boolean);

  if (contents.length === 0) {
    return NextResponse.json({ error: 'Nenhum conteúdo válido encontrado.' }, { status: 400 });
  }

  const gid      = session.group_id === 0 ? null : session.group_id;
  const fileSrc  = (file_source || '').toString().slice(0, 200);

  const result = await sql`
    INSERT INTO profiles (content, file_source, created_by, group_id, status)
    SELECT x.content, ${fileSrc}::text, ${session.id}::int, ${gid}::int, 'disponivel'
    FROM unnest(${contents}::text[]) AS x(content)
    WHERE length(trim(x.content)) > 0
    RETURNING id
  `;

  return NextResponse.json({ count: result.length });
}
