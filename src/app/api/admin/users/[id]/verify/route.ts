export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()
  const { verified } = await req.json()

  const { data, error } = await db
    .from('user_profiles')
    .update({
      is_verified: verified,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
