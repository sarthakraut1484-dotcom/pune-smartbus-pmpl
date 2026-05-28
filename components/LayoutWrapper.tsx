'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { usePathname } from 'next/navigation'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname === '/admin'

  return (
    <>
      {!isAdminPage && <Navbar />}
      <main>{children}</main>
      {!isAdminPage && <Footer />}
    </>
  )
}
