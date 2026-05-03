import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'Folio <notifications@folio.cafe>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://folio.cafe'

// ─── Shared styles ────────────────────────────────────────────────────────────
const BASE = `
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a}
    .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0}
    .header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px}
    .header h1{margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px}
    .header p{margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75)}
    .body{padding:32px 40px}
    .body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155}
    .pin{background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin:24px 0}
    .pin span{font-size:42px;font-weight:900;letter-spacing:10px;color:#4f46e5;font-variant-numeric:tabular-nums}
    .pin small{display:block;font-size:12px;color:#94a3b8;margin-top:6px}
    .cta{display:inline-block;background:#4f46e5;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;margin:8px 0}
    .detail-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0}
    .detail-box .label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px}
    .detail-box .value{font-size:14px;font-weight:600;color:#1e293b}
    .badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px}
    .badge-indigo{background:#eef2ff;color:#4338ca}
    .badge-violet{background:#f5f3ff;color:#6d28d9}
    .badge-amber{background:#fffbeb;color:#92400e}
    .badge-emerald{background:#ecfdf5;color:#065f46}
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center}
    .footer p{margin:0;font-size:12px;color:#94a3b8;line-height:1.6}
    @media(max-width:600px){.body,.header,.footer{padding:24px 20px}.pin span{font-size:32px;letter-spacing:6px}}
  </style></head><body>`

const FOOTER = `
  <div class="footer">
    <p>Folio &mdash; The talent discovery platform<br>
    You received this email because of activity on your account.<br>
    <a href="${APP_URL}" style="color:#4f46e5;text-decoration:none">folio.cafe</a></p>
  </div></div></body></html>`

