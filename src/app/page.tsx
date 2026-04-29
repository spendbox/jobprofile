import Link from 'next/link'

const features = [
  {
    icon: '🎯',
    title: 'Get Discovered',
    desc: 'Create role profiles for every skill you offer. Employers find you — no cold applications.',
  },
  {
    icon: '🔍',
    title: 'Smart Discovery',
    desc: 'Employers search by role, skills, availability, and salary. Exposure is kept fair for all talent.',
  },
  {
    icon: '📬',
    title: 'Interview Requests',
    desc: 'Employers send you a request. You accept or decline. Simple, respectful, and direct.',
  },
  {
    icon: '♻️',
    title: 'Multiple Roles',
    desc: 'One account, unlimited profiles. List yourself as a developer, writer, and VA all at once.',
  },
]

const roles = [
  'Frontend Developer',
  'Virtual Assistant',
  'Content Writer',
  'Customer Support',
  'Social Media Manager',
  'UI/UX Designer',
  'Data Analyst',
  'Product Manager',
]

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-white px-4 pt-16 pb-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Employers discover you.{' '}
            <span className="text-indigo-600">No applications.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">
            Create role profiles, set your availability, and let companies come to you with
            interview requests.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup?role=talent" className="btn-primary py-3.5 px-8 text-base">
              I&apos;m a Talent — Get Discovered
            </Link>
            <Link href="/auth/signup?role=employer" className="btn-secondary py-3.5 px-8 text-base">
              I&apos;m Hiring — Find Talent
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">Free to join · No credit card required</p>
        </div>
      </section>

      {/* Role pills */}
      <section className="bg-slate-50 px-4 py-8 overflow-hidden">
        <p className="text-center text-xs uppercase tracking-widest text-slate-400 mb-4">
          Roles on Folio Cafe
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {roles.map((role) => (
            <span
              key={role}
              className="bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
            >
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 max-w-screen-md mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For talent */}
      <section className="bg-indigo-600 px-4 py-14 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to get discovered?</h2>
          <p className="text-indigo-200 mb-6 text-sm">
            Set up your profile in minutes. Toggle your weekly availability so employers know
            when you&apos;re open to opportunities.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Create your free profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-slate-400 border-t border-slate-100">
        <p>© 2026 Folio Cafe. Built for the future of work.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/search" className="hover:text-slate-600 transition-colors">Browse Talent</Link>
          <Link href="/auth/signup" className="hover:text-slate-600 transition-colors">Join Free</Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
