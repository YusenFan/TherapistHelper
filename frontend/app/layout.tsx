import type { Metadata } from 'next'
import './globals.css'
import MainLayout from '@/components/MainLayout'

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
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
} 