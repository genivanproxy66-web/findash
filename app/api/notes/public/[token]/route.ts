import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await initDB();
  const { token } = await params;
  const rows = await sql`
    SELECT n.id, n.title, n.content, n.created_at, n.updated_at, u.name as author
    FROM notes n
    JOIN users u ON u.id = n.created_by
    WHERE n.share_token = ${token} AND n.is_public = TRUE
  `;
  if (!rows.length) return NextResponse.json({ error: 'Anotação não encontrada ou não pública.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
