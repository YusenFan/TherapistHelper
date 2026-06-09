'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import WaitlistForm from './WaitlistForm'

const storySteps = [
  {
    title: 'Prep without scramble',
    description: 'Walk into session with the right context, prompts, and goals already surfaced.',
  },
  {
    title: 'Capture the important parts',
    description: 'Let AI reduce the note burden so your attention stays with the client, not the clock.',
  },
  {
    title: 'Reflect with more clarity',
    description: 'Turn transcripts and summaries into better follow-through, sharper patterns, and steadier care.',
  },
]

const trustPoints = [
  {
    title: 'Confidential LLM processing',
    description: 'AI support is designed around confidentiality so sensitive therapy work is not treated like casual consumer prompts.',
  },
  {
    title: 'Protected client data',
    description: 'Client records stay protected with encrypted storage patterns and clear separation between workflow help and raw information.',
  },
  {
    title: 'Built for therapist judgment',
    description: 'TheraBee supports reflection, documentation, and preparation without trying to replace the therapist in the room.',
  },
]

const featureStrip = [
  'Session prep that starts from context instead of blank pages',
  'Summaries and insights that reduce repetitive admin work',
  'A workflow that helps you stay present and clinically sharper',
]

function BeeMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--landing-coral)] text-white shadow-[0_18px_40px_rgba(231,154,120,0.25)]">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m6.364.636-1.414 1.414M21 12h-2m-1.222 5.778-1.414-1.414M12 19v2m-4.364-4.636-1.414 1.414M5 12H3m4.636-6.364L6.222 7.05M9 14a3 3 0 1 1 6 0c0 1.105-.597 1.983-1.33 2.74-.514.53-.67.878-.67 1.26H11c0-.382-.156-.73-.67-1.26C9.597 15.983 9 15.105 9 14Z" />
      </svg>
    </div>
  )
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion()

  const riseIn = reduceMotion
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 } }

  return (
    <main className="landing-shell landing-noise min-h-screen overflow-hidden text-[var(--landing-ink)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] overflow-hidden">
        <motion.div
          className="absolute left-[6%] top-28 h-56 w-56 rounded-full bg-[rgba(240,201,128,0.26)] blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[8%] top-16 h-72 w-72 rounded-full bg-[rgba(191,210,192,0.28)] blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, 22, 0], x: [0, -12, 0] }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-[rgba(231,154,120,0.18)] blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mx-auto mb-12 max-w-5xl rounded-full border border-[var(--landing-line)] bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <BeeMark />
              <div>
                <p className="text-xl font-semibold tracking-tight text-[var(--landing-ink)]">TheraBee</p>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--landing-muted)]">For therapists</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-[var(--landing-muted)] md:flex">
              <a href="#story" className="transition hover:text-[var(--landing-ink)]">How it works</a>
              <a href="#trust" className="transition hover:text-[var(--landing-ink)]">Privacy</a>
              <a href="#waitlist" className="transition hover:text-[var(--landing-ink)]">Waitlist</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden text-sm font-medium text-[var(--landing-ink)] sm:inline-flex">
                Sign in
              </Link>
              <a
                href="#waitlist"
                className="inline-flex items-center rounded-full border border-[var(--landing-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--landing-ink)] shadow-sm transition hover:-translate-y-0.5"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </header>

        <section className="relative py-10 sm:py-16">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-[var(--landing-line)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-muted)] shadow-sm">
              Confidential AI for therapy workflows
            </div>

            <h1 className="font-editorial text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--landing-ink)] sm:text-6xl lg:text-7xl">
              AI can simplify your workflow and help you become a better therapist.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--landing-muted)] sm:text-xl">
              Warm, thoughtful support for prep, notes, and reflection, so more of your energy stays where it matters most: with the person in front of you.
            </p>

            <p className="mx-auto mt-5 max-w-2xl text-sm font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/80">
              All LLM usage is confidential. Client data stays protected and encrypted.
            </p>

            <div id="waitlist" className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[var(--landing-line)] bg-white/88 p-4 shadow-[0_30px_90px_rgba(35,52,70,0.08)] backdrop-blur sm:p-5">
              <WaitlistForm />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--landing-muted)]">
              <span className="rounded-full bg-white/70 px-3 py-1">Simple one-page workflow</span>
              <span className="rounded-full bg-white/70 px-3 py-1">Built for therapist judgment</span>
              <span className="rounded-full bg-white/70 px-3 py-1">Private by design</span>
            </div>

            <div className="mt-8">
              <a
                href="#story"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-ink)] transition hover:gap-3"
              >
                Learn how it works
                <span aria-hidden="true">v</span>
              </a>
            </div>
          </motion.div>
        </section>

        <section id="story" className="py-16 sm:py-24">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="mb-10 flex max-w-3xl flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">How it works</p>
            <h2 className="font-editorial text-4xl font-semibold leading-tight sm:text-5xl">
              Less admin friction. More room for clinical presence.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
              TheraBee turns a fragmented therapy workflow into one calmer rhythm, helping you prepare faster, document with less drag, and reflect with more clarity after the session.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {storySteps.map((step, index) => (
              <motion.article
                key={step.title}
                {...riseIn}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.08, ease: 'easeOut' }}
                className="rounded-[2rem] border border-[var(--landing-line)] bg-white/78 p-7 shadow-[0_24px_60px_rgba(35,52,70,0.06)] backdrop-blur"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(231,154,120,0.18)] text-sm font-semibold text-[var(--landing-ink)]">
                  0{index + 1}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--landing-muted)]">{step.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="py-6 sm:py-10">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="rounded-[2.2rem] border border-[var(--landing-line)] bg-[rgba(255,255,255,0.78)] p-8 shadow-[0_30px_80px_rgba(35,52,70,0.07)] backdrop-blur sm:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">What gets simpler</p>
                <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                  Notes, prep, and reflection finally feel connected.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
                  Instead of bouncing between recordings, notes, memory, and admin tasks, you get one place where context carries forward and AI helps reduce the clerical load.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.8rem] border border-[var(--landing-line)] bg-[linear-gradient(180deg,rgba(240,201,128,0.16),rgba(255,255,255,0.95))] p-4">
                {featureStrip.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.08 }}
                    className="rounded-[1.4rem] bg-white/90 px-4 py-4 text-sm font-medium leading-6 text-[var(--landing-ink)] shadow-sm"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="trust" className="py-16 sm:py-24">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="mb-10 flex max-w-3xl flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">Trust</p>
            <h2 className="font-editorial text-4xl font-semibold leading-tight sm:text-5xl">
              Privacy language should feel as calm as the product.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
              The message is simple: confidential LLM support, protected client information, and a workflow that respects the seriousness of therapeutic work.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {trustPoints.map((point, index) => (
              <motion.article
                key={point.title}
                {...riseIn}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.08, ease: 'easeOut' }}
                className="rounded-[1.8rem] border border-[var(--landing-line)] bg-white/82 p-6 shadow-[0_18px_45px_rgba(35,52,70,0.05)]"
              >
                <div className="mb-4 h-10 w-10 rounded-2xl bg-[rgba(191,210,192,0.35)]" />
                <h3 className="text-xl font-semibold tracking-tight">{point.title}</h3>
                <p className="mt-3 text-base leading-7 text-[var(--landing-muted)]">{point.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="pb-8 pt-8 sm:pt-12">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="rounded-[2.4rem] border border-[var(--landing-line)] bg-[linear-gradient(140deg,rgba(35,52,70,0.98),rgba(47,68,84,0.96))] px-6 py-10 text-white shadow-[0_32px_90px_rgba(35,52,70,0.2)] sm:px-10 sm:py-12"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">Join the list</p>
                <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                  Be first to try the calmer version of your workflow.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
                  Join the waitlist for early access to TheraBee and we'll let you know when the private beta opens.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white/8 p-4 backdrop-blur">
                <WaitlistForm compact />
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
