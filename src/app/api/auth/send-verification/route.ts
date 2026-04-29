import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Generate 6-digit PIN
  const pin = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  // Invalidate any previous unused codes
  await supabase.from('email_verifications').update({ used: true }).eq('user_id', user.id).eq('used', false)

  // Store new code
  const { error: insertErr } = await supabase.from('email_verifications').insert({
    user_id: user.id,
    code: pin,
    expires_at: expiresAt,
    used: false,
  })
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Get user name from profile
  const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
  const name = profile?.full_name ?? 'there'

  // Send email via Resend
  const { error: emailErr } = await sendVerificationEmail(user.email!, name, pin)
  if (emailErr) {
    console.error('Email send error:', emailErr)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
