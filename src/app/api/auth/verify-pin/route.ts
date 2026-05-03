import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pin } = await req.json()
  if (!pin || typeof pin !== 'string') return NextResponse.json({ error: 'PIN required' }, { status: 400 })

  // Find a valid, unused code
  const { data: record } = await supabase
    .from('email_verifications')
    .select('id, code, expires_at')
    .eq('user_id', user.id)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!record) return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 })
  if (new Date(record.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
  if (record.code !== pin.trim()) return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })

  // Mark code as used and verify user
  await Promise.all([
    supabase.from('email_verifications').update({ used: true }).eq('id', record.id),
    supabase.from('user_profiles').update({ email_verified: true }).eq('id', user.id),
  ])

  return NextResponse.json({ ok: true })
}
