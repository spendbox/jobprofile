import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendInterviewScheduledEmail,
  sendOfferEmail,
  sendHiredEmail,
  sendTalentAcceptedEmail,
  sendOfferAcceptedEmail,
} from '@/lib/email'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

export const dynamic = 'force-dynamic'

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(userId)
    return data.user?.email ?? null
  } catch { return null }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    stage,
    status,
    question_answers,
    interview_method,
    interview_link,
    interview_notes,
    offer_details,
    offer_accepted,
  } = body

  // Fetch full request with profile + employer + find
  const { data: ir, error: fetchErr } = await supabase
    .from('interview_requests')
    .select('*, profiles(*, user_profiles(*)), employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
    .eq('id', id)
    .single()

  if (fetchErr || !ir) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Determine caller role: employer owns the request, or talent owns the profile
  const isEmployer = ir.employer_id === user.id
  const isProfileOwner = (ir.profiles as { user_id?: string })?.user_id === user.id
  if (!isEmployer && !isProfileOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Build patch
  const patch: Record<string, unknown> = {}
  if (stage !== undefined) patch.stage = stage
  if (status !== undefined) patch.status = status
  if (question_answers !== undefined) patch.question_answers = question_answers
  if (interview_method !== undefined) patch.interview_method = interview_method
  if (interview_link !== undefined) patch.interview_link = interview_link
  if (interview_notes !== undefined) patch.interview_notes = interview_notes
  if (offer_details !== undefined) patch.offer_details = offer_details
  if (offer_accepted !== undefined) patch.offer_accepted = offer_accepted

  const { data: updated, error: updateErr } = await supabase
    .from('interview_requests')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // ── Fire notifications (best-effort, don't block response) ──────────────────
  const talentUserId = (ir.profiles as { user_id?: string })?.user_id
  const talentName = (ir.profiles as { user_profiles?: { full_name?: string } })?.user_profiles?.full_name ?? 'Talent'
  const employerName = (ir.employer as { full_name?: string; company_name?: string })?.company_name
    ?? (ir.employer as { full_name?: string })?.full_name
    ?? 'Employer'
  const find = ir.talent_find as { role_title?: string; employment_type?: string; work_arrangement?: string } | undefined
  const roleTitle = find?.role_title ?? 'Role'

  if (isEmployer && stage) {
    const talentEmail = talentUserId ? await getUserEmail(talentUserId) : null
    if (talentEmail) {
      if (stage === 'interview' && interview_method) {
        sendInterviewScheduledEmail(talentEmail, talentName, {
          companyName: employerName,
          roleTitle,
          method: interview_method,
          link: interview_link,
          notes: interview_notes,
        }).catch(console.error)
      } else if (stage === 'offer' && offer_details) {
        sendOfferEmail(talentEmail, talentName, {
          companyName: employerName,
          roleTitle,
          offerDetails: offer_details,
        }).catch(console.error)
      } else if (stage === 'hired') {
        sendHiredEmail(talentEmail, talentName, { companyName: employerName, roleTitle }).catch(console.error)
      }
    }
  }

  if (isProfileOwner) {
    const employerEmail = await getUserEmail(ir.employer_id)
    if (employerEmail) {
      if (stage === 'interested') {
        sendTalentAcceptedEmail(employerEmail, employerName, { talentName, roleTitle }).catch(console.error)
      }
      if (offer_accepted === true) {
        sendOfferAcceptedEmail(employerEmail, employerName, { talentName, roleTitle }).catch(console.error)
      }
    }
  }

  return NextResponse.json(updated)
}
