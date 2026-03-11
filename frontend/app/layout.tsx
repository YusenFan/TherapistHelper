import type { Metadata } from 'next'
import './globals.css'
import MainLayout from '@/components/MainLayout'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'TheraFlow',
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
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
} 