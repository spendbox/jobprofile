import Link from 'next/link'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Get Discovered',
    desc: 'Create role profiles for every skill you offer. Employers find you — no cold applications, no cover letters.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Smart Discovery',
    desc: 'Employers search by role, skills, availability, and salary. Fair exposure for all talent — no algorithmic bias.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Interview Requests',
    desc: 'Employers send you a request with job details. You accept or decline. Simple, respectful, and on your terms.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Multiple Roles',
    desc: 'One account, unlimited profiles. List yourself as a developer, writer, and designer all at once.',
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
  'Backend Developer',
  'Video Editor',
]

const steps = [
  {
    number: '01',
    title: 'Create your profile',
    desc: 'Set your role title, skills, salary expectation, and availability status in minutes.',
  },
  {
    number: '02',
    title: 'Employers discover you',
    desc: 'Companies searching for your skills will find your profile through our smart talent search.',
  },
  {
    number: '03',
    title: 'Review and respond',
    desc: 'Receive interview requests with full job details. Accept the ones that excite you.',
  },
]

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-950 px-4 pt-20 pb-24 text-center relative overflow-hidden">
        {/* subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="max-w-2xl mx-auto relative">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 border border-slate-700 bg-slate-900 px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Talent profiles being discovered right now
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
            Your skills.<br />
            <span className="text-slate-400">Employers come to you.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Build a role profile, set your availability, and let companies send you
            interview requests — no job boards, no cold applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup?role=talent" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              I&apos;m Talent — Get Discovered
            </Link>
            <Link href="/auth/signup?role=employer" className="inline-flex items-center justify-center gap-2 bg-transparent text-white font-semibold px-7 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              I&apos;m Hiring — Find Talent
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-5">Free to join · No credit card required</p>
        </div>
      </section>

      {/* Role pills */}
      <section className="bg-slate-900 border-y border-slate-800 px-4 py-6 overflow-hidden">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Roles on Folio Cafe
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {roles.map((role) => (
            <span
              key={role}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-full"
            >
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 max-w-screen-md mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-14 tracking-tight">
          Three steps to getting hired
        </h2>
        <div className="space-y-10">
          {steps.map(({ number, title, desc }) => (
            <div key={number} className="flex items-start gap-6">
              <span className="text-3xl font-black text-slate-200 leading-none flex-shrink-0 w-10 text-right">{number}</span>
              <div>
                <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-y border-slate-100 px-4 py-20">
        <div className="max-w-screen-md mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">Why Folio Cafe</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12 tracking-tight">
            Built for professionals who value their time
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 px-4 py-20 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Ready to get discovered?
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Set up your profile in under 5 minutes. Toggle your availability so employers
            know when you&apos;re open to new opportunities.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Create your free profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-10 border-t border-slate-100">
        <div className="max-w-screen-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="text-sm">Folio Cafe</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/search" className="hover:text-slate-700 transition-colors">Browse Talent</Link>
            <Link href="/auth/signup" className="hover:text-slate-700 transition-colors">Join Free</Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 Folio Cafe</p>
        </div>
      </footer>
    </div>
  )
}
