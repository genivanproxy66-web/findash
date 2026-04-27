import { NextResponse } from 'next/server';
import { sql, initDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const shares = session.group_id === 0
    ? await sql`
        SELECT ps.id, ps.token, ps.label, ps.created_at,
               COUNT(psi.profile_id)::int AS profile_count
        FROM profile_shares ps
        LEFT JOIN profile_share_items psi ON psi.share_id = ps.id
        GROUP BY ps.id ORDER BY ps.created_at DESC
      `
    : await sql`
        SELECT ps.id, ps.token, ps.label, ps.created_at,
               COUNT(psi.profile_id)::int AS profile_count
        FROM profile_shares ps
        LEFT JOIN profile_share_items psi ON psi.share_id = ps.id
        WHERE ps.group_id = ${session.group_id}
        GROUP BY ps.id ORDER BY ps.created_at DESC
      `;

  return NextResponse.json(shares);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  await initDB();

  const { label, profileIds } = await req.json();

  if (!Array.isArray(profileIds) || profileIds.length === 0) {
    return NextResponse.json({ error: 'Selecione ao menos um perfil.' }, { status: 400 });
  }

  const token     = randomUUID();
  const safeLabel = (label || 'Acesso').toString().slice(0, 100);
  const gid       = session.group_id === 0 ? null : session.group_id;

  const shareRows = await sql`
    INSERT INTO profile_shares (token, label, group_id, created_by)
    VALUES (${token}, ${safeLabel}, ${gid}, ${session.id})
    RETURNING id
  `;
  const shareId = shareRows[0].id;

  const ids = profileIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
  if (ids.length > 0) {
    if (session.group_id === 0) {
      await sql`
        INSERT INTO profile_share_items (share_id, profile_id)
        SELECT ${shareId}::int, p.id FROM profiles p
        WHERE p.id = ANY(${ids}::int[])
        ON CONFLICT DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO profile_share_items (share_id, profile_id)
        SELECT ${shareId}::int, p.id FROM profiles p
        WHERE p.id = ANY(${ids}::int[]) AND p.group_id = ${session.group_id}
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return NextResponse.json({ token, id: shareId });
}
