import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; profileId: string }> },
) {
  const { id, profileId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if ('star_rating' in body) patch.star_rating = body.star_rating
  if ('notes' in body) patch.notes = body.notes

  const { data: updated } = await supabase
    .from('talent_find_candidates')
    .update(patch)
    .eq('talent_find_id', id)
    .eq('profile_id', profileId)
    .select()

  if (updated && updated.length > 0) {
    return NextResponse.json(updated[0])
  }

  // Row doesn't exist yet (candidate was invited without going through AI matching)
  const { data: inserted, error: insertErr } = await supabase
    .from('talent_find_candidates')
    .insert({ talent_find_id: id, profile_id: profileId, ai_score: 0, contacted: true, ...patch })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json(inserted)
}
