import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'TalentDeck — Employers discover you',
  description:
    'A reverse job marketplace where employers discover talent instead of candidates applying to jobs.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
