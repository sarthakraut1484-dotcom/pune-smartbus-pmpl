'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Clock, MapPin, QrCode, Filter, ChevronRight, AlertCircle, Calendar, ArrowRight, ShieldCheck, CreditCard, Users, XCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { db, auth } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'

const TicketsPage = () => {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [tickets, setTickets] = useState<any[]>([])
  const [filter, setFilter] = useState('active')
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [qrIndex, setQrIndex] = useState(0)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const localUser = sessionStorage.getItem('localUser')
      if (!currentUser && !localUser) {
        router.push('/login?redirect=/tickets')
      } else {
        setAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tickets') || '[]')
    const now = Date.now()
    
    // Initial local expiration check
    const initialTickets = stored.map((t: any) => {
      if (t.status === 'active' && t.expiresAt && now > t.expiresAt) {
        return { ...t, status: 'expired' }
      }
      return t
    })
    setTickets(initialTickets)

    if (initialTickets.length === 0) return;

    // Listen to Firebase to synchronize statuses (e.g., when scanned and marked used/expired)
    const ticketsRef = ref(db, 'tickets')
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const dbTickets = snapshot.val() || {}
      
      const updatedTickets = initialTickets.map((localTicket: any) => {
        const dbTicket = dbTickets[localTicket.id]
        if (dbTicket) {
          return {
            ...localTicket,
            status: dbTicket.status
          }
        }
        return localTicket
      })

      setTickets(updatedTickets)
      localStorage.setItem('tickets', JSON.stringify(updatedTickets))

      // Keep the modal selection updated if it is currently open
      setSelectedTicket((prev: any) => {
        if (prev) {
          const matched = updatedTickets.find((t: any) => t.id === prev.id)
          return matched || prev
        }
        return null
      })
    })

    return () => unsubscribe()
  }, [])

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true
    return t.status === filter
  })

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%' }}
        />
        <p style={{ color: '#64748b', fontWeight: 800, fontSize: '0.9rem' }}>Authenticating passenger session...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '60px 0 120px' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ marginBottom: '4px', fontSize: '2rem' }}>Inventory</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Active and historical PMPL bus passes.</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            {['all', 'active', 'expired'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.75rem', 
                  borderRadius: '8px',
                  background: filter === f ? '#0f172a' : 'transparent',
                  color: filter === f ? '#fff' : '#64748b',
                  border: 'none',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px 40px', borderColor: '#f1f5f9' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#cbd5e1' }}>
                <Ticket size={24} />
             </div>
             <h3 style={{ marginBottom: '4px' }}>No Active Passes</h3>
             <p style={{ marginBottom: '24px', color: '#64748b', fontSize: '0.9rem' }}>Book a journey to see your passes here.</p>
             <Link href="/book" className="btn btn-primary" style={{ height: '44px', fontSize: '0.9rem' }}>Start Booking</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
            {filteredTickets.map((ticket, i) => {
              const isHovered = hoveredCardId === ticket.id;
              
              return (
                <div 
                  key={ticket.id} 
                  style={{ perspective: '1000px', width: '100%', height: '250px' }}
                  onMouseEnter={() => setHoveredCardId(ticket.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotateY: isHovered ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setQrIndex(0);
                    }}
                  >
                    {/* CARD FRONT SIDE */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        border: ticket.status === 'active' 
                          ? '1px solid rgba(59, 130, 246, 0.3)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Glowing Aura for Active Cards */}
                      {ticket.status === 'active' && (
                        <div style={{
                          position: 'absolute',
                          top: '-50%',
                          left: '-50%',
                          width: '200%',
                          height: '200%',
                          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)',
                          pointerEvents: 'none',
                          zIndex: 0
                        }} />
                      )}

                      {/* Metallic Smart Card Chip & NFC Icon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', zIndex: 1, position: 'relative' }}>
                        <svg width="34" height="26" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: ticket.status === 'active' ? 0.95 : 0.4 }}>
                          <rect width="42" height="32" rx="6" fill="url(#chip-grad)" />
                          <rect x="3" y="3" width="36" height="26" rx="4" stroke="#d97706" strokeWidth="1.5" strokeOpacity="0.4" />
                          <path d="M14 3V29M28 3V29M3 11H39M3 21H39" stroke="#d97706" strokeWidth="1" strokeOpacity="0.4" />
                          <rect x="14" y="11" width="14" height="10" rx="2" fill="#f59e0b" />
                          <defs>
                            <linearGradient id="chip-grad" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#fbbf24" />
                              <stop offset="0.5" stopColor="#f59e0b" />
                              <stop offset="1" stopColor="#d97706" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Glowing NFC Logo */}
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '16px', opacity: ticket.status === 'active' ? 0.95 : 0.4 }}>
                          <div style={{ width: '2px', height: '5px', background: '#fff', borderRadius: '10px' }} />
                          <div style={{ width: '2px', height: '9px', background: '#fff', borderRadius: '10px' }} />
                          <div style={{ width: '2px', height: '13px', background: '#fff', borderRadius: '10px' }} />
                          <div style={{ width: '2px', height: '16px', background: '#fff', borderRadius: '10px' }} />
                        </div>
                      </div>

                      {/* Card Brand Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', zIndex: 1, position: 'relative' }}>
                        <div>
                          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1.2px' }}>SmartPass Service</span>
                          <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#ffffff', letterSpacing: '-0.3px', marginTop: '1px' }}>{ticket.routeName}</div>
                        </div>
                        <div style={{ 
                          padding: '3px 8px', 
                          background: ticket.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                          color: ticket.status === 'active' ? '#34d399' : '#94a3b8', 
                          borderRadius: '6px', 
                          fontSize: '0.65rem', 
                          fontWeight: 950, 
                          textTransform: 'uppercase',
                          boxShadow: ticket.status === 'active' ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {ticket.status === 'active' && <div style={{ width: '5px', height: '5px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.2s infinite' }} />}
                          {ticket.status}
                        </div>
                      </div>

                      {/* Trip Route Display */}
                      <div style={{ marginBottom: '8px', zIndex: 1, position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.source}</div>
                          </div>
                          <div style={{ color: ticket.status === 'active' ? '#38bdf8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: ticket.status === 'active' ? 'drop-shadow(0 0 6px #38bdf8)' : 'none' }}>
                            <ArrowRight size={14} />
                          </div>
                          <div style={{ flex: 1, textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.destination}</div>
                          </div>
                        </div>
                        
                        {/* Dynamic Neon Track Line */}
                        <div style={{ 
                          height: '2px', 
                          background: ticket.status === 'active' ? 'linear-gradient(90deg, #38bdf8, #34d399)' : 'rgba(255, 255, 255, 0.1)', 
                          borderRadius: '2px', 
                          boxShadow: ticket.status === 'active' ? '0 0 8px rgba(56, 189, 248, 0.5)' : 'none' 
                        }} />
                      </div>

                      {/* Bottom Information Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', zIndex: 1, position: 'relative' }}>
                        <div>
                          <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Issued</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700 }}>
                            <Calendar size={10} /> {ticket.date}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fare Total</div>
                          <div style={{ fontSize: '1.0rem', fontWeight: 900, color: '#ffffff' }}>{ticket.totalFare}</div>
                        </div>
                      </div>

                      {/* Serial Overlay */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '8px', 
                        fontSize: '0.6rem', 
                        fontWeight: 800, 
                        color: '#94a3b8', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        zIndex: 1,
                        position: 'relative'
                      }}>
                        <span>{ticket.details}</span>
                        <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{ticket.id}</span>
                      </div>
                    </div>

                    {/* CARD BACK SIDE (No QR, detailed user/ticket info) */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: ticket.status === 'active' 
                          ? '1px solid rgba(59, 130, 246, 0.3)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Header: Pass & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Official Receipt Details</span>
                        <div style={{ 
                          padding: '3px 8px', 
                          background: ticket.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                          color: ticket.status === 'active' ? '#34d399' : '#94a3b8', 
                          borderRadius: '6px', 
                          fontSize: '0.6rem', 
                          fontWeight: 900 
                        }}>{ticket.status}</div>
                      </div>

                      {/* Detailed Ticket receipt lines */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', margin: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Corridor:</span>
                          <span style={{ color: '#fff', fontWeight: 800 }}>{ticket.routeName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Segment:</span>
                          <span style={{ color: '#fff', fontWeight: 800 }}>{ticket.source} ➔ {ticket.destination}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Passenger:</span>
                          <span style={{ color: '#fff', fontWeight: 800 }}>{ticket.details}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Issued On:</span>
                          <span style={{ color: '#fff', fontWeight: 800 }}>{ticket.date} {ticket.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', paddingBottom: '2px' }}>
                          <span style={{ color: '#94a3b8' }}>Total Paid:</span>
                          <span style={{ color: '#38bdf8', fontWeight: 900 }}>{ticket.totalFare}</span>
                        </div>
                      </div>

                      {/* Click to Scan Action Box */}
                      <div style={{ 
                        width: '100%', 
                        background: 'rgba(56, 189, 248, 0.08)', 
                        border: '1.5px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '10px', 
                        padding: '6px 12px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.7rem',
                        color: '#38bdf8',
                        fontWeight: 800,
                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.08)'
                      }}>
                        <QrCode size={14} />
                        <span>Click card to view Boarding QR</span>
                      </div>

                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal - Small */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="modal-overlay" 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(15, 23, 42, 0.65)', 
                backdropFilter: 'blur(12px)', 
                zIndex: 10000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '20px' 
              }} 
              onClick={() => setSelectedTicket(null)}
            >
              <motion.div 
                initial={{ scale: 0.92, y: 30 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.92, y: 30 }} 
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                style={{ 
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                  borderRadius: '24px', 
                  width: '100%', 
                  maxWidth: '380px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px rgba(59, 130, 246, 0.12)' 
                }} 
                onClick={e => e.stopPropagation()}
              >
                {/* Header Section */}
                <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    background: 'rgba(59, 130, 246, 0.12)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    color: '#38bdf8',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.15)'
                  }}>
                    <QrCode size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', marginBottom: '4px' }}>Boarding QR</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scan at the bus turnstile.</p>
                </div>
                
                {/* Content Section */}
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                    {selectedTicket.qrCodes && selectedTicket.qrCodes.length > 1 && (
                      <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={qrIndex === 0}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.08)', 
                          borderRadius: '50%', 
                          width: '36px', 
                          height: '36px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#fff', 
                          cursor: qrIndex === 0 ? 'not-allowed' : 'pointer', 
                          opacity: qrIndex === 0 ? 0.25 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                      </motion.button>
                    )}
                    
                    {/* Futuristic QR Container - Light Theme without Animation */}
                    <div style={{ 
                      padding: '20px', 
                      background: '#ffffff', 
                      borderRadius: '24px', 
                      display: 'inline-block', 
                      border: '1.5px solid #f1f5f9',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {selectedTicket.status === 'active' ? (
                        <div style={{ position: 'relative', display: 'block' }}>
                          <QRCodeSVG 
                            value={selectedTicket.qrCodes ? selectedTicket.qrCodes[qrIndex] : selectedTicket.id} 
                            size={160} 
                            bgColor="#ffffff" 
                            fgColor="#000000" 
                          />
                        </div>
                      ) : (
                        <div style={{ 
                          width: 160, 
                          height: 160, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#ef4444', 
                          background: 'rgba(239, 68, 68, 0.05)', 
                          border: '1.5px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '16px' 
                        }}>
                          <XCircle size={40} style={{ marginBottom: '8px', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }} />
                          <span style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px' }}>EXPIRED</span>
                        </div>
                      )}
                    </div>

                    {selectedTicket.qrCodes && selectedTicket.qrCodes.length > 1 && (
                      <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrIndex(prev => Math.min(selectedTicket.qrCodes.length - 1, prev + 1));
                        }}
                        disabled={qrIndex === selectedTicket.qrCodes.length - 1}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.08)', 
                          borderRadius: '50%', 
                          width: '36px', 
                          height: '36px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#fff', 
                          cursor: qrIndex === selectedTicket.qrCodes.length - 1 ? 'not-allowed' : 'pointer', 
                          opacity: qrIndex === selectedTicket.qrCodes.length - 1 ? 0.25 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <ChevronRight size={20} />
                      </motion.button>
                    )}
                  </div>
                  
                  {selectedTicket.qrCodes && selectedTicket.qrCodes.length > 1 && (
                    <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Passenger {qrIndex + 1} of {selectedTicket.qrCodes.length}
                    </div>
                  )}
                  
                  {/* Segment and Ticket Info details block */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '20px', 
                    borderRadius: '18px', 
                    textAlign: 'left' 
                  }}>
                     <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '2px', letterSpacing: '0.5px' }}>Segment</div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{selectedTicket.source} → {selectedTicket.destination}</div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>ID</div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', fontFamily: 'monospace', marginTop: '2px' }}>
                            {selectedTicket.qrCodes ? selectedTicket.qrCodes[qrIndex] : selectedTicket.id}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '2px' }}>Status</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            {selectedTicket.status === 'active' && (
                              <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.2s infinite' }} />
                            )}
                            <span style={{ 
                              fontWeight: 900, 
                              fontSize: '0.85rem', 
                              color: selectedTicket.status === 'active' ? '#34d399' : '#94a3b8' 
                            }}>
                              {selectedTicket.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div style={{ padding: '0 32px 32px' }}>
                   <motion.button 
                     whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(59, 130, 246, 0.45)' }}
                     whileTap={{ scale: 0.98 }}
                     style={{ 
                       width: '100%', 
                       height: '48px',
                       background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                       color: '#ffffff',
                       border: 'none',
                       borderRadius: '14px',
                       fontWeight: 800,
                       fontSize: '0.95rem',
                       cursor: 'pointer',
                       boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                       transition: 'all 0.2s ease'
                     }} 
                     onClick={() => setSelectedTicket(null)}
                   >
                     Close
                   </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default TicketsPage
