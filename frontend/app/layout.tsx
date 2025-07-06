import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Therapist Helper AI',
  description: 'Session Assistant for Therapists',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-inter bg-therapy-gray text-therapy-navy">
        {children}
      </body>
    </html>
  )
} 