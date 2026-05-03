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

  const { data, error } = await supabase
    .from('talent_find_candidates')
    .update(patch)
    .eq('talent_find_id', id)
    .eq('profile_id', profileId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
