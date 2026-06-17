import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'TheraBee',
  description: 'Private clinical workflow support for therapists.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-therapy-gray text-therapy-navy">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
