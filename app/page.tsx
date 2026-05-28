'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { QrCode, ShieldCheck, Zap, ArrowRight, Star, Users, MapPin, Globe, Sparkles, Navigation, Bus, Activity, Bell, Ticket } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [liveStats, setLiveStats] = useState({
    occupancy: 12,
    totalEntries: 245,
    invalidScans: 0,
    lastValidation: 'None'
  })

  useEffect(() => {
    // 1. Subscribe to Firebase stats
    const statsRef = ref(db, 'stats')
    const unsubStats = onValue(statsRef, (snapshot) => {
      const val = snapshot.val()
      if (val) {
        setLiveStats(prev => ({
          ...prev,
          occupancy: val.current_occupancy || 0,
          totalEntries: val.total_entries || 0,
          invalidScans: val.invalid_scans || 0
        }))
      }
    })

    // 2. Subscribe to last validation QR
    const systemRef = ref(db, 'system/last_validation')
    const unsubSystem = onValue(systemRef, (snapshot) => {
      const val = snapshot.val()
      if (val) {
        setLiveStats(prev => ({
          ...prev,
          lastValidation: typeof val === 'string' ? val : val?.qr || 'None'
        }))
      }
    })

    // 3. Subscribe to Auth state
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        const localUser = sessionStorage.getItem('localUser')
        setUser(localUser ? JSON.parse(localUser) : null)
      }
    })

    return () => {
      unsubStats()
      unsubSystem()
      unsubAuth()
    }
  }, [])

  const features = [
    {
      icon: <Users size={20} />,
      title: 'Personalized Passes',
      desc: 'Smart cards printed digitally with your Title and Name for rapid transit verification.',
      color: '#0f172a'
    },
    {
      icon: <QrCode size={20} />,
      title: 'Anti-Screenshot QR',
      desc: 'High-contrast QR system containing security features to prevent replication.',
      color: '#0f172a'
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Instant Boarding',
      desc: 'Direct sub-second turnstile scans backed by real-time validation hardware.',
      color: '#0f172a'
    }
  ]

  const stats = [
    { label: 'Active riders', value: '1.2M+' },
    { label: 'Total Routes', value: '450+' },
    { label: 'Daily Trips', value: '15K+' },
    { label: 'Success', value: '99.9%' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f0fdf4 100%)', position: 'relative', overflow: 'hidden', paddingBottom: '100px' }}>
      
      {/* Glowing background mesh blobs */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Hero Section */}
      <section className="hero" style={{ padding: '100px 0 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                background: 'rgba(56, 189, 248, 0.08)', 
                border: '1.5px solid rgba(56, 189, 248, 0.25)', 
                color: '#0284c7', 
                borderRadius: '12px', 
                fontSize: '0.8rem', 
                fontWeight: 800, 
                marginBottom: '2rem', 
                boxShadow: '0 4px 15px rgba(2,132,199,0.05)',
                backdropFilter: 'blur(6px)'
              }}>
                <Sparkles size={14} /> <span>Trusted by 1.2M+ Pune Commuters</span>
              </div>
              
              <h1 style={{ 
                marginBottom: '1.5rem', 
                lineHeight: 1.1, 
                fontSize: '4.2rem', 
                letterSpacing: '-2.5px',
                fontWeight: 950,
                background: 'linear-gradient(135deg, #0f172a 30%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}>
                Redefining the <br />
                Future of Transit
              </h1>
              
              <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b', fontWeight: 650, lineHeight: 1.6, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
                Skip the long ticketing queues. Book official PMPL transit passes instantly with our advanced, debounced QR turnstile scanner framework.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href={user ? "/book" : "/login?redirect=/book"} className="btn btn-primary" style={{ 
                    height: '56px', 
                    padding: '0 40px', 
                    fontSize: '1.05rem', 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    boxShadow: '0 12px 25px -8px rgba(59, 130, 246, 0.5)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    Start Booking <ArrowRight size={18} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Advanced Features Section - Compact cards */}
      <section style={{ background: 'transparent', padding: '60px 0', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -6, 
                  boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 0 15px rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card"
                style={{ 
                  padding: '24px', 
                  textAlign: 'left', 
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.04)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a', letterSpacing: '-0.5px' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 550 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book Section */}
      <section style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(15, 23, 42, 0.05)', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', padding: '60px 0', position: 'relative', zIndex: 1, margin: '20px 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '1.5px' }}>Simple Step-by-Step Guide</span>
             <h2 style={{ fontSize: '2.0rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-1px', marginTop: '10px' }}>How to Book a Ticket & Board</h2>
             <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0', fontWeight: 550 }}>
               Get your smart bus pass and cross turnstiles in under 2 minutes. Follow these simple steps.
             </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', marginBottom: '16px', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>1</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>1. Personal Identification</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 550 }}>
                Provide your Title (Mr., Ms., Dr.) and First Name. This prints your personalized digital SmartPass ticket, ensuring secure verification.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', marginBottom: '16px', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>2</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>2. Choose Route Map</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 550 }}>
                Click visual nodes on our interactive track line map to select your source and destination. Fares are calculated dynamically based on distance stages.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', marginBottom: '16px', boxShadow: '0 4px 10px rgba(139,92,246,0.3)' }}>3</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>3. Pay & Tap Boarding</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 550 }}>
                Confirm payment, view your beautiful custom receipt, and unlock your digital pass. Tap the QR at the turnstile for instant millisecond entry!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid - Small */}
      <section className="container" style={{ margin: '40px auto', maxWidth: '900px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="card" 
              style={{ 
                padding: '1.5rem', 
                textAlign: 'center', 
                backgroundColor: '#fff', 
                border: '1px solid #f1f5f9',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0f172a', marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}
