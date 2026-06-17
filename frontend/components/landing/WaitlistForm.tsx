'use client'

import { FormEvent, useState } from 'react'

interface WaitlistFormProps {
  compact?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function WaitlistForm({ compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter a valid email address to join the waitlist.')
      return
    }

    setSubmitting(true)
    try {
      // Waitlist signups are handled outside the app for now.
      setMessage(`Thanks! We'll be in touch at ${normalizedEmail}.`)
      setEmail('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex w-full ${compact ? 'flex-col gap-3 sm:flex-row' : 'flex-col gap-3 lg:flex-row'}`}>
        <label className="sr-only" htmlFor={compact ? 'waitlist-email-compact' : 'waitlist-email'}>
          Email address
        </label>
        <input
          id={compact ? 'waitlist-email-compact' : 'waitlist-email'}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@practice.com"
          className="w-full rounded-full border border-[var(--landing-line)] bg-white/90 px-5 py-3 text-[15px] text-[var(--landing-ink)] outline-none transition focus:border-[var(--landing-coral)] focus:ring-2 focus:ring-[rgba(231,154,120,0.28)]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#172434] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Joining...' : 'Join waitlist'}
        </button>
      </div>

      <div className="mt-3 min-h-6 text-sm" aria-live="polite">
        {message ? <p className="text-[var(--landing-ink)]">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>
    </form>
  )
}
