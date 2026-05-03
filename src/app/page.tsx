import Link from 'next/link'

const talentBenefits = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Email notifications',
    desc: "You'll be emailed the moment an employer sends you an interview request — no need to keep checking the platform.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'No weekly subscription fee',
    desc: 'Unlike other platforms that charge recurring fees, Folio only requires a one-time $2 verification fee to get your badge.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Multiple job profiles',
    desc: 'Create and manage multiple role profiles from one account — frontend dev, data analyst, writer. Let employers find all of your skills.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '5× more interviews when verified',
    desc: 'Verified accounts rank higher in employer searches and carry a trust badge that signals credibility. Verification is a one-time process.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Global remote opportunities',
    desc: 'Employers from Europe, North America, and Asia hire directly through Folio. Showcase your skills to the world from wherever you are.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    title: 'You control availability',
    desc: 'Toggle your status to open or closed at any time. Employers only see you when you want to be found.',
  },
]

const employerBenefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Identity-verified talent',
    desc: 'Every verified candidate has gone through identity verification — you hire people, not just CVs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-ranked candidates',
    desc: 'Our AI matches and scores candidates against your role requirements. The best fits float to the top automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'African talent, global-ready',
    desc: 'Access a growing pool of skilled African professionals ready for remote and hybrid roles across all time zones.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Full pipeline management',
    desc: 'Move candidates from discovered → interviewed → offer → hired in one dashboard. Track every conversation in one place.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Custom screening questions',
    desc: 'Add role-specific questions to your pipeline. Candidates answer before you commit to an interview.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Talent-first experience',
    desc: 'Candidates are active and available. No ghosting, no stale CVs. They get notified and respond quickly.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your talent profile',
    desc: 'Set your role title, skills, salary expectation, and availability. Takes under 5 minutes.',
    forTalent: true,
  },
  {
    number: '02',
    title: 'Get verified',
    desc: "Complete a quick identity check for $2. Verified profiles get 5× more interview requests.",
    forTalent: true,
  },
  {
    number: '03',
    title: 'Employers find you',
    desc: 'Companies searching for your skills discover your profile. You get emailed when they send a request.',
    forTalent: true,
  },
]

const roles = [
  'Frontend Developer', 'Backend Developer', 'Virtual Assistant',
  'Content Writer', 'Customer Support', 'Social Media Manager',
  'UI/UX Designer', 'Data Analyst', 'Product Manager',
  'Video Editor', 'DevOps Engineer', 'Mobile Developer',
]

export default function LandingPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-4 pt-20 pb-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
        <div className="max-w-2xl mx-auto relative">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 border border-slate-700 bg-slate-900 px-3 py-1 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            African talent, ready for global work
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-5">
            Let Employers<br />
            <span className="text-slate-400">Find You.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 mb-9 max-w-xl mx-auto leading-relaxed">
            Build a professional profile, get verified, and let global companies
            send you interview requests — no job boards, no cover letters, no weekly fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup?role=talent"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              I&apos;m Talent — Get Discovered
            </Link>
            <Link
              href="/auth/signup?role=employer"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white font-semibold px-7 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              I&apos;m Hiring — Find Talent
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-5">Free to join · One-time $2 verification · No subscription</p>
        </div>
      </section>

      {/* ── Role pills ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900 border-y border-slate-800 px-4 py-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Roles on Folio
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {roles.map((role) => (
            <span key={role} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium px-4 py-1.5 rounded-full">
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* ── Africa, Global ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-screen-md mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Where talent meets the world</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-5 tracking-tight">
            African talent, built for global work
          </h2>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl mx-auto mb-12">
            Africa is home to one of the world&apos;s fastest-growing, most skilled workforces.
            Folio connects African professionals — developers, designers, analysts, writers —
            directly with companies hiring remotely around the world.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                stat: '100%',
                label: 'Remote-ready',
                desc: 'Every profile sets a timezone and work arrangement preference.',
              },
              {
                stat: 'Verified',
                label: 'Identity checked',
                desc: 'Employers hire from a pool of identity-verified professionals.',
              },
              {
                stat: 'Global',
                label: 'Opportunities',
                desc: 'Work with companies in Europe, North America, and Asia from anywhere in Africa.',
              },
            ].map(({ stat, label, desc }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                <div className="text-2xl font-black text-slate-900 mb-1">{stat}</div>
                <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (talent) ─────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100 px-4 py-20">
        <div className="max-w-screen-md mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">For talent</p>
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
          <div className="text-center mt-12">
            <Link href="/auth/signup?role=talent" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-700 transition-colors text-sm">
              Create your profile — free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Talent benefits ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-screen-md mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">Why talent choose Folio</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12 tracking-tight">
            A platform that works for you
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {talentBenefits.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Employer benefits ─────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-4 py-20">
        <div className="max-w-screen-md mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">For employers</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4 tracking-tight">
            Hire verified African talent
          </h2>
          <p className="text-slate-400 text-sm text-center mb-12 max-w-lg mx-auto leading-relaxed">
            Stop sifting through unverified applications. Folio gives you identity-checked,
            AI-matched candidates who are actively looking for work like yours.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employerBenefits.map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/auth/signup?role=employer"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              Start hiring — post your first role
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-slate-600 text-xs mt-3">$200 per pipeline · AI-ranked candidates · No monthly fee</p>
          </div>
        </div>
      </section>

      {/* ── Comparison callout ────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-screen-sm mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Different by design</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 tracking-tight">
            Not like other job platforms
          </h2>
          <div className="space-y-3">
            {[
              { theirs: 'You apply to jobs, mostly ignored', ours: 'Employers come to you, you respond' },
              { theirs: 'Weekly subscription fees', ours: 'One-time $2 verification, nothing more' },
              { theirs: 'Generic profile, no verification', ours: 'Identity-verified badge, trusted by employers' },
              { theirs: 'One profile per account', ours: 'Multiple role profiles, match more jobs' },
              { theirs: 'You chase companies', ours: 'You get email alerts when companies find you' },
            ].map(({ theirs, ours }) => (
              <div key={ours} className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 text-left">
                  <span className="text-red-400 font-bold mr-1.5">✗</span>{theirs}
                </div>
                <div className="bg-slate-900 rounded-xl px-4 py-3 text-sm text-white text-left font-medium">
                  <span className="text-emerald-400 font-bold mr-1.5">✓</span>{ours}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-4 py-24 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Ready to get discovered?
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Join thousands of African professionals already getting interview requests from
            global companies. Set up your profile in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              Create your free profile
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/auth/signup?role=employer"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-slate-400 font-semibold px-8 py-3.5 rounded-xl border border-slate-700 hover:text-white hover:border-slate-500 transition-colors text-sm"
            >
              I&apos;m hiring
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-5">No credit card · Free to join · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-4 py-10 border-t border-slate-100 bg-white">
        <div className="max-w-screen-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="text-sm">Folio</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <Link href="/search" className="hover:text-slate-700 transition-colors">Browse Talent</Link>
            <Link href="/auth/signup" className="hover:text-slate-700 transition-colors">Join Free</Link>
            <Link href="/auth/signup?role=employer" className="hover:text-slate-700 transition-colors">Post a Role</Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 Folio</p>
        </div>
      </footer>

    </div>
  )
}
