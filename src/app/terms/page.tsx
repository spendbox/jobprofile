import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Folio',
  description: 'Terms of Service for Folio, the talent discovery platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 inline-block">
            ← Back to Folio
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: April 30, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Folio platform at{' '}
              <a href="https://folio.cafe" className="text-indigo-600 hover:underline">folio.cafe</a>{' '}
              (&ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
              If you do not agree, do not access or use the Platform.
            </p>
            <p className="mt-3">
              These Terms apply to all visitors, talent users, employer users, and any other persons
              who access or use the Platform. Folio is operated by its founding team (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              Folio is a talent discovery platform that connects professionals (&ldquo;Talent&rdquo;) with
              companies and individuals seeking to hire (&ldquo;Employers&rdquo;). Talent create role profiles
              that Employers can discover, and Employers send interview requests directly through the Platform.
            </p>
            <p className="mt-3">
              Folio does not act as an employment agency, staffing firm, or recruiter. We provide the
              technology infrastructure that facilitates connections between Talent and Employers. Any
              employment relationship formed through the Platform is solely between the Talent and the Employer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Account Registration</h2>
            <h3 className="font-semibold text-slate-800 mb-2">Eligibility</h3>
            <p className="mb-3">
              You must be at least 18 years of age to use the Platform. By creating an account, you represent
              and warrant that you are 18 years of age or older and have the legal capacity to enter into
              these Terms.
            </p>
            <h3 className="font-semibold text-slate-800 mb-2">Account types</h3>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li>
                <strong>Talent accounts</strong> are for individuals seeking to showcase their skills and receive
                interview requests. You may create multiple role profiles under one account.
              </li>
              <li>
                <strong>Employer accounts</strong> are for companies and hiring managers seeking to discover
                and hire talent. Employer accounts require a valid business email address; personal email
                providers (such as Gmail, Yahoo, or Hotmail) are not accepted.
              </li>
            </ul>
            <h3 className="font-semibold text-slate-800 mb-2">Accuracy</h3>
            <p>
              You agree to provide accurate, current, and complete information when creating your account
              and to keep this information up to date. Folio reserves the right to suspend or terminate
              accounts that contain false, misleading, or inaccurate information.
            </p>
            <h3 className="font-semibold text-slate-800 mt-3 mb-2">Account security</h3>
            <p>
              You are responsible for maintaining the security of your password and account. You must notify
              us immediately at{' '}
              <a href="mailto:notifications@folio.cafe" className="text-indigo-600 hover:underline">
                notifications@folio.cafe
              </a>{' '}
              if you suspect any unauthorised access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Identity Verification (Talent)</h2>
            <p className="mb-3">
              Talent users may optionally submit to an identity verification process to earn a
              &ldquo;Verified&rdquo; badge on their profile. Verification requires:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li>Payment of a one-time, non-refundable fee of $2 USD (processed via Paystack).</li>
              <li>A liveness video check in which you read a randomly generated phrase on camera.</li>
              <li>Submission of a government-issued identity document (passport, national ID, or driver&apos;s licence).</li>
            </ul>
            <p>
              Verification is reviewed manually by the Folio team within 1–2 business days. The fee is
              non-refundable regardless of whether verification is approved. Folio reserves the right to
              reject any verification submission that does not meet our standards, without obligation to
              disclose the specific reason.
            </p>
            <p className="mt-3">
              Identity documents submitted for verification are accessible only to Folio administrators and
              are never shared with Employers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Pipeline Creation (Employers)</h2>
            <p className="mb-3">
              Employers who wish to create a talent pipeline must pay a one-time, non-refundable fee of
              $200 USD per pipeline (processed via Paystack). This fee covers:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li>AI-assisted matching of your role requirements to available talent profiles.</li>
              <li>Access to a ranked shortlist of matched candidates.</li>
              <li>Full pipeline management tools (interview requests, stage tracking, notes, Q&amp;A).</li>
            </ul>
            <p>
              Pipeline fees are non-refundable once the pipeline has been created and candidate matching
              has begun. If you believe you were charged in error, contact us within 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Payments and Refunds</h2>
            <p className="mb-3">
              All payments on the Platform are processed by Paystack, a third-party payment processor.
              By making a payment, you also agree to Paystack&apos;s terms of service.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>All fees are stated in USD and charged in USD or the local currency equivalent, as applicable.</li>
              <li>Verification fees ($2) are non-refundable.</li>
              <li>Pipeline creation fees ($200) are non-refundable after the pipeline is published.</li>
              <li>Draft pipelines that have not been published are not eligible for refunds unless you contact us within 24 hours of payment.</li>
              <li>Folio does not store your card details. Payment data is held exclusively by Paystack.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. User Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide false, misleading, or fraudulent profile information.</li>
              <li>Impersonate any person or entity, or falsely claim an affiliation with a company.</li>
              <li>Use the Platform to send spam, unsolicited messages, or harassment.</li>
              <li>Attempt to circumvent any security feature of the Platform.</li>
              <li>Scrape, crawl, or harvest any data from the Platform without our written consent.</li>
              <li>Use automated tools to create accounts, send messages, or interact with the Platform.</li>
              <li>Post content that is defamatory, discriminatory, obscene, or otherwise unlawful.</li>
              <li>Use the Platform in any way that violates applicable laws or regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Content and Intellectual Property</h2>
            <h3 className="font-semibold text-slate-800 mb-2">Your content</h3>
            <p className="mb-3">
              You retain ownership of the content you submit to the Platform (profiles, CV files, portfolio
              items, messages). By submitting content, you grant Folio a non-exclusive, worldwide,
              royalty-free licence to display, store, and transmit that content solely for the purpose of
              operating the Platform.
            </p>
            <h3 className="font-semibold text-slate-800 mb-2">Our content</h3>
            <p>
              The Platform itself — including its design, text, code, logos, and AI matching technology —
              is owned by Folio and protected by applicable intellectual property laws. You may not copy,
              reproduce, or distribute any part of the Platform without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Privacy</h2>
            <p>
              Your use of the Platform is subject to our{' '}
              <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>,
              which is incorporated into these Terms by reference. By using the Platform, you consent
              to the collection and use of your data as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of
              any kind, express or implied. Folio does not warrant that the Platform will be uninterrupted,
              error-free, or free of viruses or other harmful components. Folio does not guarantee that any
              Talent will receive interview requests or that any Employer will find suitable candidates.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Folio and its officers, employees, and agents will
              not be liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the Platform, including but not limited to loss of income, loss of
              data, or failure to hire or be hired. Our total aggregate liability for any claims related
              to the Platform shall not exceed the amount paid by you to Folio in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Termination</h2>
            <p>
              Folio reserves the right to suspend or terminate your account at any time, with or without
              notice, for violations of these Terms or for any other reason at our sole discretion.
              You may also delete your account at any time by contacting us. Upon termination, your right
              to use the Platform ceases immediately. Sections 8, 10, 11, and 13 survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nigeria,
              without regard to conflict-of-law principles. Any disputes arising under these Terms shall
              be subject to the exclusive jurisdiction of the courts of Nigeria, unless otherwise agreed
              in writing by both parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">14. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify registered users of material
              changes by email or by displaying a prominent notice on the Platform. Continued use of the
              Platform after the effective date of the updated Terms constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">15. Contact</h2>
            <p>
              Questions about these Terms should be directed to{' '}
              <a href="mailto:notifications@folio.cafe" className="text-indigo-600 hover:underline">
                notifications@folio.cafe
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Privacy Policy
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
