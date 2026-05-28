import '../styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import LayoutWrapper from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Bus Ticketing System | Seamless Travel',
  description: 'Fast, secure, and smart bus ticketing for the modern traveler. QR-based boarding and real-time tracking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