// ─── Email verification PIN ───────────────────────────────────────────────────
export async function sendVerificationEmail(to: string, name: string, pin: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${pin} is your Folio verification code`,
    html: `${BASE}
      <div class="wrap">
        <div class="header">
          <h1>Verify your email</h1>
          <p>Welcome to Folio, ${name}!</p>
        </div>
        <div class="body">
          <p>Use the code below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
          <div class="pin">
            <span>${pin}</span>
            <small>Do not share this code with anyone.</small>
          </div>
          <p style="font-size:13px;color:#94a3b8">If you didn't create a Folio account, you can safely ignore this email.</p>
        </div>
        ${FOOTER}`,
  })
}

// ─── Interview request notification (to talent) ──────────────────────────────
export async function sendInterviewRequestEmail(to: string, talentName: string, opts: {
  companyName: string
  roleTitle: string
  employmentType: string
  workArrangement: string
  salaryText?: string
  message?: string
}) {
  const { companyName, roleTitle, employmentType, workArrangement, salaryText, message } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${companyName} sent you an interview request`,
    html: `${BASE}
      <div class="wrap">
        <div class="header">
          <h1>New Interview Request</h1>
          <p>You have a new opportunity waiting for your response.</p>
        </div>
        <div class="body">
          <p>Hi ${talentName},</p>
          <p><strong>${companyName}</strong> is interested in your profile for the following role:</p>
          <div class="detail-box">
            <div class="label">Role</div>
            <div class="value" style="font-size:18px;font-weight:800;color:#4f46e5;margin-bottom:10px">${roleTitle}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
              <span class="badge badge-indigo">${employmentType}</span>
              <span class="badge badge-violet">${workArrangement}</span>
              ${salaryText ? `<span class="badge badge-emerald">${salaryText}</span>` : ''}
            </div>
          </div>
          ${message ? `<div class="detail-box"><div class="label">Message from ${companyName}</div><div class="value" style="font-weight:400;font-style:italic">&ldquo;${message}&rdquo;</div></div>` : ''}
          <p>Log in to Folio to review the full job details and respond.</p>
          <a href="${APP_URL}/dashboard/talent" class="cta">View Request &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Stage update: Interview scheduled (to talent) ───────────────────────────
export async function sendInterviewScheduledEmail(to: string, talentName: string, opts: {
  companyName: string
  roleTitle: string
  method: string
  link?: string
  notes?: string
}) {
  const { companyName, roleTitle, method, link, notes } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${companyName} wants to interview you for ${roleTitle}`,
    html: `${BASE}
      <div class="wrap">
        <div class="header">
          <h1>Interview Scheduled</h1>
          <p>You've progressed to the interview stage!</p>
        </div>
        <div class="body">
          <p>Hi ${talentName},</p>
          <p>Great news! <strong>${companyName}</strong> would like to interview you for <strong>${roleTitle}</strong>.</p>
          <div class="detail-box">
            <div class="label">Interview method</div>
            <div class="value">${method}</div>
            ${link ? `<div style="margin-top:10px"><div class="label">Meeting link / details</div><div class="value" style="font-weight:400"><a href="${link}" style="color:#4f46e5;word-break:break-all">${link}</a></div></div>` : ''}
            ${notes ? `<div style="margin-top:10px"><div class="label">Additional notes</div><div class="value" style="font-weight:400">${notes}</div></div>` : ''}
          </div>
          <a href="${APP_URL}/dashboard/talent" class="cta">View Details &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Stage update: Offer made (to talent) ────────────────────────────────────
export async function sendOfferEmail(to: string, talentName: string, opts: {
  companyName: string
  roleTitle: string
  offerDetails: string
}) {
  const { companyName, roleTitle, offerDetails } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${companyName} has made you an offer for ${roleTitle}`,
    html: `${BASE}
      <div class="wrap">
        <div class="header">
          <h1>You've received an offer!</h1>
          <p>Congratulations on reaching the offer stage.</p>
        </div>
        <div class="body">
          <p>Hi ${talentName},</p>
          <p><strong>${companyName}</strong> has made you an offer for <strong>${roleTitle}</strong>.</p>
          <div class="detail-box">
            <div class="label">Offer details</div>
            <div class="value" style="font-weight:400;white-space:pre-line">${offerDetails}</div>
          </div>
          <p>Log in to Folio to review and respond to this offer.</p>
          <a href="${APP_URL}/dashboard/talent" class="cta">View &amp; Respond to Offer &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Stage update: Hired (to talent) ─────────────────────────────────────────
export async function sendHiredEmail(to: string, talentName: string, opts: {
  companyName: string
  roleTitle: string
}) {
  const { companyName, roleTitle } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Congratulations! ${companyName} has hired you for ${roleTitle}`,
    html: `${BASE}
      <div class="wrap">
        <div class="header" style="background:linear-gradient(135deg,#059669 0%,#047857 100%)">
          <h1>You&apos;re hired! 🎉</h1>
          <p>Congratulations on your new role.</p>
        </div>
        <div class="body">
          <p>Hi ${talentName},</p>
          <p>We&apos;re thrilled to let you know that <strong>${companyName}</strong> has officially hired you for the role of <strong>${roleTitle}</strong>.</p>
          <p>Best of luck in your new role — we&apos;re rooting for you!</p>
          <a href="${APP_URL}/dashboard/talent" class="cta">View Your Pipeline &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Account verified (to talent) ────────────────────────────────────────────
export async function sendVerificationApprovedEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your Folio account has been verified!',
    html: `${BASE}
      <div class="wrap">
        <div class="header" style="background:linear-gradient(135deg,#059669 0%,#047857 100%)">
          <h1>You're verified!</h1>
          <p>Your account has been approved by the Folio team.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Great news — your Folio account has been <strong>verified</strong>. You now carry the verified badge on your profile, which makes you <strong>5x more likely to receive interview requests</strong> from top employers.</p>
          <div class="detail-box">
            <div class="label">What this means for you</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:14px;color:#1e293b">
                <span style="color:#059669;font-weight:700;flex-shrink:0">✓</span>
                Verified badge displayed on your public profile
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:14px;color:#1e293b">
                <span style="color:#059669;font-weight:700;flex-shrink:0">✓</span>
                Priority ranking in employer search results
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:14px;color:#1e293b">
                <span style="color:#059669;font-weight:700;flex-shrink:0">✓</span>
                Employers trust verified talent — 5x higher hire rate
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:14px;color:#1e293b">
                <span style="color:#059669;font-weight:700;flex-shrink:0">✓</span>
                You'll be emailed directly when an employer sends an interview request
              </div>
            </div>
          </div>
          <p>Make sure your profile is complete and up to date to maximise your chances.</p>
          <a href="${APP_URL}/dashboard/talent" class="cta">Go to Dashboard &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Talent accepted request (to employer) ───────────────────────────────────
export async function sendTalentAcceptedEmail(to: string, employerName: string, opts: {
  talentName: string
  roleTitle: string
}) {
  const { talentName, roleTitle } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${talentName} is interested in ${roleTitle}`,
    html: `${BASE}
      <div class="wrap">
        <div class="header">
          <h1>Candidate interested!</h1>
          <p>A talent has accepted your interview request.</p>
        </div>
        <div class="body">
          <p>Hi ${employerName},</p>
          <p><strong>${talentName}</strong> has expressed interest in the <strong>${roleTitle}</strong> position and is now in your pipeline.</p>
          <a href="${APP_URL}/dashboard/employer" class="cta">View Pipeline &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}

// ─── Offer accepted by talent (to employer) ──────────────────────────────────
export async function sendOfferAcceptedEmail(to: string, employerName: string, opts: {
  talentName: string
  roleTitle: string
}) {
  const { talentName, roleTitle } = opts
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${talentName} accepted your offer for ${roleTitle}`,
    html: `${BASE}
      <div class="wrap">
        <div class="header" style="background:linear-gradient(135deg,#059669 0%,#047857 100%)">
          <h1>Offer accepted! 🎉</h1>
          <p>Your candidate is ready to move forward.</p>
        </div>
        <div class="body">
          <p>Hi ${employerName},</p>
          <p><strong>${talentName}</strong> has accepted your offer for the <strong>${roleTitle}</strong> position.</p>
          <p>You can now move them to the Hired stage in your pipeline.</p>
          <a href="${APP_URL}/dashboard/employer" class="cta">View Pipeline &rarr;</a>
        </div>
        ${FOOTER}`,
  })
}
