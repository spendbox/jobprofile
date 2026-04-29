import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Folio Cafe',
  description: 'Privacy Policy for Folio Cafe, the talent discovery platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 inline-block">
            ← Back to Folio Cafe
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: April 29, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Overview</h2>
            <p>
              Folio Cafe (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This
              Privacy Policy explains what information we collect, how we use it, and your rights regarding that
              information when you use our platform at{' '}
              <a href="https://folio.cafe" className="text-indigo-600 hover:underline">folio.cafe</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <h3 className="font-semibold text-slate-800 mb-2">Information you provide</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Account information: name, email address, password (hashed), and user role.</li>
              <li>Profile information: role titles, skills, bio, years of experience, salary expectations, location, and timezone.</li>
              <li>Portfolio and CV files you upload.</li>
              <li>For employers: company name, company description, website, contact email, and location.</li>
              <li>Communications: messages and notes exchanged on the Platform.</li>
            </ul>
            <h3 className="font-semibold text-slate-800 mb-2">Information collected automatically</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Usage data: pages visited, features used, and interactions with the Platform.</li>
              <li>Profile view counts (non-identifiable aggregate metrics shown to talent).</li>
              <li>Device and browser information for security and compatibility purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To operate and provide the Platform&apos;s core services (matching talent with employers).</li>
              <li>To send transactional emails such as email verification codes and interview request notifications.</li>
              <li>To allow employers to discover and contact talent based on their profile and availability.</li>
              <li>To improve Platform functionality, fix bugs, and enhance user experience.</li>
              <li>To detect and prevent fraud, abuse, or violations of our Terms of Service.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We share information only as follows:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>With employers:</strong> Your public profile (role title, skills, availability, bio, portfolio) is
                visible to employers searching for talent. Your email address is never directly exposed to employers.
              </li>
              <li>
                <strong>With service providers:</strong> We use Supabase (database and authentication) and Resend
                (transactional email). These providers process data only on our behalf and under data processing agreements.
              </li>
              <li>
                <strong>With law enforcement:</strong> Where required by law, court order, or to protect the rights and
                safety of our users or the public.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Data Storage and Security</h2>
            <p>
              Your data is stored on Supabase&apos;s infrastructure, which uses industry-standard encryption in transit
              (TLS) and at rest. We implement Row Level Security (RLS) policies to ensure users can only access their
              own data. Despite these measures, no system is completely secure and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. CV and Portfolio Files</h2>
            <p>
              CV and portfolio files you upload are stored in Supabase Storage. These files are accessible only through
              authenticated access controls. CVs submitted for identity verification are accessible only to Folio Cafe
              administrators and are never shared with employers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Cookies and Tracking</h2>
            <p>
              We use cookies solely for session management and authentication (via Supabase Auth). We do not use
              third-party advertising trackers or analytics cookies. You can disable cookies in your browser settings,
              but doing so will prevent you from logging in to the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Your Rights</h2>
            <p className="mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information via your account settings.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data by contacting us.</li>
              <li><strong>Portability:</strong> Request an export of your profile data in a common format.</li>
              <li>
                <strong>Objection:</strong> Object to processing of your data for direct marketing purposes (we do not
                engage in direct marketing).
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:notifications@folio.cafe" className="text-indigo-600 hover:underline">
                notifications@folio.cafe
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, we will delete
              your personal data within 30 days, except where we are required to retain it for legal or compliance
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Children&apos;s Privacy</h2>
            <p>
              The Platform is not directed at persons under the age of 18. We do not knowingly collect personal
              information from children. If you believe a minor has provided us with personal data, please contact us
              and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email
              or by posting a prominent notice on the Platform. The &quot;Last updated&quot; date at the top of this
              page indicates when the Policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your data, please reach
              out at{' '}
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
