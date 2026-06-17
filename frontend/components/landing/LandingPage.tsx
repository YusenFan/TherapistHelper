'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import therabeeLogo from '@/assets/therabee_logo_only.png'
import WaitlistForm from './WaitlistForm'

const capabilities = [
  {
    title: 'Clinical Documentation',
    description: 'Create client profiles and turn brief voice notes or session summaries into high-quality clinical documentation.',
    items: ['Progress notes', 'Treatment plans', 'Intake summaries', 'Termination notes'],
  },
  {
    title: 'Professional Writing',
    description: 'Draft everyday practice communications with a tone that stays clear, professional, and clinically appropriate.',
    items: ['Client emails', 'Referral letters', 'Consultation summaries', 'Administrative correspondence'],
  },
  {
    title: 'Clinical Reflection',
    description: 'Reflect on patterns, themes, and treatment considerations across client records with therapist-centered support.',
    items: ['Pattern tracking', 'Treatment themes', 'Case formulation prompts', 'Next-session considerations'],
  },
]

const trustPoints = [
  {
    title: 'Compliance you can stand behind',
    description: 'TheraBee is built to be compliant with GDPR, CCPA, HIPAA, and SOC 2, giving your practice a privacy foundation that matches the seriousness of clinical care.',
  },
  {
    title: 'Private tools, not data harvesting',
    description: 'Your notes, transcripts, and client context are not used to train outside systems. Therabee helps you think and document without learning from your clients.',
  },
  {
    title: 'Private from start to finish',
    description: 'Client data stays protected across the whole workflow, from capture to analysis to storage, so sensitive therapeutic work remains held with care.',
  },
]

const chatToolConcerns = [
  'Client details can become mixed across conversations or workflows.',
  'Consumer writing tools are not designed around psychotherapy documentation.',
  'Clinical relevance, privacy expectations, and record separation are left for you to manage.',
]

const workflowPoints = [
  'Spend less time documenting and more time practicing therapy.',
  'Keep client confidentiality at the center of the work outside the therapy room.',
  'Use one private clinical workspace instead of scattered notes, prompts, and drafts.',
]

function BeeMark() {
  return (
    <Image src={therabeeLogo} alt="TheraBee logo" width={44} height={44} className="h-11 w-11 rounded-full" priority />
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
              <a href="#about" className="transition hover:text-[var(--landing-ink)]">What it is</a>
              <a href="#capabilities" className="transition hover:text-[var(--landing-ink)]">What it does</a>
              <a href="#trust" className="transition hover:text-[var(--landing-ink)]">Privacy</a>
            </nav>

            <div className="flex items-center gap-3">
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
              Created by therapists, for therapists
            </div>

            <h1 className="font-editorial text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--landing-ink)] sm:text-6xl lg:text-7xl">
              Save Your Time and Become a Better Therapist.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--landing-muted)] sm:text-xl">
              Therabee helps with documentation, professional writing, and clinical reflection while keeping client confidentiality at the center.
            </p>

            <p className="mx-auto mt-5 max-w-2xl inline-block rounded-full bg-[rgba(240,201,128,0.35)] px-5 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--landing-ink)]">
              Private by design
            </p>

            <div id="waitlist" className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[var(--landing-line)] bg-white/88 p-4 shadow-[0_30px_90px_rgba(35,52,70,0.08)] backdrop-blur sm:p-5">
              <WaitlistForm />
            </div>

          </motion.div>
        </section>

        <section id="about" className="py-16 sm:py-24">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="mb-10 flex max-w-3xl flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">What is Therabee?</p>
            <h2 className="font-editorial text-4xl font-semibold leading-tight sm:text-5xl">
              A private clinical workflow tool for the work clinicians carry after session ends.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
              As clinicians, we want to spend our time helping clients, not getting buried in documentation, paperwork, and administrative tasks. Therabee helps you complete the work that happens outside the therapy room more efficiently while keeping client confidentiality at the center of everything.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {workflowPoints.map((point, index) => (
              <motion.article
                key={point}
                {...riseIn}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.08, ease: 'easeOut' }}
                className="rounded-[2rem] border border-[var(--landing-line)] bg-white/78 p-7 shadow-[0_24px_60px_rgba(35,52,70,0.06)] backdrop-blur"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(231,154,120,0.18)] text-sm font-semibold text-[var(--landing-ink)]">
                  0{index + 1}
                </div>
                <p className="text-lg font-semibold leading-7 text-[var(--landing-ink)]">{point}</p>
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
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">Why not just use ChatGPT?</p>
                <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                  Psychotherapy needs more than a general chat box.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
                  Consumer writing tools can be useful, but they are not built around client records, clinical continuity, or the privacy expectations of psychotherapy. Therabee is organized around confidential clinical work, so client context stays separated, relevant, and easier to trust.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.8rem] border border-[var(--landing-line)] bg-[linear-gradient(180deg,rgba(240,201,128,0.16),rgba(255,255,255,0.95))] p-4">
                {chatToolConcerns.map((item, index) => (
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

        <section id="capabilities" className="py-16 sm:py-24">
          <motion.div
            {...riseIn}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="mb-10 flex max-w-3xl flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">What can Therabee do?</p>
            <h2 className="font-editorial text-4xl font-semibold leading-tight sm:text-5xl">
              Documentation, writing, and reflection in one private clinical workspace.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
              Therabee supports the work that makes care possible but often steals time from care itself.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <motion.article
                key={capability.title}
                {...riseIn}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.08, ease: 'easeOut' }}
                className="rounded-[2rem] border border-[var(--landing-line)] bg-white/82 p-7 shadow-[0_24px_60px_rgba(35,52,70,0.06)] backdrop-blur"
              >
                <h3 className="text-2xl font-semibold tracking-tight">{capability.title}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--landing-muted)]">{capability.description}</p>
                <ul className="mt-6 space-y-3">
                  {capability.items.map((item) => (
                    <li key={item} className="rounded-[1rem] bg-[rgba(191,210,192,0.22)] px-4 py-3 text-sm font-semibold text-[var(--landing-ink)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
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
              A private space for the work people trust you with.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
              Therapy data is not ordinary data. Therabee treats every note, transcript, and reflection as entrusted clinical context, protected from outside-system training, leakage, and unnecessary exposure.
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
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">Join the waitlist</p>
                <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                  Be first to try the calmer version of your workflow.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
                  Leave your email and we will notify you when early access opens.
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
