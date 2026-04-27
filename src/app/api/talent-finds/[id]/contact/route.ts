import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: find } = await supabase
    .from('talent_finds')
    .select('id')
    .eq('id', id)
    .eq('employer_id', user.id)
    .single()
  if (!find) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { profile_ids, message } = await req.json()
  if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
    return NextResponse.json({ error: 'profile_ids required' }, { status: 400 })
  }

  // Insert interview_requests (ignore conflicts — already contacted)
  const requests = profile_ids.map((pid: string) => ({
    employer_id: user.id,
    profile_id: pid,
    talent_find_id: id,
    message: message?.trim() || null,
    status: 'pending',
    stage: 'discovered',
  }))

  const { error: reqErr } = await supabase
    .from('interview_requests')
    .upsert(requests, { onConflict: 'employer_id,profile_id', ignoreDuplicates: true })

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 })

  // Mark as contacted in talent_find_candidates
  await supabase
    .from('talent_find_candidates')
    .update({ contacted: true })
    .eq('talent_find_id', id)
    .in('profile_id', profile_ids)

  return NextResponse.json({ contacted: profile_ids.length })
}
