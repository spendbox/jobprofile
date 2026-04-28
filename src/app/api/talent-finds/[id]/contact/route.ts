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

  // Determine which profile_ids already have an IR for this employer
  const { data: existing } = await supabase
    .from('interview_requests')
    .select('profile_id')
    .eq('employer_id', user.id)
    .in('profile_id', profile_ids)

  const existingSet = new Set((existing ?? []).map((e: { profile_id: string }) => e.profile_id))
  const brandNew = profile_ids.filter((pid: string) => !existingSet.has(pid))
  const alreadyExist = profile_ids.filter((pid: string) => existingSet.has(pid))

  // Insert fresh IRs for first-time invites
  if (brandNew.length > 0) {
    const { error: insertErr } = await supabase
      .from('interview_requests')
      .insert(brandNew.map((pid: string) => ({
        employer_id: user.id,
        profile_id: pid,
        talent_find_id: id,
        message: message?.trim() || null,
        status: 'pending',
        stage: 'discovered',
      })))
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Re-associate existing IRs to this pipeline so they appear in the stage view
  if (alreadyExist.length > 0) {
    await supabase
      .from('interview_requests')
      .update({ talent_find_id: id })
      .eq('employer_id', user.id)
      .in('profile_id', alreadyExist)
  }

  // Mark as contacted in talent_find_candidates
  await supabase
    .from('talent_find_candidates')
    .update({ contacted: true })
    .eq('talent_find_id', id)
    .in('profile_id', profile_ids)

  return NextResponse.json({ contacted: profile_ids.length })
}
