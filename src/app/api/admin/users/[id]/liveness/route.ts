export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: user, error } = await db
    .from('user_profiles')
    .select('verification_liveness_path')
    .eq('id', params.id)
    .single()

  if (error || !user?.verification_liveness_path) {
    return NextResponse.json({ error: 'No liveness video found' }, { status: 404 })
  }

  const { data: signed, error: signErr } = await db.storage
    .from('verification-docs')
    .createSignedUrl(user.verification_liveness_path, 60 * 10)

  if (signErr || !signed) {
    return NextResponse.json({ error: 'Could not generate video URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
