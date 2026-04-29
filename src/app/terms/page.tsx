import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Folio Cafe',
  description: 'Terms of Service for Folio Cafe, the talent discovery platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 inline-block">
            ← Back to Folio Cafe
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: April 29, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Folio Cafe (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) at{' '}
              <a href="https://folio.cafe" className="text-indigo-600 hover:underline">folio.cafe</a>, you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              Folio Cafe is a talent discovery platform that connects job seekers (&quot;Talent&quot;) with employers
              (&quot;Employers&quot;). Talent can create role profiles showcasing their skills and availability; Employers
              can search for talent and send interview requests through the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use this Platform. By creating an account, you represent and
              warrant that you meet this age requirement and that the information you provide is accurate and complete.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Account Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>You may not share your account with others or create multiple accounts for deceptive purposes.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Post false, misleading, or fraudulent information on your profile or job listings.</li>
              <li>Harass, threaten, or discriminate against other users.</li>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform or its systems.</li>
              <li>Scrape, crawl, or otherwise systematically collect data from the Platform without our written permission.</li>
              <li>Upload malicious code, viruses, or any content designed to disrupt Platform functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Content Ownership</h2>
            <p>
              You retain ownership of the content you submit to the Platform (including your profile, CV, and portfolio
              items). By submitting content, you grant Folio Cafe a non-exclusive, worldwide, royalty-free license to
              display that content on the Platform for the purpose of providing our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Employer Responsibilities</h2>
            <p>
              Employers using the Platform agree to post only genuine job opportunities, to treat all talent fairly and
              without unlawful discrimination, and to use candidate information solely for the purpose of evaluating
              candidates for posted roles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Platform Availability</h2>
            <p>
              We strive to keep the Platform available at all times but do not guarantee uninterrupted access. We may
              perform maintenance, updates, or suspend service without notice. We are not liable for any losses arising
              from Platform downtime.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms
              or engage in conduct we deem harmful to other users or the Platform. You may delete your account at any
              time from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              express or implied. We do not guarantee that the Platform will be error-free, secure, or that any
              particular employment outcomes will result from using the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Folio Cafe shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenues, arising from your use of
              or inability to use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify users of material changes by email or by
              posting a notice on the Platform. Continued use of the Platform after changes take effect constitutes
              your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
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
