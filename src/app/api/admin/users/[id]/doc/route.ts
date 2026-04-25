export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: user, error } = await db
    .from('user_profiles')
    .select('verification_doc_path')
    .eq('id', params.id)
    .single()

  if (error || !user?.verification_doc_path) {
    return NextResponse.json({ error: 'No document found' }, { status: 404 })
  }

  const { data: signed, error: signErr } = await db.storage
    .from('verification-docs')
    .createSignedUrl(user.verification_doc_path, 60 * 10) // 10-minute URL

  if (signErr || !signed) {
    return NextResponse.json({ error: 'Could not generate document URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
