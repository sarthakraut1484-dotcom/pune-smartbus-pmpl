'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, CreditCard, AlertCircle, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { db, auth } from '@/lib/firebase'
import { ref, set } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'

const BookingPage = () => {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    adults: 1,
    children: 0,
    source: '',
    destination: '',
    routeId: 1
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const localUser = sessionStorage.getItem('localUser')
      if (!currentUser && !localUser) {
        router.push('/login?redirect=/book')
      } else {
        setAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // No URL prefill needed for passenger count mode

  const showToast = (msg: string) => setToast(msg)

  // PMPL Realistic Locations & Distance Mapping (Approx km from Center)
  const locationsMap: {[key: string]: number} = {
    'Akurdi': 18,
    'Aundh Gaon': 7,
    'Baner High Street': 10,
    'Bibwewadi': 5,
    'Chinchwad Station': 16,
    'Dhankawadi': 5,
    'Fatima Nagar': 5,
    'Hadapsar Gadital': 7,
    'Hinjewadi Phase 3': 18,
    'Katraj Depo': 8,
    'Kothrud Stand': 6,
    'Laxmi Narayan Theatre': 1,
    'Magarpatta City': 9,
    'Nigdi Bhakti-Shakti': 20,
    'Padmavati': 3,
    'Pimpri Chowk': 15,
    'Pulgate': 3,
    'Pune Railway Station': 2,
    'Race Course': 4,
    'Shivaji Nagar': 3,
    'Swargate Hub': 0,
    'Viman Nagar': 8,
    'Wagholi': 14,
    'Warje Malwadi': 9,
    'Yerwada': 5
  }

  const locations = Object.keys(locationsMap).sort()

  const visualStops = [
    { name: 'Katraj Depo', status: 'Quiet', color: '#10b981', occupancy: '22%' },
    { name: 'Swargate Hub', status: 'Highly Busy', color: '#ef4444', occupancy: '88%' },
    { name: 'Shivaji Nagar', status: 'Moderate', color: '#f59e0b', occupancy: '54%' },
    { name: 'Pune Railway Station', status: 'Busy', color: '#ef4444', occupancy: '75%' },
    { name: 'Hinjewadi Phase 3', status: 'Quiet', color: '#10b981', occupancy: '18%' }
  ];

  const handleTimelineNodeClick = (name: string) => {
    if (!formData.source) {
      setFormData(prev => ({ ...prev, source: name }));
      showToast(`Selected Source: ${name}`);
    } else if (formData.source === name) {
      setFormData(prev => ({ ...prev, source: '', destination: '' }));
    } else if (!formData.destination) {
      setFormData(prev => ({ ...prev, destination: name }));
      showToast(`Selected Destination: ${name}`);
    } else {
      setFormData(prev => ({ ...prev, source: name, destination: '' }));
      showToast(`Selected Source: ${name}`);
    }
  };

  const getPMPLFares = (source: string, destination: string) => {
    if (!source || !destination) return { adult: 10, child: 5 };
    const dist = Math.abs(locationsMap[source] - locationsMap[destination]);
    
    let adult = 5;
    let child = 5;
    
    if (dist <= 2) {
      adult = 5;
      child = 5;
    } else if (dist <= 6) {
      adult = 10;
      child = 5;
    } else if (dist <= 10) {
      adult = 15;
      child = 10;
    } else if (dist <= 14) {
      adult = 20;
      child = 10;
    } else if (dist <= 20) {
      adult = 25;
      child = 15;
    } else if (dist <= 26) {
      adult = 30;
      child = 15;
    } else if (dist <= 32) {
      adult = 35;
      child = 15;
    } else if (dist <= 38) {
      adult = 40;
      child = 20;
    } else if (dist <= 44) {
      adult = 45;
      child = 20;
    } else if (dist <= 50) {
      adult = 50;
      child = 25;
    } else if (dist <= 56) {
      adult = 55;
      child = 25;
    } else {
      adult = 60;
      child = 30;
    }
    
    return { adult, child };
  }

  const pmplFares = getPMPLFares(formData.source, formData.destination);
  const baseFare = pmplFares.adult;
  const totalPassengers = formData.adults + formData.children;

  const routesOptions = [
    { id: 1, name: 'Single Journey', price: baseFare },
    { id: 2, name: 'Daily Pass (Unlimited)', price: 70 }
  ]

  const currentRoute = routesOptions.find(r => r.id === formData.routeId) || routesOptions[0]
  const totalFare = currentRoute.id === 1 
    ? (pmplFares.adult * formData.adults + pmplFares.child * formData.children)
    : (70 * (formData.adults + formData.children))

  const handleNext = () => {
    if (step === 2) {
      if (!formData.source) return showToast('Please select source station');
      if (!formData.destination) return showToast('Please select destination station');
    }
    if (step < 3) setStep(step + 1)
  }

  const handleBook = () => {
    const now = Date.now()
    // Daily pass (routeId === 2) should be valid until the end of the current day (11:59:59.999 PM)
    let expiresAt = now + (3 * 60 * 60 * 1000)
    if (formData.routeId === 2) {
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      expiresAt = endOfDay.getTime()
    }

    const passCode = 'PMPL-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const ticketId = 'PASS-' + Math.random().toString(36).substr(2, 6).toUpperCase()

    const newTicket = {
      ...formData,
      id: ticketId,
      qrCodes: [passCode],
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      timestamp: now,
      status: 'active',
      expiresAt,
      routeName: currentRoute.name,
      totalFare: `₹${totalFare}`,
      details: `${formData.adults} Adult${formData.adults > 1 ? 's' : ''}${formData.children > 0 ? ` · ${formData.children} Child${formData.children > 1 ? 'ren' : ''}` : ''}`
    }

    // Save to Firebase
    set(ref(db, `tickets/${ticketId}`), newTicket)

    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    localStorage.setItem('tickets', JSON.stringify([newTicket, ...existingTickets]))

    confetti({
      particleCount: 150,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0f172a', '#3b82f6', '#10b981']
    })
    
    setStep(4)
  }

  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '50px', flexWrap: 'wrap' }}>
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '50%', 
              background: step > i 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : (step === i ? 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)' : '#f8fafc'), 
              color: step >= i ? '#fff' : '#64748b', 
              border: step >= i ? 'none' : '1.5px solid #cbd5e1',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '0.9rem', 
              transition: 'all 0.3s ease',
              boxShadow: step === i 
                ? '0 0 15px rgba(56, 189, 248, 0.4)' 
                : (step > i ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none')
            }}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              color: step >= i ? '#0f172a' : '#64748b'
            }}>
              {i === 1 ? 'Travelers' : i === 2 ? 'Route' : 'Fare'}
            </span>
          </div>
          {i < 3 && <div style={{ 
            width: '40px', 
            height: '2px', 
            background: step > i 
              ? 'linear-gradient(90deg, #38bdf8, #10b981)' 
              : '#e2e8f0' 
          }} />}
        </React.Fragment>
      ))}
    </div>
  )

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
      <style>{`
        @media (max-width: 580px) {
          .responsive-selectors {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .visual-track-container {
            overflow-x: auto !important;
            padding-bottom: 20px !important;
          }
          .visual-track-inner {
            min-width: 480px !important;
          }
        }
      `}</style>
      <div className="container" style={{ maxWidth: '680px' }}>
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.95 }} 
              style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                x: '-50%',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(56, 189, 248, 0.15)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle size={18} color="#38bdf8" /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2.5rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>PMPL Booking</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '0.95rem' }}>Generate an official Pune smart-bus pass instantly.</p>

        <StepIndicator />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="s1" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '36px',
                borderRadius: '24px'
              }}
            >
               <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ marginBottom: '4px', fontWeight: 900, color: '#fff' }}>Passengers</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Select how many adults and children are travelling.</p>
               </div>

               {/* Passenger Counter Cards */}
               <div style={{ display: 'grid', gap: '16px' }}>
                 {[
                   { key: 'adults' as const, label: 'Adult', sub: '13+ years', min: 1, max: 9 },
                   { key: 'children' as const, label: 'Child', sub: 'Under 13', min: 0, max: 9 }
                 ].map(({ key, label, sub, min, max }) => (
                   <div key={key} style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     padding: '18px 22px',
                     background: 'rgba(255,255,255,0.03)',
                     border: '1px solid rgba(255,255,255,0.08)',
                     borderRadius: '16px'
                   }}>
                     <div>
                       <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{label}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{sub}</div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                       <button
                         type="button"
                         onClick={() => setFormData(prev => ({ ...prev, [key]: Math.max(min, prev[key] - 1) }))}
                         disabled={formData[key] === min}
                         style={{
                           width: '36px', height: '36px', borderRadius: '50%',
                           background: formData[key] === min ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.12)',
                           border: formData[key] === min ? '1px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(56,189,248,0.3)',
                           color: formData[key] === min ? '#475569' : '#38bdf8',
                           fontSize: '1.2rem', fontWeight: 700, cursor: formData[key] === min ? 'not-allowed' : 'pointer',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease'
                         }}
                       >−</button>
                       <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', minWidth: '20px', textAlign: 'center' }}>
                         {formData[key]}
                       </span>
                       <button
                         type="button"
                         onClick={() => setFormData(prev => ({ ...prev, [key]: Math.min(max, prev[key] + 1) }))}
                         disabled={formData[key] === max}
                         style={{
                           width: '36px', height: '36px', borderRadius: '50%',
                           background: formData[key] === max ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.12)',
                           border: formData[key] === max ? '1px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(56,189,248,0.3)',
                           color: formData[key] === max ? '#475569' : '#38bdf8',
                           fontSize: '1.2rem', fontWeight: 700, cursor: formData[key] === max ? 'not-allowed' : 'pointer',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease'
                         }}
                       >+</button>
                     </div>
                   </div>
                 ))}

                 {/* Passenger Summary Pill */}
                 <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(56,189,248,0.06)', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.12)' }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                     {formData.adults + formData.children} Passenger{formData.adults + formData.children > 1 ? 's' : ''} selected
                   </span>
                 </div>
               </div>

               <motion.button
                 whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(59, 130, 246, 0.4)' }}
                 whileTap={{ scale: 0.98 }}
                 style={{
                   width: '100%',
                   marginTop: '32px',
                   height: '56px',
                   background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                   color: '#ffffff',
                   border: 'none',
                   borderRadius: '14px',
                   fontWeight: 800,
                   fontSize: '0.95rem',
                   cursor: 'pointer',
                   boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)',
                   transition: 'all 0.2s ease'
                 }}
                 onClick={handleNext}
               >
                 Next: Select Stations
               </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="s2" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '36px',
                borderRadius: '24px',
                width: '100%'
              }}
            >
               <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '4px', fontWeight: 900, color: '#fff' }}>Select PMPL Station Route</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Click on the visual nodes or use the selectors to define your journey. Fares dynamically calculate based on distance stages.</p>
               </div>

               {/* Interactive Visual Stop Timeline Map */}
               <div className="visual-track-container" style={{ 
                 position: 'relative', 
                 margin: '36px 0 44px', 
                 padding: '24px 20px 32px',
                 background: 'rgba(0, 0, 0, 0.15)',
                 borderRadius: '20px',
                 border: '1px solid rgba(255, 255, 255, 0.05)',
                 boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
                 overflow: 'hidden'
               }}>
                 <div className="visual-track-inner" style={{ width: '100%' }}>
                   <div style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '1.25px', marginBottom: '28px', textAlign: 'center', textShadow: '0 0 8px rgba(56, 189, 248, 0.2)' }}>
                     Interactive Transit Track Line (Click nodes to select)
                   </div>
                   
                   {/* Track Line Backing */}
                   <div style={{ position: 'relative', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', margin: '0 40px' }}>
                   
                   {formData.source && formData.destination && (() => {
                     const sIdx = visualStops.findIndex(s => s.name === formData.source);
                     const dIdx = visualStops.findIndex(s => s.name === formData.destination);
                     if (sIdx !== -1 && dIdx !== -1) {
                       const startPct = (Math.min(sIdx, dIdx) / (visualStops.length - 1)) * 100;
                       const endPct = (Math.max(sIdx, dIdx) / (visualStops.length - 1)) * 100;
                       return (
                         <motion.div 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           style={{ 
                             position: 'absolute', 
                             left: `${startPct}%`, 
                             width: `${endPct - startPct}%`, 
                             height: '100%', 
                             background: 'linear-gradient(90deg, #38bdf8, #34d399)',
                             borderRadius: '4px',
                             boxShadow: '0 0 15px rgba(56, 189, 248, 0.7)'
                           }} 
                         />
                       );
                     }
                     return null;
                   })()}

                   {/* Gliding Bus Bullet Icon */}
                   {formData.source && (() => {
                     const sIdx = visualStops.findIndex(s => s.name === formData.source);
                     const dIdx = visualStops.findIndex(s => s.name === formData.destination);
                     const activeIdx = dIdx !== -1 ? dIdx : sIdx;
                     const leftPct = (activeIdx / (visualStops.length - 1)) * 100;
                     return (
                       <motion.div 
                         layout
                         transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                         style={{ 
                           position: 'absolute', 
                           left: `calc(${leftPct}% - 16px)`,
                           top: '-14px',
                           width: '32px',
                           height: '32px',
                           background: '#38bdf8',
                           borderRadius: '50%',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           color: '#0f172a',
                           boxShadow: '0 0 15px #38bdf8',
                           zIndex: 10
                         }}
                       >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 1.2s infinite' }}>
                           <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                           <circle cx="7" cy="17" r="2" />
                           <path d="M9 17h6" />
                           <circle cx="17" cy="17" r="2" />
                         </svg>
                       </motion.div>
                     );
                   })()}
                 </div>

                 {/* Nodes Row */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', position: 'relative' }}>
                   {visualStops.map((stop, idx) => {
                     const isSource = formData.source === stop.name;
                     const isDest = formData.destination === stop.name;
                     const isSelected = isSource || isDest;
                     
                     // Check if node is part of the path sequence
                     let isPath = false;
                     if (formData.source && formData.destination) {
                       const sIdx = visualStops.findIndex(s => s.name === formData.source);
                       const dIdx = visualStops.findIndex(s => s.name === formData.destination);
                       const min = Math.min(sIdx, dIdx);
                       const max = Math.max(sIdx, dIdx);
                       isPath = idx >= min && idx <= max;
                     }

                     return (
                       <div key={stop.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px', cursor: 'pointer' }} onClick={() => handleTimelineNodeClick(stop.name)}>
                         
                         {/* Node Circle */}
                         <motion.div 
                           whileHover={{ scale: 1.2 }}
                           style={{ 
                             width: '20px', 
                             height: '20px', 
                             borderRadius: '50%', 
                             background: isSelected 
                               ? (isSource ? '#38bdf8' : '#34d399') 
                               : (isPath ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.7), rgba(52, 211, 153, 0.7))' : '#0b0f19'),
                             border: isSelected ? '3px solid #fff' : '2.5px solid rgba(255, 255, 255, 0.15)',
                             boxShadow: isSelected 
                               ? `0 0 12px ${isSource ? '#38bdf8' : '#34d399'}` 
                               : 'none',
                             zIndex: 5,
                             transition: 'background 0.3s, border 0.3s'
                           }}
                         />
                         
                         {/* Stop Details */}
                         <span style={{ 
                           fontSize: '0.7rem', 
                           fontWeight: isSelected ? 900 : 700, 
                           color: isSelected ? '#fff' : '#94a3b8', 
                           textAlign: 'center',
                           marginTop: '8px',
                           lineHeight: 1.2,
                           height: '24px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}>
                           {stop.name.replace(' Depo', '').replace(' Hub', '').replace(' Station', '')}
                         </span>

                         {/* Crowd Badge */}
                         <div style={{ 
                           marginTop: '4px', 
                           fontSize: '0.52rem', 
                           fontWeight: 800, 
                           padding: '2px 5px', 
                           background: `${stop.color}15`, 
                           color: stop.color,
                           borderRadius: '4px',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '3px'
                         }}>
                           <span style={{ width: '4px', height: '4px', background: stop.color, borderRadius: '50%' }} />
                           {stop.occupancy}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
               </div>

               {/* Manual Selectors Grid */}
               <div className="responsive-selectors" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px' }}>Source Stop</label>
                    <select 
                      value={formData.source} 
                      onChange={e => setFormData({...formData, source: e.target.value})}
                      style={{ 
                        height: '52px', 
                        background: '#0b0f19', 
                        color: '#fff', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '14px', 
                        padding: '0 16px',
                        width: '100%',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="">Select Stop</option>
                      {locations.map(l => <option key={l} value={l} style={{ background: '#0f172a' }}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px' }}>Destination Stop</label>
                    <select 
                      value={formData.destination} 
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                      style={{ 
                        height: '52px', 
                        background: '#0b0f19', 
                        color: '#fff', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '14px', 
                        padding: '0 16px',
                        width: '100%',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="">Select Stop</option>
                      {locations.filter(l => l !== formData.source).map(l => (
                        <option key={l} value={l} style={{ background: '#0f172a' }}>{l}</option>
                      ))}
                    </select>
                  </div>
               </div>
               
               {/* Service Type Selection */}
               <div style={{ marginTop: '32px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.5px' }}>Service Type</label>
                  <div className="responsive-selectors" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                     {routesOptions.map(r => {
                       const isSelected = formData.routeId === r.id;
                       return (
                         <div 
                           key={r.id} 
                           onClick={() => setFormData({...formData, routeId: r.id})} 
                           style={{ 
                             padding: '16px 20px', 
                             borderRadius: '16px', 
                             border: '1.5px solid', 
                             borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)', 
                             cursor: 'pointer',
                             background: isSelected ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 255, 255, 0.02)', 
                             transition: 'all 0.2s ease',
                             boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none',
                             zIndex: 1,
                             position: 'relative'
                           }}
                         >
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff', marginBottom: '4px' }}>{r.name}</div>
                             <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Rate: ₹{r.price}</div>
                         </div>
                       );
                     })}
                  </div>
               </div>

               {/* Flow Controls */}
               <div style={{ display: 'flex', gap: '16px', marginTop: '36px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      height: '56px',
                      padding: '0 24px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(59, 130, 246, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1,
                      height: '56px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)'
                    }}
                    onClick={handleNext}
                  >
                    Confirm Fare
                  </motion.button>
               </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div 
              key="s3" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '36px',
                borderRadius: '24px'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  background: 'rgba(56, 189, 248, 0.12)', 
                  borderRadius: '50%', 
                  color: '#38bdf8', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
                }}>
                   <CreditCard size={24} />
                </div>
                <h3 style={{ fontWeight: 900, color: '#fff' }}>PMPL Order Receipt</h3>
              </div>
              
              <div style={{ 
                border: '1.5px dashed rgba(255, 255, 255, 0.12)', 
                borderRadius: '20px', 
                padding: '24px', 
                background: 'rgba(0, 0, 0, 0.15)' 
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>{formData.source}</div>
                    <ArrowRight size={18} color="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }} />
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>{formData.destination}</div>
                 </div>
                 
                 <div style={{ display: 'grid', gap: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Adults</span>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{formData.adults}</span>
                    </div>
                    {formData.children > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Children</span>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{formData.children}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Ticket Type</span>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{currentRoute.name}</span>
                    </div>
                 </div>
                 
                 <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1.5px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Total To Pay</span>
                    <span style={{ fontWeight: 950, fontSize: '1.9rem', color: '#38bdf8', textShadow: '0 0 15px rgba(56, 189, 248, 0.3)' }}>₹{totalFare}</span>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '36px' }}>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   style={{
                     flex: 1,
                     height: '56px',
                     background: 'rgba(255, 255, 255, 0.04)',
                     border: '1px solid rgba(255, 255, 255, 0.08)',
                     borderRadius: '14px',
                     color: '#fff',
                     fontWeight: 800,
                     cursor: 'pointer'
                   }}
                   onClick={() => setStep(2)}
                 >
                   Modify
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(16, 185, 129, 0.4)' }}
                   whileTap={{ scale: 0.98 }}
                   style={{
                     flex: 2,
                     height: '56px',
                     background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                     color: '#fff',
                     border: 'none',
                     borderRadius: '14px',
                     fontWeight: 800,
                     fontSize: '0.95rem',
                     cursor: 'pointer',
                     boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)'
                   }}
                   onClick={handleBook}
                 >
                   Pay & Generate Pass
                 </motion.button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="s4" 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 25px rgba(16, 185, 129, 0.08)',
                color: '#fff',
                textAlign: 'center',
                padding: '50px 36px',
                borderRadius: '24px'
              }}
            >
              <div style={{ 
                width: '72px', 
                height: '72px', 
                background: 'rgba(16, 185, 129, 0.12)', 
                borderRadius: '50%', 
                color: '#10b981', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
              }}>
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ marginBottom: '12px', fontWeight: 900, color: '#fff' }}>Digital Pass Ready</h2>
              <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Your PMPL pass has been generated. Show the QR at the bus sensor for instant boarding.
              </p>
              
              <div style={{ 
                padding: '20px', 
                background: 'rgba(0, 0, 0, 0.25)', 
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '20px', 
                marginBottom: '32px' 
              }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>PMPL Ticket ID</div>
                 <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#38bdf8', letterSpacing: '4px', fontFamily: 'monospace', textShadow: '0 0 8px rgba(56, 189, 248, 0.25)' }}>
                   PMPL-{Math.random().toString(36).substr(2, 4).toUpperCase()}
                 </div>
              </div>

              <Link href="/tickets" className="btn btn-primary" style={{ 
                width: '100%', 
                height: '56px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}>
                View Ticket Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default BookingPage
