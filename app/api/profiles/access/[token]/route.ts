import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ token: string }> };

// Público: qualquer um com o link acessa
export async function GET(
  _req: Request,
  { params }: Params
) {
  await initDB();
  const { token } = await params;

  const shareRows = await sql`
    SELECT id, label, created_at FROM profile_shares WHERE token = ${token}
  `;
  if (!shareRows.length) {
    return NextResponse.json({ error: 'Link não encontrado ou expirado.' }, { status: 404 });
  }
  const share = shareRows[0];

  const profiles = await sql`
    SELECT p.id, p.content, p.status
    FROM profiles p
    JOIN profile_share_items psi ON psi.profile_id = p.id
    WHERE psi.share_id = ${share.id}
    ORDER BY p.id ASC
  `;

  return NextResponse.json({ share, profiles });
}

// Protegido: admin apaga o link pelo token
export async function DELETE(
  _req: Request,
  { params }: Params
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { token } = await params;

  if (session.group_id === 0) {
    await sql`DELETE FROM profile_shares WHERE token = ${token}`;
  } else {
    await sql`DELETE FROM profile_shares WHERE token = ${token} AND group_id = ${session.group_id}`;
  }

  return NextResponse.json({ success: true });
}
