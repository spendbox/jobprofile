import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Folio',
  description: 'Privacy Policy for Folio, the talent discovery platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 inline-block">
            ← Back to Folio
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: April 30, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Overview</h2>
            <p>
              Folio (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy.
              This Privacy Policy explains what personal information we collect, how we use and store it,
              who we share it with, and the rights you have over your data when you use our platform at{' '}
              <a href="https://folio.cafe" className="text-indigo-600 hover:underline">folio.cafe</a>{' '}
              (&ldquo;Platform&rdquo;).
            </p>
            <p className="mt-3">
              By using the Platform, you consent to the practices described in this Privacy Policy.
              If you do not agree, please do not use the Platform. This Policy should be read alongside
              our{' '}
              <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-slate-800 mb-2">Information you provide directly</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Account information:</strong> your full name, email address, hashed password, and user role (talent or employer).</li>
              <li><strong>Talent profile:</strong> role title, skills, years of experience, employment type preference, work arrangement, salary expectations, availability status, location, and timezone.</li>
              <li><strong>Bio and portfolio:</strong> your professional bio, portfolio items, and CV files you upload.</li>
              <li><strong>Employer profile:</strong> company name, company description, website, contact email, HQ location, and company logo.</li>
              <li><strong>Verification data:</strong> your legal name, a liveness video, and a copy of your government-issued identity document (talent only).</li>
              <li><strong>Payment information:</strong> transaction references and amounts. We do not store card details — all card data is processed exclusively by Paystack.</li>
              <li><strong>Communications:</strong> messages, notes, and screening answers exchanged on the Platform.</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">Information collected automatically</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Usage data: pages visited, features used, and session duration.</li>
              <li>Profile view counts (non-identifiable aggregate metrics shown to talent).</li>
              <li>Device and browser type for security and compatibility purposes.</li>
              <li>IP address for fraud prevention and security logging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To create and manage your account and authenticate your sessions.</li>
              <li>To display your profile to employers searching for talent (talent only — controlled by your availability setting).</li>
              <li>To run our AI matching engine that ranks talent profiles against employer pipeline requirements.</li>
              <li>To send transactional emails: email verification codes, interview request notifications, stage updates, and verification approval notifications.</li>
              <li>To process payments via Paystack and record transaction references.</li>
              <li>To review identity verification submissions and issue verified badges.</li>
              <li>To detect, investigate, and prevent fraud, abuse, or violations of our Terms of Service.</li>
              <li>To improve the Platform&apos;s functionality, fix bugs, and enhance user experience.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We share it only as follows:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>With employers:</strong> Your public profile (role title, skills, availability, bio, portfolio, verified status) is
                visible to employers searching for talent. Your email address is never directly exposed to employers.
              </li>
              <li>
                <strong>With Supabase:</strong> Our database and authentication infrastructure. Supabase processes
                data on our behalf under a data processing agreement and does not use your data for any other purpose.
              </li>
              <li>
                <strong>With Resend:</strong> Our transactional email provider. Resend receives your email address
                and name solely to deliver emails you expect (verification codes, notifications). Resend does not
                use your data for marketing.
              </li>
              <li>
                <strong>With Paystack:</strong> Our payment processor. Paystack processes payment card data and
                provides us with transaction references and status. We do not receive or store your full card details.
              </li>
              <li>
                <strong>With OpenAI:</strong> CV text extracted from uploaded CVs may be sent to OpenAI&apos;s API
                for parsing into structured profile data. This data is processed under OpenAI&apos;s data processing
                agreement and is not used to train OpenAI models (API usage is excluded from training by default).
              </li>
              <li>
                <strong>With law enforcement:</strong> Where required by applicable law, court order, or to protect
                the rights and safety of our users or the public.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Data Storage and Security</h2>
            <p className="mb-3">
              Your data is stored on Supabase&apos;s infrastructure, hosted on cloud servers. Supabase uses
              industry-standard encryption in transit (TLS 1.2+) and at rest (AES-256). We implement
              Row Level Security (RLS) policies to ensure users can only access data that belongs to them.
            </p>
            <p>
              Despite these measures, no system is completely secure. We cannot guarantee the absolute
              security of data transmitted over the internet. You are responsible for keeping your
              account credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Identity Verification Data</h2>
            <p>
              Liveness videos and identity documents submitted for verification are stored in Supabase Storage
              with restricted access. Only Folio administrators can view this data. Verification documents are
              never shared with Employers or any third party outside of the service providers listed in
              Section 4. We retain verification documents for up to 12 months after your account is deleted,
              after which they are permanently deleted, unless retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. CV and Portfolio Files</h2>
            <p>
              CV and portfolio files you upload are stored in Supabase Storage under access controls.
              Portfolio files you mark as public are accessible to any user with the direct link.
              CVs are accessible only through authenticated requests from your own account (and, for
              verification, by Folio administrators). CV text is sent to OpenAI for parsing as described
              in Section 4 above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Cookies and Session Data</h2>
            <p>
              We use cookies solely for session management and authentication via Supabase Auth. These are
              strictly necessary cookies — without them you cannot log in. We do not use:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Third-party advertising trackers.</li>
              <li>Analytics cookies (Google Analytics, Hotjar, etc.).</li>
              <li>Cross-site tracking cookies.</li>
            </ul>
            <p className="mt-3">
              You can disable cookies in your browser settings, but doing so will prevent you from
              logging in to the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Active accounts:</strong> We retain your data for as long as your account is active.</li>
              <li><strong>Deleted accounts:</strong> Personal data is deleted within 30 days of account deletion, except where retention is required for legal or compliance purposes.</li>
              <li><strong>Verification documents:</strong> Retained for up to 12 months after account deletion (see Section 6).</li>
              <li><strong>Payment records:</strong> Transaction references and amounts are retained for 7 years in compliance with financial record-keeping requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information through your account settings or by contacting us.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
              <li><strong>Portability:</strong> Request an export of your profile data in a machine-readable format.</li>
              <li><strong>Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</li>
              <li><strong>Objection:</strong> Object to processing of your data for direct marketing purposes (we do not conduct direct marketing).</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on your consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:notifications@folio.cafe" className="text-indigo-600 hover:underline">
                notifications@folio.cafe
              </a>.{' '}
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Children&apos;s Privacy</h2>
            <p>
              The Platform is not directed at persons under the age of 18. We do not knowingly collect
              personal information from minors. If you believe a minor has created an account or provided
              us with personal data, please contact us immediately and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. International Data Transfers</h2>
            <p>
              Your data may be processed and stored in data centres outside your country of residence
              (including the United States and the European Union) through our third-party service providers
              (Supabase, Resend, Paystack, OpenAI). By using the Platform, you consent to this transfer.
              We take reasonable steps to ensure that any international transfer of personal data is
              conducted with appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Third-Party Links</h2>
            <p>
              Employer profiles may contain links to external company websites. We are not responsible for
              the privacy practices of those websites and encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or
              for legal, technical, or business reasons. We will notify you of significant changes by email
              or by posting a prominent notice on the Platform. The &ldquo;Last updated&rdquo; date at the top of
              this page reflects when the Policy was last revised. We encourage you to review this Policy
              periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">15. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests relating to this Privacy Policy or how we
              handle your personal data, please contact us at:{' '}
              <a href="mailto:notifications@folio.cafe" className="text-indigo-600 hover:underline">
                notifications@folio.cafe
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Terms of Service
          </Link>
          {' · '}
          <Link href="/" className="hover:text-slate-700">
            folio.cafe
          </Link>
        </div>
      </div>
    </div>
  )
}
