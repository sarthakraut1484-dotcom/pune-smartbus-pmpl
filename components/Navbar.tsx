'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bus, LogOut, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logoutOverlay, setLogoutOverlay] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        const localUser = sessionStorage.getItem('localUser')
        setUser(localUser ? JSON.parse(localUser) : null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    setLogoutOverlay(true)
    sessionStorage.removeItem('localUser')
    sessionStorage.removeItem('isAdminAuthenticated')
    await signOut(auth)
    setTimeout(() => {
      setLogoutOverlay(false)
      router.push('/')
    }, 2000)
  }

  const links = [
    { href: '/book', label: 'Book Ticket' },
    { href: '/tickets', label: 'My Tickets' }
  ]

  return (
    <>
      {/* ── Logout Overlay ── */}
      <AnimatePresence>
        {logoutOverlay && (
          <motion.div
            key="logout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(14px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              gap: '20px'
            }}
          >
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* Pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.3)'
                }}
              />
              <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(239, 68, 68, 0.45)'
              }}>
                <LogOut size={38} color="#fff" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.5px',
                marginBottom: '6px'
              }}>
                Signed Out
              </div>
              <div style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
                You've been securely logged out. See you soon!
              </div>
            </motion.div>

            {/* SmartBus pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '7px 18px',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={14} color="#10b981" />
              Session ended safely
            </motion.div>

            {/* Progress bar */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                borderRadius: '0 3px 3px 0'
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left Side: Brand Logo */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <Link 
              href={(!loading && user) ? "/book" : "/"} 
              style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}
            >
              {/* Icon Container */}
              <div style={{ 
                width: '34px',
                height: '34px',
                background: '#0f172a',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
              }}>
                <Bus size={17} color="#ffffff" strokeWidth={2.2} />
              </div>
              {/* Brand Name */}
              <span style={{ 
                fontSize: '1.15rem', 
                fontWeight: 900, 
                letterSpacing: '-0.8px',
                color: '#0f172a',
                lineHeight: 1
              }}>
                Smart<span style={{ color: '#2563eb' }}>Bus</span>
              </span>
            </Link>
          </div>
          
          {/* Center: Interactive Nav Links (Only visible when logged in) */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {!loading && user && links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 800, 
                    color: isActive ? '#2563eb' : '#64748b', 
                    textDecoration: 'none', 
                    transition: 'color 0.2s ease',
                    position: 'relative',
                    padding: '6px 0'
                  }}
                >
                  {link.label}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-underline"
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: 0,
                        right: 0,
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                        borderRadius: '2px',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Side: Auth Badge / Quick Login CTA */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '1.25rem', alignItems: 'center' }}>
            {!loading && user && (
              <>
                {/* Premium Glassmorphic Commuter Badge */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(37, 99, 235, 0.05)', 
                  padding: '6px 14px', 
                  borderRadius: '14px', 
                  border: '1.5px solid rgba(37, 99, 235, 0.12)', 
                  color: '#2563eb', 
                  fontSize: '0.78rem', 
                  fontWeight: 850,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.02)'
                }}>
                  <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.2s infinite' }} />
                  <span style={{ color: '#0f172a' }}>{user.email ? user.email.split('@')[0] : 'Commuter'}</span>
                </div>

                {/* Logout Button */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout} 
                  style={{ 
                    background: 'none', 
                    border: '1.5px solid rgba(239, 68, 68, 0.15)',
                    cursor: 'pointer', 
                    color: '#ef4444',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontWeight: 700, 
                    fontSize: '0.82rem',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background2: 'rgba(239,68,68,0.04)'
                  } as React.CSSProperties}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </motion.button>
              </>
            )}
            
            {!loading && !user && (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link 
                  href="/login?redirect=/book" 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '0 20px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    height: '40px', 
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.25)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  Book Quick
                </Link>
              </motion.div>
            )}
          </div>
          
        </div>
      </nav>
    </>
  )
}

export default Navbar
