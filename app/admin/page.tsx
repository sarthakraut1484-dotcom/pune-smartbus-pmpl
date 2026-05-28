'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Users, Ticket, Activity, LogOut, RefreshCw,
  CheckCircle2, XCircle, Clock, MapPin, ArrowRight, AlertTriangle,
  TrendingUp, Bus, CreditCard, Eye, Trash2, Lock, QrCode, Calendar
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { ref, onValue, update, remove, push } from 'firebase/database'

/* ─── Admin Gate ─── */
const ADMIN_EMAIL = 'admin@0861'
const ADMIN_PASSWORD = 'admin@0861'

const PMPL_STOPS = [
  'Akurdi',
  'Aundh Gaon',
  'Baner High Street',
  'Bibwewadi',
  'Chinchwad Station',
  'Dhankawadi',
  'Fatima Nagar',
  'Hadapsar Gadital',
  'Hinjewadi Phase 3',
  'Katraj Depo',
  'Kothrud Stand',
  'Laxmi Narayan Theatre',
  'Magarpatta City',
  'Nigdi Bhakti-Shakti',
  'Padmavati',
  'Pimpri Chowk',
  'Pulgate',
  'Pune Railway Station',
  'Race Course',
  'Shivaji Nagar',
  'Swargate Hub',
  'Viman Nagar',
  'Wagholi',
  'Warje Malwadi',
  'Yerwada'
]

const PMPL_ROUTES: Record<string, string[]> = {
  'ALL': PMPL_STOPS,
  '24A': [
    'Swargate Hub',
    'Laxmi Narayan Theatre',
    'Padmavati',
    'Bibwewadi',
    'Dhankawadi',
    'Katraj Depo'
  ],
  '42': [
    'Swargate Hub',
    'Shivaji Nagar',
    'Pimpri Chowk',
    'Chinchwad Station',
    'Akurdi',
    'Nigdi Bhakti-Shakti'
  ],
  '43': [
    'Katraj Depo',
    'Dhankawadi',
    'Swargate Hub',
    'Shivaji Nagar',
    'Pimpri Chowk',
    'Nigdi Bhakti-Shakti'
  ],
  '100': [
    'Pune Railway Station',
    'Yerwada',
    'Aundh Gaon',
    'Baner High Street',
    'Hinjewadi Phase 3'
  ],
  '115': [
    'Kothrud Stand',
    'Warje Malwadi',
    'Shivaji Nagar',
    'Pune Railway Station'
  ],
  '204': [
    'Hadapsar Gadital',
    'Magarpatta City',
    'Viman Nagar',
    'Wagholi'
  ],
  '207': [
    'Swargate Hub',
    'Pulgate',
    'Race Course',
    'Fatima Nagar',
    'Hadapsar Gadital'
  ],
  'RATRANI 6': [
    'Pune Railway Station',
    'Swargate Hub',
    'Dhankawadi',
    'Katraj Depo'
  ]
}

const parseLog = (logStr: string) => {
  const timeRegex = /^\[(\d{2}:\d{2}:\d{2}\s?(?:AM|PM))\]\s*(.*)/i
  const match = logStr.match(timeRegex)
  
  let time = ''
  let content = logStr
  
  if (match) {
    time = match[1]
    content = match[2]
  } else {
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  
  let type = 'info'
  let icon = 'ℹ️'
  let title = 'System Log'
  let bg = 'rgba(56, 189, 248, 0.05)'
  let border = 'rgba(56, 189, 248, 0.12)'
  let color = '#38bdf8'
  
  const text = content.trim()
  
  if (text.startsWith('✅')) {
    type = 'success'
    icon = '✅'
    title = 'TICKET APPROVED'
    bg = 'rgba(16, 185, 129, 0.08)'
    border = 'rgba(16, 185, 129, 0.2)'
    color = '#10b981'
    content = text.substring(2)
  } else if (text.startsWith('⚠️')) {
    type = 'warning'
    icon = '⚠️'
    title = text.includes('Reattempt') ? 'ALREADY USED (REATTEMPT)' : 'SECURITY WARNING'
    bg = 'rgba(245, 158, 11, 0.08)'
    border = 'rgba(245, 158, 11, 0.2)'
    color = '#f59e0b'
    content = text.substring(2)
  } else if (text.startsWith('🚫') || text.startsWith('❌')) {
    type = 'error'
    icon = text.startsWith('🚫') ? '🚫' : '❌'
    title = text.startsWith('🚫') ? 'EXPIRED TICKET' : 'INVALID PASS'
    bg = 'rgba(239, 68, 68, 0.08)'
    border = 'rgba(239, 68, 68, 0.2)'
    color = '#ef4444'
    content = text.substring(2)
  } else if (text.startsWith('🟢')) {
    type = 'success'
    icon = '🟢'
    title = 'PASSENGER ENTERED'
    bg = 'rgba(16, 185, 129, 0.05)'
    border = 'rgba(16, 185, 129, 0.15)'
    color = '#10b981'
    content = text.substring(2)
  } else if (text.startsWith('🔴')) {
    type = 'error'
    icon = '🔴'
    title = 'PASSENGER EXITED'
    bg = 'rgba(239, 68, 68, 0.05)'
    border = 'rgba(239, 68, 68, 0.15)'
    color = '#ef4444'
    content = text.substring(2)
  } else if (text.startsWith('📡') || text.startsWith('✏️')) {
    type = 'info'
    icon = text.startsWith('📡') ? '📡' : '✏️'
    title = text.startsWith('📡') ? 'ESP32 CAMERA SCAN' : 'MANUAL override'
    bg = 'rgba(129, 140, 248, 0.06)'
    border = 'rgba(129, 140, 248, 0.15)'
    color = '#818cf8'
    content = text.substring(2)
  } else if (text.startsWith('[System]')) {
    type = 'info'
    icon = '🤖'
    title = 'SYSTEM STATE'
    bg = 'rgba(56, 189, 248, 0.05)'
    border = 'rgba(56, 189, 248, 0.1)'
    color = '#38bdf8'
    content = text.substring(8)
  }
  
  return { time, title, content, bg, border, color, icon }
}

export default function AdminPage() {
  const router = useRouter()

  /* ── Auth state ── */
  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  /* ── Login form (shown when not authenticated as admin) ── */
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [setupMsg, setSetupMsg] = useState('')

  /* ── Dashboard data ── */
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'used'>('active')
  const [tab, setTab] = useState<'stats' | 'tickets' | 'scanner' | 'history'>('stats')
  const [tripHistory, setTripHistory] = useState<any[]>([])
  const [activeBusRoute, setActiveBusRoute] = useState<string>('ALL')
  const [activeStop, setActiveStop] = useState<string>('Akurdi')
  const [stopTelemetry, setStopTelemetry] = useState<Record<string, { entries: number; exits: number; scans: number }>>({})
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)

  /* ── Live Firebase telemetry (IR Sensors) ── */
  const [telemetry, setTelemetry] = useState({
    entered: 0,
    exited: 0,
    inside: 0,
    capacity: 40,
    remaining: 40,
    invalidScans: 0
  })

  const [scanResult, setScanResult] = useState<any | null>(null)
  const [scannerActive, setScannerActive] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [logs, setLogs] = useState<string[]>([
    '[System] Telemetry control unit initialized.',
    '[System] Listening to physical ESP32 Camera scans...'
  ])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 24)])
  }

  const [modal, setModal] = useState<{
    show: boolean;
    type: 'confirm' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    type: 'confirm',
    title: '',
    message: ''
  })

  /* ── Auth guard ── */
  useEffect(() => {
    const localIsAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true'
    setIsAdmin(localIsAdmin)
    setAuthLoading(false)
  }, [])

  /* ── Live Firebase tickets ── */
  useEffect(() => {
    if (!isAdmin) return
    const ticketsRef = ref(db, 'tickets')
    const unsub = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.values(data) as any[]
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setTickets(list)
    })
    return () => unsub()
  }, [isAdmin])

  /* ── Live Firebase trip history ── */
  useEffect(() => {
    if (!isAdmin) return
    const historyRef = ref(db, 'trip_history')
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.entries(data).map(([key, val]: any) => ({
        id: key,
        ...val
      }))
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setTripHistory(list)
    })
    return () => unsub()
  }, [isAdmin])

  /* ── Live Firebase active stop & stop telemetry ── */
  useEffect(() => {
    if (!isAdmin) return
    
    const activeStopRef = ref(db, 'stats/active_stop')
    const activeUnsub = onValue(activeStopRef, (snapshot) => {
      const val = snapshot.val()
      if (val) setActiveStop(val)
    })

    const activeRouteRef = ref(db, 'stats/active_bus_route')
    const routeUnsub = onValue(activeRouteRef, (snapshot) => {
      const val = snapshot.val()
      if (val) setActiveBusRoute(val)
    })

    const stopTelemetryRef = ref(db, 'stats/stop_telemetry')
    const telemetryUnsub = onValue(stopTelemetryRef, (snapshot) => {
      const val = snapshot.val() || {}
      setStopTelemetry(val)
    })

    return () => {
      activeUnsub()
      routeUnsub()
      telemetryUnsub()
    }
  }, [isAdmin])

  /* ── Live Firebase telemetry (IR Sensors) & Log Generation ── */
  const prevTelemetry = useRef({ entered: 0, exited: 0, invalidScans: 0 })
  const isFirstTelemetry = useRef(true)
  useEffect(() => {
    if (!isAdmin) return
    const statsRef = ref(db, 'stats')
    const unsub = onValue(statsRef, (snapshot) => {
      const val = snapshot.val() || {}
      const entered = val.total_entries || 0
      const exited = val.total_exits || 0
      const inside = val.current_occupancy !== undefined ? val.current_occupancy : Math.max(0, entered - exited)
      const capacity = val.capacity || 40
      const remaining = Math.max(0, capacity - inside)
      const invalidScans = val.invalid_scans || 0
      
      setTelemetry({ entered, exited, inside, capacity, remaining, invalidScans })

      if (isFirstTelemetry.current) {
        isFirstTelemetry.current = false
        prevTelemetry.current = { entered, exited, invalidScans }
        return
      }

      // Cache old values and update ref immediately to break synchronous Firebase write recursion
      const oldEntered = prevTelemetry.current.entered
      const oldExited = prevTelemetry.current.exited
      const oldInvalid = prevTelemetry.current.invalidScans
      
      prevTelemetry.current = { entered, exited, invalidScans }

      // Generate dynamic logs based on changes
      if (oldEntered !== entered && entered > 0) {
        addLog(`🟢 Passenger entered at turnstile. (Inside: ${inside})`)
        
        // Dynamically increment stop-specific boarding entries
        const currentStop = val.active_stop || 'Katraj Depo'
        const stopEntries = (val.stop_telemetry && val.stop_telemetry[currentStop]?.entries) || 0
        const diff = entered - oldEntered
        if (diff > 0) {
          update(ref(db, `stats/stop_telemetry/${currentStop}`), {
            entries: stopEntries + diff
          })
        }
      }
      if (oldExited !== exited && exited > 0) {
        addLog(`🔴 Passenger exited at turnstile. (Inside: ${inside})`)
        
        // Dynamically increment stop-specific exits
        const currentStop = val.active_stop || 'Katraj Depo'
        const stopExits = (val.stop_telemetry && val.stop_telemetry[currentStop]?.exits) || 0
        const diff = exited - oldExited
        if (diff > 0) {
          update(ref(db, `stats/stop_telemetry/${currentStop}`), {
            exits: stopExits + diff
          })
        }
      }
      if (oldInvalid !== invalidScans && invalidScans > 0) {
        addLog(`⚠️ Invalid ticket scan registered!`)
      }
    })
    return () => unsub()
  }, [isAdmin])

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setSetupMsg('')
    setLoginLoading(true)
    
    // Simulate natural response latency for premium feel
    setTimeout(() => {
      if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminAuthenticated', 'true')
        setIsAdmin(true)
      } else {
        setLoginError('Invalid admin email or password.')
      }
      setLoginLoading(false)
    }, 800)
  }

  const handleMarkUsed = async (ticketId: string) => {
    await update(ref(db, `tickets/${ticketId}`), { status: 'used' })
  }

  const handleMarkExpired = async (ticketId: string) => {
    await update(ref(db, `tickets/${ticketId}`), { status: 'expired' })
  }

  const handleDelete = async (ticketId: string) => {
    await remove(ref(db, `tickets/${ticketId}`))
    if (selectedTicket?.id === ticketId) setSelectedTicket(null)
  }

  const handleDeleteExpired = async () => {
    const expiredTickets = tickets.filter(t => t.status === 'expired')
    if (expiredTickets.length === 0) return
    
    setModal({
      show: true,
      type: 'confirm',
      title: 'Purge Expired Tickets?',
      message: `Are you sure you want to permanently delete all ${expiredTickets.length} expired tickets from the database? This action is irreversible.`,
      onConfirm: async () => {
        setModal(prev => ({ ...prev, show: false }))
        try {
          for (const t of expiredTickets) {
            await remove(ref(db, `tickets/${t.id}`))
          }
          playSound('success')
          setModal({
            show: true,
            type: 'success',
            title: 'Purge Successful',
            message: `Permanently removed ${expiredTickets.length} expired tickets from the database.`
          })
        } catch (e: any) {
          playSound('error')
          setModal({
            show: true,
            type: 'error',
            title: 'Purge Failed',
            message: e.message
          })
        }
      }
    })
  }

  const handleDeleteTrip = async (tripId: string) => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Delete Trip Log?',
      message: 'Are you sure you want to permanently delete this trip log from history? This action is irreversible.',
      onConfirm: async () => {
        setModal(prev => ({ ...prev, show: false }))
        try {
          await remove(ref(db, `trip_history/${tripId}`))
          playSound('success')
          setModal({
            show: true,
            type: 'success',
            title: 'Trip Deleted',
            message: 'The selected trip log has been removed from history.'
          })
        } catch (e: any) {
          playSound('error')
          setModal({
            show: true,
            type: 'error',
            title: 'Deletion Failed',
            message: e.message
          })
        }
      }
    })
  }

  const handleClearHistory = async () => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Clear Trip History?',
      message: 'Are you sure you want to permanently delete all trip logs from history? This action cannot be undone.',
      onConfirm: async () => {
        setModal(prev => ({ ...prev, show: false }))
        try {
          await remove(ref(db, 'trip_history'))
          playSound('success')
          setModal({
            show: true,
            type: 'success',
            title: 'History Cleared',
            message: 'All past trip logs have been cleared successfully.'
          })
        } catch (e: any) {
          playSound('error')
          setModal({
            show: true,
            type: 'error',
            title: 'Clear Failed',
            message: e.message
          })
        }
      }
    })
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated')
    setIsAdmin(false)
  }

  const handleStopChange = async (stopName: string) => {
    setActiveStop(stopName)
    await update(ref(db, 'stats'), { active_stop: stopName })
    addLog(`📍 Bus arrived at stop: ${stopName}`)
  }

  const handleBusRouteChange = async (routeId: string) => {
    setActiveBusRoute(routeId)
    const firstStop = PMPL_ROUTES[routeId][0]
    setActiveStop(firstStop)
    await update(ref(db, 'stats'), {
      active_bus_route: routeId,
      active_stop: firstStop
    })
    addLog(`🚌 Active Bus Route set to Route ${routeId}. Start Stop: ${firstStop}`)
  }

  const triggerEndTripConfirm = () => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'End Current Trip?',
      message: 'Are you sure you want to end the current trip? This will reset all IR sensors, passenger counts, and scanner logs in real-time.',
      onConfirm: executeEndTrip
    })
  }

  const executeEndTrip = async () => {
    setModal(prev => ({ ...prev, show: false }))
    try {
      // Save current details to history path
      const tripData = {
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        busRoute: activeBusRoute,
        entered: telemetry.entered,
        exited: telemetry.exited,
        inside: telemetry.inside,
        invalidScans: telemetry.invalidScans,
        revenue: revenue,
        totalTickets: total,
        activeTickets: active,
        usedTickets: used,
        expiredTickets: expired,
        stopTelemetry: stopTelemetry
      }
      await push(ref(db, 'trip_history'), tripData)

      // Wipe current tickets database path for clean trip-wise allotment
      await remove(ref(db, 'tickets'))

      await update(ref(db, 'stats'), {
        current_occupancy: 0,
        total_entries: 0,
        total_exits: 0,
        invalid_scans: 0,
        active_bus_route: 'ALL',
        active_stop: 'Akurdi'
      })
      await remove(ref(db, 'stats/stop_telemetry'))

      await update(ref(db, 'system/last_validation'), {
        qr: 'None'
      })
      playSound('success')
      setModal({
        show: true,
        type: 'success',
        title: 'Trip Reset Successful',
        message: 'Current trip details have been stored in history, and telemetry sensors recalibrated to 0.'
      })
    } catch (e: any) {
      playSound('error')
      setModal({
        show: true,
        type: 'error',
        title: 'Reset Failed',
        message: 'Could not communicate with the database: ' + e.message
      })
    }
  }

  // Web Audio Context Synthesizer (Success/Warning/Error)
  const playSound = (type: 'success' | 'warning' | 'error') => {
    if (typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (type === 'success') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      } else if (type === 'warning') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(293.66, ctx.currentTime) // D4
        osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.15)
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(120, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3)
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Cross-check ticket logic
  const verifyTicket = async (scannedValue: string) => {
    const value = scannedValue.trim().toUpperCase()
    const matched = tickets.find(t => {
      const ticketId = (t.id || '').toUpperCase()
      const matchesId = ticketId === value || ticketId.includes(value) || value.includes(ticketId)
      
      const matchesPasscode = t.qrCodes && t.qrCodes.some((code: string) => {
        const c = code.toUpperCase()
        return c === value || c.includes(value) || value.includes(c)
      })
      
      return matchesId || matchesPasscode
    })
    
    if (matched) {
      // Dynamic Expiration Check
      const now = Date.now()
      const isPastExpiration = matched.expiresAt && now > matched.expiresAt

      if (matched.status === 'expired' || isPastExpiration) {
        if (matched.status !== 'expired') {
          await update(ref(db, `tickets/${matched.id}`), { status: 'expired' })
          matched.status = 'expired'
        }
        playSound('error')
        addLog(`🚫 Expired Ticket Scan: Pass ${matched.id} is EXPIRED`)
        setScanResult({
          status: 'error',
          ticket: matched,
          message: 'Expired! This ticket has expired.'
        })
      } else if (matched.status === 'active') {
        playSound('success')
        addLog(`✅ Ticket Successfully Scanned: Pass ${matched.id} (${matched.source} → ${matched.destination})`)
        
        // Increment stop-specific scans in Firebase
        const currentStopTelemetry = stopTelemetry[activeStop] || { entries: 0, exits: 0, scans: 0 }
        await update(ref(db, `stats/stop_telemetry/${activeStop}`), {
          scans: (currentStopTelemetry.scans || 0) + 1
        })

        if (matched.routeName === 'Daily Pass (Unlimited)') {
          addLog(`📡 Daily Pass Verified: Code stays active for unlimited rides today!`)
          setScanResult({
            status: 'success',
            ticket: matched,
            message: 'Daily Pass Approved! Unlimited rides active.'
          })
        } else {
          await update(ref(db, `tickets/${matched.id}`), { status: 'used' })
          setScanResult({
            status: 'success',
            ticket: matched,
            message: 'Ticket Verified! Boarding approved.'
          })
        }
        await update(ref(db, 'system/last_validation'), { qr: matched.id })
      } else if (matched.status === 'used') {
        playSound('warning')
        addLog(`⚠️ Scan Reattempt: Pass ${matched.id} is already marked as USED`)
        setScanResult({
          status: 'warning',
          ticket: matched,
          message: 'Already Used! This ticket has already boarded.'
        })
      }
    } else {
      playSound('error')
      addLog(`❌ Invalid Scan Attempt: No matching ticket found for "${value}"`)
      setScanResult({
        status: 'invalid',
        ticketId: value,
        message: 'Invalid Pass! No matching ticket found.'
      })
      const currentInvalid = telemetry.invalidScans
      await update(ref(db, 'stats'), { invalid_scans: currentInvalid + 1 })
    }
  }

  // Initialize browser webcam scanner inside the right-hand scan panel
  useEffect(() => {
    if (tab !== 'scanner' || !isAdmin || scanResult) {
      setScannerActive(false)
      return
    }

    let scanner: any = null
    
    import('html5-qrcode').then((module) => {
      const Html5QrcodeScanner = module.Html5QrcodeScanner
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      }, false)

      scanner.render((decodedText: string) => {
        verifyTicket(decodedText.trim())
      }, (error: any) => {
        // Ignored failures
      })
      
      setScannerActive(true)
    }).catch(err => {
      console.error('Failed to load html5-qrcode', err)
    })

    return () => {
      if (scanner) {
        scanner.clear().catch((e: any) => console.error(e))
      }
    }
  }, [tab, isAdmin, scanResult, tickets])

  /* ── Listen to Hardware Python QR scans ── */
  const lastHandledTimeRef = useRef<number>(0)
  useEffect(() => {
    if (!isAdmin) return
    const validationRef = ref(db, 'system/last_validation')
    const unsub = onValue(validationRef, (snapshot) => {
      const val = snapshot.val()
      if (val && val.qr && val.qr !== 'None') {
        const timestamp = Number(val.timestamp) || 0
        if (timestamp > lastHandledTimeRef.current) {
          lastHandledTimeRef.current = timestamp
          addLog(`📡 Scanned QR received from ESP32 Camera: "${val.qr}"`)
          verifyTicket(val.qr)
        }
      }
    })
    return () => unsub()
  }, [isAdmin, tickets])

  /* ── Derived stats ── */
  const total = tickets.length
  const active = tickets.filter(t => t.status === 'active').length
  const used = tickets.filter(t => t.status === 'used').length
  const expired = tickets.filter(t => t.status === 'expired').length
  const revenue = tickets.reduce((sum, t) => {
    const fare = parseInt((t.totalFare || '₹0').replace(/[^0-9]/g, '')) || 0
    return sum + fare
  }, 0)

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  /* ── Status badge ── */
  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      active:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Active' },
      used:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Used' },
      expired: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Expired' },
    }
    const s = map[status] || { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: status }
    return (
      <span style={{
        background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
        padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800
      }}>
        {s.label}
      </span>
    )
  }

  /* ════════════════════════════════════════════
     LOADING
  ════════════════════════════════════════════ */
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%' }}
        />
      </div>
    )
  }

  /* ════════════════════════════════════════════
     ADMIN LOGIN SCREEN
  ════════════════════════════════════════════ */
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b0f1a 0%, #0f172a 50%, #0b0f1a 100%)',
        padding: '2rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          style={{
            width: '100%', maxWidth: '420px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 60px rgba(56,189,248,0.04)'
          }}
        >
          {/* Shield Icon */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Lock size={28} color="#38bdf8" strokeWidth={2.2} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              Admin Access
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              SmartBus · PMPL Control Panel
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                  display: 'flex', gap: '10px', alignItems: 'center'
                }}
              >
                <AlertTriangle size={16} color="#ef4444" />
                <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700 }}>{loginError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              placeholder="Admin Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
              style={{
                height: '48px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '0 16px', color: '#fff', fontSize: '0.9rem', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
              style={{
                height: '48px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '0 16px', color: '#fff', fontSize: '0.9rem', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={loginLoading}
              style={{
                height: '50px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#fff', border: 'none', borderRadius: '13px', fontWeight: 800,
                fontSize: '0.92rem', cursor: loginLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loginLoading ? 0.7 : 1, fontFamily: 'inherit'
              }}
            >
              {loginLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                />
              ) : (
                <><ShieldCheck size={18} /> Access Dashboard</>
              )}
            </motion.button>
          </form>

          {/* ── Admin Credentials Tip ── */}
          <div style={{ marginTop: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '4px', textAlign: 'center' }}>
              ℹ️ Admin Credentials
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>
              Use <code style={{ color: '#fff', background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px' }}>admin@0861</code> for both email & password.
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ════════════════════════════════════════════
     ADMIN DASHBOARD
  ════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#fff', fontFamily: 'inherit' }}>
      <style>{`
        @media (max-width: 1024px) {
          .responsive-grid-scanner {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .responsive-grid-tickets {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .responsive-padding {
            padding: 16px !important;
          }
          .tab-bar-scrollable {
            overflow-x: auto !important;
            padding-bottom: 6px !important;
            white-space: nowrap;
            display: flex !important;
            width: 100%;
          }
          .tab-bar-scrollable button {
            flex-shrink: 0 !important;
          }
          .telemetry-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .stop-audit-cards {
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important;
          }
        }
        @media (max-width: 480px) {
          .telemetry-grid {
            grid-template-columns: 1fr !important;
          }
          .responsive-grid-scanner {
            padding: 16px !important;
          }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{
        background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bus size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>SmartBus Admin</div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>PMPL Control Panel</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
            padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            {ADMIN_EMAIL}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
              color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit'
            }}
          >
            <LogOut size={14} /> Logout
          </motion.button>
        </div>
      </div>

      <div className="responsive-padding" style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Tickets', value: total, icon: <Ticket size={20} />, color: '#38bdf8' },
            { label: 'Active',        value: active, icon: <CheckCircle2 size={20} />, color: '#10b981' },
            { label: 'Used',          value: used,   icon: <Activity size={20} />, color: '#f59e0b' },
            { label: 'Expired',       value: expired, icon: <XCircle size={20} />, color: '#ef4444' },
            { label: 'Revenue',       value: `₹${revenue}`, icon: <CreditCard size={20} />, color: '#818cf8' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '20px 22px',
                boxShadow: `0 0 30px ${card.color}10`
              }}
            >
              <div style={{ color: card.color, marginBottom: '10px' }}>{card.icon}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                {card.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Live Hardware Telemetry Dashboard ── */}
        <div style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '24px',
          padding: '28px 32px',
          marginBottom: '32px',
          boxShadow: '0 20px 50px -15px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Top Row: Title, Stop Selector & Reset Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.3px' }}>📡 Live Hardware Telemetry</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Real-time passenger flow triggers from physical IR sensors.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Active Bus Route Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚌 Bus Route No.</label>
                <select
                  value={activeBusRoute}
                  onChange={(e) => handleBusRouteChange(e.target.value)}
                  style={{
                    height: '38px', background: '#0b0f19', color: '#fff',
                    border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px',
                    padding: '0 12px', fontSize: '0.78rem', fontWeight: 800, outline: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.05)'
                  }}
                >
                  {Object.keys(PMPL_ROUTES).map(r => (
                    <option key={r} value={r}>
                      {r === 'ALL' ? 'All Stops / Routes' : `PMPL Route ${r}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Stop Selection Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 Current Bus Stop</label>
                <select
                  value={activeStop}
                  onChange={(e) => handleStopChange(e.target.value)}
                  style={{
                    height: '38px', background: '#0b0f19', color: '#fff',
                    border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px',
                    padding: '0 12px', fontSize: '0.78rem', fontWeight: 800, outline: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.05)'
                  }}
                >
                  {PMPL_ROUTES[activeBusRoute].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={triggerEndTripConfirm}
                style={{
                  height: '46px', padding: '0 24px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)',
                  fontFamily: 'inherit'
                }}
              >
                🏁 End Trip & Reset Sensors
              </motion.button>
            </div>
          </div>

          {/* Bottom Row: Telemetry Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            
            {/* Passengers Entered */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>PASSENGERS ENTERED</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', letterSpacing: '-1px' }}>{telemetry.entered}</div>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700, marginTop: '4px' }}>IR SENSOR 1 ACTIVE</div>
            </div>

            {/* Passengers Exited */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>PASSENGERS EXITED</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-1px' }}>{telemetry.exited}</div>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700, marginTop: '4px' }}>IR SENSOR 2 ACTIVE</div>
            </div>

            {/* Passengers Inside Bus */}
            <div style={{ background: 'rgba(56,189,248,0.02)', border: '1px solid rgba(56,189,248,0.15)', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>PASSENGERS INSIDE BUS</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-1px' }}>{Math.max(0, telemetry.entered - telemetry.exited)}</div>
              <div style={{ fontSize: '0.65rem', color: '#0369a1', fontWeight: 700, marginTop: '4px' }}>NET COUNT (IN - OUT)</div>
            </div>

            {/* Seats Remaining */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>SEATS REMAINING</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: telemetry.remaining === 0 ? '#ef4444' : '#10b981', letterSpacing: '-0.5px' }}>
                {telemetry.remaining} <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 700 }}>/ {telemetry.capacity}</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: telemetry.remaining === 0 ? '#ef4444' : '#10b981', fontWeight: 700, marginTop: '4px' }}>
                {telemetry.remaining === 0 ? '🚫 BUS FULL' : '🟢 SEATS AVAILABLE'}
              </div>
            </div>

            {/* Invalid Scans */}
            <div style={{ 
              background: telemetry.invalidScans > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)', 
              border: telemetry.invalidScans > 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.05)', 
              padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' 
            }}>
              <div style={{ fontSize: '0.7rem', color: telemetry.invalidScans > 0 ? '#ef4444' : '#64748b', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>INVALID SCANS</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: telemetry.invalidScans > 0 ? '#ef4444' : '#fff', letterSpacing: '-1px' }}>{telemetry.invalidScans}</div>
              <div style={{ fontSize: '0.65rem', color: telemetry.invalidScans > 0 ? '#ef4444' : '#475569', fontWeight: 700, marginTop: '4px' }}>
                {telemetry.invalidScans > 0 ? '⚠️ ATTENTION REQUIRED' : '🛡️ SYSTEM SECURE'}
              </div>
            </div>

          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar-scrollable" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['stats', 'scanner', 'tickets', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem',
              cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              background: tab === t ? '#2563eb' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}>
              {t === 'tickets' ? '🎫 All Tickets' : t === 'stats' ? '📊 Stats' : t === 'scanner' ? '📷 Scan QR' : '📜 Trip History'}
            </button>
          ))}
        </div>

        {tab === 'tickets' && (
          <div className="responsive-grid-tickets" style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 380px' : '1fr', gap: '20px' }}>

            {/* ── Ticket List ── */}
            <div>
              {/* Filter pills & Purge Control */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['all', 'active', 'used', 'expired'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '5px 16px', borderRadius: '999px', fontWeight: 800, fontSize: '0.75rem',
                      cursor: 'pointer', fontFamily: 'inherit',
                      border: filter === f ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      background: filter === f ? 'rgba(56,189,248,0.12)' : 'transparent',
                      color: filter === f ? '#38bdf8' : '#64748b',
                      textTransform: 'capitalize'
                    }}>
                      {f === 'all' ? `All (${total})` : f === 'active' ? `Active (${active})` : f === 'used' ? `Used (${used})` : `Expired (${expired})`}
                    </button>
                  ))}
                </div>

                {expired > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteExpired}
                    style={{
                      padding: '6px 16px', borderRadius: '999px', fontWeight: 800, fontSize: '0.75rem',
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Trash2 size={13} /> Purge Expired ({expired})
                  </motion.button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div style={{
                  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#475569'
                }}>
                  <Ticket size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontWeight: 700 }}>No tickets found</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filtered.map((ticket, i) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                      style={{
                        background: selectedTicket?.id === ticket.id
                          ? 'rgba(37,99,235,0.12)'
                          : 'rgba(15,23,42,0.8)',
                        border: selectedTicket?.id === ticket.id
                          ? '1.5px solid rgba(37,99,235,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '16px 20px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                          background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Ticket size={18} color="#38bdf8" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
                            {ticket.id}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={11} />
                            {ticket.source || '—'} → {ticket.destination || '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: '#38bdf8', fontSize: '0.9rem' }}>{ticket.totalFare}</div>
                          <div style={{ fontSize: '0.7rem', color: '#475569' }}>{ticket.date}</div>
                        </div>
                        {statusBadge(ticket.status)}
                        <ArrowRight size={14} color="#475569" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Detail Panel ── */}
            <AnimatePresence>
              {selectedTicket && (
                <motion.div
                  key={selectedTicket.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(56,189,248,0.15)',
                    borderRadius: '20px', padding: '24px', height: 'fit-content',
                    position: 'sticky', top: '80px'
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Ticket Detail
                    <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                      <XCircle size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '12px', fontSize: '0.82rem' }}>
                    {[
                      ['ID', selectedTicket.id],
                      ['Route', `${selectedTicket.source} → ${selectedTicket.destination}`],
                      ['Type', selectedTicket.routeName],
                      ['Passengers', selectedTicket.details],
                      ['Fare', selectedTicket.totalFare],
                      ['Date', `${selectedTicket.date} ${selectedTicket.time}`],
                      ['Status', selectedTicket.status],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>{label}</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 800, textAlign: 'right', maxWidth: '180px' }}>
                          {label === 'Status' ? statusBadge(value as string) : value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {selectedTicket.status === 'active' && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleMarkUsed(selectedTicket.id)}
                        style={{
                          padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                          cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                          background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                        <Activity size={15} /> Mark as Used
                      </motion.button>
                    )}
                    {selectedTicket.status !== 'expired' && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleMarkExpired(selectedTicket.id)}
                        style={{
                          padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                          cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                          background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                        <XCircle size={15} /> Mark as Expired
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleDelete(selectedTicket.id)}
                      style={{
                        padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                        cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(239,68,68,0.15)',
                        background: 'transparent', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}>
                      <Trash2 size={15} /> Delete Ticket
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Stats Tab ── */}
        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {/* Route breakdown */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
              <div style={{ fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#38bdf8" /> Top Routes
              </div>
              {(() => {
                const routeCounts: Record<string, number> = {}
                tickets.forEach(t => {
                  const route = `${t.source || '?'} → ${t.destination || '?'}`
                  routeCounts[route] = (routeCounts[route] || 0) + 1
                })
                const sorted = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
                return sorted.length === 0
                  ? <div style={{ color: '#475569', fontSize: '0.82rem' }}>No routes yet</div>
                  : sorted.map(([route, count]) => (
                    <div key={route} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                        <span style={{ color: '#94a3b8' }}>{route}</span>
                        <span style={{ color: '#38bdf8' }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: '4px', width: `${(count / (sorted[0]?.[1] || 1)) * 100}%`, background: 'linear-gradient(90deg, #38bdf8, #2563eb)' }} />
                      </div>
                    </div>
                  ))
              })()}
            </div>

            {/* Ticket type breakdown */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
              <div style={{ fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={18} color="#818cf8" /> Ticket Types
              </div>
              {(() => {
                const typeCounts: Record<string, number> = {}
                tickets.forEach(t => { typeCounts[t.routeName || 'Unknown'] = (typeCounts[t.routeName || 'Unknown'] || 0) + 1 })
                return Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>{type}</span>
                    <span style={{ color: '#818cf8', fontWeight: 900 }}>{count}</span>
                  </div>
                ))
              })()}
            </div>

            {/* Revenue summary */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
              <div style={{ fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#10b981" /> Revenue Summary
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#10b981', letterSpacing: '-2px', marginBottom: '8px' }}>
                ₹{revenue}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Total collected across {total} tickets</div>
              <div style={{ marginTop: '20px', display: 'grid', gap: '8px' }}>
                {[
                  { label: 'Active Tickets Value', value: tickets.filter(t => t.status === 'active').reduce((s, t) => s + (parseInt((t.totalFare || '0').replace(/\D/g, '')) || 0), 0) },
                  { label: 'Used Tickets Value',   value: tickets.filter(t => t.status === 'used').reduce((s, t) => s + (parseInt((t.totalFare || '0').replace(/\D/g, '')) || 0), 0) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>₹{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stop Boarding & Fare Evasion Audit */}
            <div style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(56,189,248,0.15)',
              borderRadius: '24px',
              padding: '28px 32px',
              gridColumn: '1 / -1',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              marginTop: '12px'
            }}>
              {/* Header section with Dynamic Evasion badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 950, color: '#fff', fontSize: '1.25rem', margin: 0, letterSpacing: '-0.3px' }}>
                    📍 Stop-Wise Boarding & Fare Evasion Audit
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: '4px 0 0' }}>
                    Compulsory ticketing diagnostics per stop. Compares boardings (IR entry count) against actual scanned valid tickets to highlight unbooked riders.
                  </p>
                </div>
                
                {/* Evasion Alert Badge */}
                {(() => {
                  const activeStops = PMPL_ROUTES[activeBusRoute] || []
                  const totalEntriesVal = activeStops.reduce((s, stop) => s + ((stopTelemetry[stop] && stopTelemetry[stop].entries) || 0), 0)
                  const totalScansVal = activeStops.reduce((s, stop) => s + ((stopTelemetry[stop] && stopTelemetry[stop].scans) || 0), 0)
                  const evasionRate = totalEntriesVal ? Math.round((Math.max(0, totalEntriesVal - totalScansVal) / totalEntriesVal) * 100) : 0
                  
                  return totalEntriesVal > 0 && evasionRate > 0 ? (
                    <div style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      padding: '6px 14px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, color: '#ef4444',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <AlertTriangle size={14} /> Overall Evasion Rate: {evasionRate}%
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                      padding: '6px 14px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, color: '#10b981',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <CheckCircle2 size={14} /> System Secure (0% Evasion)
                    </div>
                  )
                })()}
              </div>

              {/* Overall Metrics Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {(() => {
                  const activeStops = PMPL_ROUTES[activeBusRoute] || []
                  const overallEntries = activeStops.reduce((sum, stop) => sum + ((stopTelemetry[stop] && stopTelemetry[stop].entries) || 0), 0)
                  const overallExits = activeStops.reduce((sum, stop) => sum + ((stopTelemetry[stop] && stopTelemetry[stop].exits) || 0), 0)
                  const overallScans = activeStops.reduce((sum, stop) => sum + ((stopTelemetry[stop] && stopTelemetry[stop].scans) || 0), 0)
                  const overallBooked = activeStops.reduce((sum, stop) => sum + tickets.filter(t => t.source === stop).length, 0)
                  const overallUnbooked = activeStops.reduce((sum, stop) => {
                    const stats = stopTelemetry[stop] || { entries: 0, exits: 0, scans: 0 }
                    const booked = tickets.filter(t => t.source === stop).length
                    return sum + Math.max(0, (stats.entries || 0) - booked)
                  }, 0)

                  return [
                    { label: 'Overall Entries', value: overallEntries, color: '#10b981' },
                    { label: 'Overall Exits', value: overallExits, color: '#ef4444' },
                    { label: 'Overall Booked', value: overallBooked, color: '#38bdf8' },
                    { label: 'Overall Validated', value: overallScans, color: '#a78bfa' },
                    { label: 'Overall Unbooked', value: overallUnbooked, color: overallUnbooked > 0 ? '#ef4444' : '#64748b', isAlert: overallUnbooked > 0 }
                  ].map((card) => (
                    <div
                      key={card.label}
                      style={{
                        background: 'rgba(255,255,255,0.015)',
                        border: card.isAlert ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.label}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: card.color }}>{card.value}</div>
                    </div>
                  ))
                })()}
              </div>

              {/* Responsive Audit Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b', fontWeight: 800 }}>
                      <th style={{ padding: '12px 16px' }}>PMPL BUS STOP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>PASSENGERS ENTERED & EXITED</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>TICKETS BOOKED FROM STOP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>TICKETS VALIDATED AT STOP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>UNBOOKED PASSENGERS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(PMPL_ROUTES[activeBusRoute] || []).map((stop) => {
                      const stats = stopTelemetry[stop] || { entries: 0, exits: 0, scans: 0 }
                      const booked = tickets.filter(t => t.source === stop).length
                      const unbooked = Math.max(0, (stats.entries || 0) - booked)
                      const isCurrentStop = activeStop === stop
                      
                      return (
                        <tr
                          key={stop}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isCurrentStop ? 'rgba(56,189,248,0.03)' : 'transparent',
                            color: isCurrentStop ? '#38bdf8' : '#e2e8f0',
                            fontWeight: isCurrentStop ? 800 : 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.15rem' }}>📍</span>
                            <div>
                              <span>{stop}</span>
                              {isCurrentStop && (
                                <span style={{
                                  marginLeft: '8px', padding: '2px 8px', borderRadius: '4px',
                                  background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)',
                                  fontSize: '0.62rem', fontWeight: 900, color: '#38bdf8'
                                }}>
                                  BUS AT THIS STOP
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              <span style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', padding: '4px 8px', borderRadius: '8px', color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>
                                🟢 {stats.entries || 0} In
                              </span>
                              <span style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', padding: '4px 8px', borderRadius: '8px', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem' }}>
                                🔴 {stats.exits || 0} Out
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', padding: '4px 12px', borderRadius: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}>
                              {booked}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', padding: '4px 12px', borderRadius: '8px', color: '#a78bfa', fontWeight: 800, fontSize: '0.85rem' }}>
                              {stats.scans || 0}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {unbooked > 0 ? (
                              <span style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', padding: '4px 12px', borderRadius: '8px', color: '#ef4444', fontWeight: 900, fontSize: '0.82rem' }}>
                                ⚠️ {unbooked} Unbooked
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontWeight: 700 }}>0</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Cyber Hardware Telemetry & Scan QR Tab ── */}
        {tab === 'scanner' && (
          <div className="responsive-grid-scanner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'stretch' }}>
            
            {/* Left Column: Conductor Activity Deck */}
            <div style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 50px -15px rgba(0,0,0,0.6), 0 0 40px rgba(56,189,248,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Activity size={18} color="#38bdf8" />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px', margin: 0 }}>Conductor Activity Deck</h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>
                  Real-time passenger flow and boarding validations logs.
                </p>
              </div>

              {/* Live Conductor Activity Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📋 Conductor Activity Log
                  </span>
                  <button
                    onClick={() => setLogs(['[System] Telemetry console cleared. Waiting for triggers...'])}
                    style={{
                      background: 'none', border: 'none', color: '#475569', fontSize: '0.68rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    Clear Log
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1,
                  minHeight: '300px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  scrollBehavior: 'smooth'
                }}>
                  {logs.map((log, idx) => {
                    const parsed = parseLog(log)
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          background: parsed.bg,
                          border: `1px solid ${parsed.border}`,
                          borderRadius: '14px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        {/* Emoji Icon */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', flexShrink: 0
                        }}>
                          {parsed.icon}
                        </div>

                        {/* Log Text Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: parsed.color, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                              {parsed.title}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>
                              {parsed.time}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, margin: 0, lineHeight: '1.3' }}>
                            {parsed.content}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Manual Validator Section */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                padding: '20px', borderRadius: '18px'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 800, marginBottom: '8px' }}>
                  ✏️ Manual Conductor Validation Override
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter Ticket ID or Passcode (e.g. RUQQ5S)"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    style={{
                      flex: 1, height: '40px', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                      padding: '0 12px', color: '#fff', fontSize: '0.82rem', outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (manualInput.trim()) {
                        addLog(`✏️ Manual validation override triggered for: "${manualInput}"`)
                        verifyTicket(manualInput)
                        setManualInput('')
                      }
                    }}
                    style={{
                      height: '40px', padding: '0 16px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Validate
                  </motion.button>
                </div>
              </div>

            </div>

            {/* Right Column: Scan Results Panel & Live Webcam Stream */}
            <div style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              minHeight: '480px'
            }}>
              {!scanResult ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Eye size={20} color="#38bdf8" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>Device Camera Validator</h2>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '24px', marginTop: 0 }}>
                    Position the passenger's boarding pass QR code inside the camera box to scan.
                  </p>

                  {/* QR Scanner Viewport Container */}
                  <div style={{
                    maxWidth: '320px',
                    margin: '0 auto',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    background: 'rgba(7, 10, 19, 0.6)',
                    backdropFilter: 'blur(12px)',
                    padding: '16px',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(56, 189, 248, 0.05)',
                  }}>
                    {/* Glowing Cyber Corners */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderTop: '3.5px solid #38bdf8', borderLeft: '3.5px solid #38bdf8', borderTopLeftRadius: '10px', filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderTop: '3.5px solid #38bdf8', borderRight: '3.5px solid #38bdf8', borderTopRightRadius: '10px', filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '24px', height: '24px', borderBottom: '3.5px solid #38bdf8', borderLeft: '3.5px solid #38bdf8', borderBottomLeftRadius: '10px', filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '24px', height: '24px', borderBottom: '3.5px solid #38bdf8', borderRight: '3.5px solid #38bdf8', borderBottomRightRadius: '10px', filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                    
                    <div id="reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#0b0f19' }} />
                    
                    {/* Laser scan animation overlay */}
                    {scannerActive && (
                      <motion.div
                        animate={{ y: [0, 200, 0] }}
                        transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut' }}
                        style={{
                          position: 'absolute',
                          left: '20px',
                          right: '20px',
                          height: '2.5px',
                          background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
                          boxShadow: '0 0 12px 2px #38bdf8',
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      />
                    )}
                  </div>

                  <div style={{ marginTop: '20px', fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>
                    {scannerActive ? '🟢 Browser Webcam Stream Active' : '⚙️ Starting Camera Stream...'}
                  </div>
                </div>
              ) : (
                <motion.div
                  key={scanResult.ticketId || scanResult.ticket?.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: scanResult.status === 'success'
                      ? 'rgba(16,185,129,0.06)'
                      : scanResult.status === 'warning'
                      ? 'rgba(245,158,11,0.06)'
                      : 'rgba(239,68,68,0.06)',
                    border: `1.5px solid ${
                      scanResult.status === 'success'
                        ? 'rgba(16,185,129,0.25)'
                        : scanResult.status === 'warning'
                        ? 'rgba(245,158,11,0.25)'
                        : 'rgba(239,68,68,0.25)'
                    }`,
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: scanResult.status === 'success' ? '#10b981' : scanResult.status === 'warning' ? '#f59e0b' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    boxShadow: `0 0 20px ${scanResult.status === 'success' ? 'rgba(16,185,129,0.3)' : scanResult.status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}>
                    {scanResult.status === 'success' ? <CheckCircle2 size={32} color="#fff" /> : <AlertTriangle size={32} color="#fff" />}
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem', fontWeight: 900,
                    color: scanResult.status === 'success' ? '#10b981' : scanResult.status === 'warning' ? '#f59e0b' : '#ef4444',
                    marginBottom: '8px'
                  }}>
                    {scanResult.message}
                  </h3>

                  {scanResult.status !== 'invalid' ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, margin: '12px 0 20px' }}>
                        ID: <code style={{ color: '#fff', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '6px' }}>{scanResult.ticket.id}</code>
                      </div>

                      <div style={{ display: 'grid', gap: '10px', fontSize: '0.82rem', textAlign: 'left', background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {[
                          ['Route', `${scanResult.ticket.source} → ${scanResult.ticket.destination}`],
                          ['Passenger Detail', scanResult.ticket.details],
                          ['Fare Paid', scanResult.ticket.totalFare],
                          ['Purchase Date', scanResult.ticket.date],
                          ['Original Status', scanResult.ticket.status.toUpperCase()]
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: '#64748b', fontWeight: 700 }}>{label}</span>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>SCANNED PAYLOAD:</div>
                      <div style={{ wordBreak: 'break-all', fontSize: '0.85rem', color: '#fff', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', fontWeight: 700 }}>
                        {scanResult.ticketId}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, marginTop: '12px' }}>
                        ⚠️ Security Alert: The invalid scans log counter has been incremented.
                      </p>
                    </div>
                  )}

                  {/* Reset Scan button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setScanResult(null)}
                    style={{
                      marginTop: '24px', padding: '10px 24px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    🔄 Clear & Ready for Next Pass
                  </motion.button>
                </motion.div>
              )}
            </div>

          </div>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Trips Completed', value: tripHistory.length, icon: <Bus size={20} />, color: '#38bdf8' },
                { label: 'Total Revenue Collected', value: `₹${tripHistory.reduce((sum, t) => sum + (t.revenue || 0), 0)}`, icon: <CreditCard size={20} />, color: '#10b981' },
                { label: 'Total Passengers Served', value: tripHistory.reduce((sum, t) => sum + (t.entered || 0), 0), icon: <Users size={20} />, color: '#818cf8' },
                { label: 'Avg. Revenue / Trip', value: `₹${tripHistory.length ? Math.round(tripHistory.reduce((sum, t) => sum + (t.revenue || 0), 0) / tripHistory.length) : 0}`, icon: <TrendingUp size={20} />, color: '#f59e0b' },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px 22px',
                    boxShadow: `0 0 30px ${card.color}08`
                  }}
                >
                  <div style={{ color: card.color, marginBottom: '10px' }}>{card.icon}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                    {card.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trip Logs Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.3px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#38bdf8" /> Trip History Logs ({tripHistory.length})
              </h2>
              {tripHistory.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleClearHistory}
                  style={{
                    padding: '8px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.78rem',
                    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> Clear History Logs
                </motion.button>
              )}
            </div>

            {/* History Logs List */}
            {tripHistory.length === 0 ? (
              <div style={{
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '24px', padding: '64px 32px', textAlign: 'center', color: '#475569',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.2, color: '#38bdf8' }} />
                <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '6px', fontSize: '1.05rem' }}>No Trips Logged Yet</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '360px', margin: '0 auto', fontWeight: 600 }}>
                  After starting and ending trips, their full diagnostic summaries and passenger counts will be saved here in real-time.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tripHistory.map((trip, idx) => {
                  const tripNumber = tripHistory.length - idx
                  return (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{
                        background: 'rgba(15,23,42,0.85)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                      }}
                    >
                      {/* Trip Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Bus size={16} color="#fff" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              Trip #{tripNumber}
                              {trip.busRoute && (
                                <span style={{
                                  background: trip.busRoute === 'ALL' ? 'rgba(100,116,139,0.15)' : 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(37,99,235,0.15))',
                                  border: trip.busRoute === 'ALL' ? '1px solid rgba(100,116,139,0.25)' : '1.5px solid rgba(56,189,248,0.35)',
                                  padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900,
                                  color: trip.busRoute === 'ALL' ? '#94a3b8' : '#38bdf8',
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  boxShadow: trip.busRoute === 'ALL' ? 'none' : '0 0 12px rgba(56,189,248,0.1)',
                                  letterSpacing: '0.3px'
                                }}>
                                  🚌 {trip.busRoute === 'ALL' ? 'All Routes' : `Bus No. ${trip.busRoute}`}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ID: <code style={{ color: '#38bdf8', fontSize: '0.72rem' }}>{trip.id}</code></div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)',
                            padding: '4px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            <Calendar size={12} />
                            {trip.date}
                          </div>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            style={{
                              background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
                              padding: '6px', borderRadius: '8px', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Diagnostic telemetry details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                        {[
                          { label: 'BUS ROUTE NO.', value: trip.busRoute ? (trip.busRoute === 'ALL' ? 'All Routes' : `PMPL ${trip.busRoute}`) : 'N/A', color: '#38bdf8', isBus: true },
                          { label: 'PASSENGERS ENTERED', value: trip.entered || 0, color: '#10b981' },
                          { label: 'PASSENGERS EXITED', value: trip.exited || 0, color: '#ef4444' },
                          { label: 'REMAINING AT END', value: trip.inside !== undefined ? trip.inside : Math.max(0, (trip.entered || 0) - (trip.exited || 0)), color: '#38bdf8' },
                          { label: 'INVALID SCANS', value: trip.invalidScans || 0, color: (trip.invalidScans || 0) > 0 ? '#fbbf24' : '#64748b' },
                          { label: 'TICKET COUNT', value: trip.totalTickets || 0, color: '#818cf8' },
                          { label: 'REVENUE EARNED', value: `₹${trip.revenue || 0}`, color: '#10b981', isLarge: true },
                        ].map((stat: any, i) => (
                          <div key={i} style={{
                            background: stat.isBus ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.015)',
                            border: stat.isBus ? '1.5px solid rgba(56,189,248,0.15)' : '1px solid rgba(255,255,255,0.04)',
                            borderRadius: '12px', padding: '12px 14px'
                          }}>
                            <div style={{ fontSize: '0.62rem', color: stat.isBus ? '#38bdf8' : '#64748b', fontWeight: 855, letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: stat.isLarge ? '1.15rem' : '1.05rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      {trip.stopTelemetry && (() => {
                        const stopData = trip.stopTelemetry as Record<string, any>
                        const totalEntriesVal = Object.values(stopData).reduce((s: number, t: any) => s + (t.entries || 0), 0)
                        const totalScansVal = Object.values(stopData).reduce((s: number, t: any) => s + (t.scans || 0), 0)
                        const unbookedCount = Math.max(0, totalEntriesVal - totalScansVal)
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {unbookedCount > 0 ? (
                              <div style={{
                                background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.15)',
                                padding: '12px 18px', borderRadius: '12px', fontSize: '0.78rem', color: '#ef4444',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 650,
                                marginTop: '12px'
                              }}>
                                <AlertTriangle size={15} /> **Fare Evasion Audit Warning**: Estimated **{unbookedCount} passenger{unbookedCount > 1 ? 's' : ''}** boarded this trip without validating / booking a ticket!
                              </div>
                            ) : (
                              <div style={{
                                background: 'rgba(16,185,129,0.04)', border: '1.5px solid rgba(16,185,129,0.15)',
                                padding: '12px 18px', borderRadius: '12px', fontSize: '0.78rem', color: '#10b981',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 650,
                                marginTop: '12px'
                              }}>
                                <ShieldCheck size={15} /> **Fare Evasion Audit**: 100% Ticketing Compliance recorded for this trip segment.
                              </div>
                            )}

                            {/* Dropdown Toggle Button */}
                            <button
                              onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                              style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px', color: '#38bdf8', padding: '6px 14px',
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800,
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
                                width: 'fit-content', transition: 'all 0.2s'
                              }}
                            >
                              🔍 {expandedTrip === trip.id ? 'Hide Stop Diagnostics' : 'Show Stop Diagnostics'}
                            </button>

                            {/* Collapsible Content */}
                            <AnimatePresence>
                              {expandedTrip === trip.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{
                                    background: 'rgba(0,0,0,0.2)', borderRadius: '14px',
                                    padding: '16px', border: '1px solid rgba(255,255,255,0.04)',
                                    overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px'
                                  }}
                                >
                                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    📍 Stop-Wise Passenger & Ticketing Breakdown
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(() => {
                                      const routeStops: string[] = (trip.busRoute && PMPL_ROUTES[trip.busRoute]) || PMPL_STOPS
                                      return routeStops.map((stop: string) => {
                                        const stats = trip.stopTelemetry?.[stop] || { entries: 0, exits: 0, scans: 0 }
                                        const unbooked = Math.max(0, (stats.entries || 0) - (stats.scans || 0))
                                        return (
                                          <div
                                            key={stop}
                                            style={{
                                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                              paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                              fontSize: '0.78rem'
                                            }}
                                          >
                                            <span style={{ color: '#fff', fontWeight: 700 }}>📍 {stop}</span>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                              <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 {stats.entries || 0} In</span>
                                              <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 {stats.exits || 0} Out</span>
                                              <span style={{ color: '#a78bfa', fontWeight: 700 }}>🎫 Scanned: {stats.scans || 0}</span>
                                              {unbooked > 0 ? (
                                                <span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px', color: '#ef4444', fontSize: '0.68rem', fontWeight: 800 }}>
                                                  ⚠️ {unbooked} Unbooked
                                                </span>
                                              ) : (
                                                stats.entries > 0 && <span style={{ color: '#10b981', fontSize: '0.68rem', fontWeight: 800 }}>🟢 Compliant</span>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })
                                    })()}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })()}

                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Custom Premium Modal Popup ── */}
      <AnimatePresence>
        {modal.show && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px'
          }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(15, 23, 42, 0.92)',
                border: `1.5px solid ${
                  modal.type === 'success'
                    ? 'rgba(16,185,129,0.3)'
                    : modal.type === 'error'
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(56,189,248,0.3)'
                }`,
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 60px rgba(56,189,248,0.02)',
                textAlign: 'center'
              }}
            >
              {/* Header Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background:
                  modal.type === 'success'
                    ? 'rgba(16,185,129,0.1)'
                    : modal.type === 'error'
                    ? 'rgba(239,68,68,0.1)'
                    : 'rgba(56,189,248,0.1)',
                border: `1px solid ${
                  modal.type === 'success'
                    ? 'rgba(16,185,129,0.3)'
                    : modal.type === 'error'
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(56,189,248,0.3)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                {modal.type === 'success' ? (
                  <CheckCircle2 size={32} color="#10b981" />
                ) : modal.type === 'error' ? (
                  <XCircle size={32} color="#ef4444" />
                ) : (
                  <AlertTriangle size={32} color="#38bdf8" />
                )}
              </div>

              {/* Title & Description */}
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#fff',
                marginBottom: '10px',
                letterSpacing: '-0.3px'
              }}>
                {modal.title}
              </h2>
              <p style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                marginBottom: '28px',
                fontWeight: 600
              }}>
                {modal.message}
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {modal.type === 'confirm' ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setModal(prev => ({ ...prev, show: false }))}
                      style={{
                        flex: 1, height: '46px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: '#94a3b8',
                        fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={modal.onConfirm}
                      style={{
                        flex: 1, height: '46px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none', borderRadius: '12px', color: '#fff',
                        fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '0 8px 20px -6px rgba(239,68,68,0.4)'
                      }}
                    >
                      Confirm Reset
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModal(prev => ({ ...prev, show: false }))}
                    style={{
                      width: '100%', height: '46px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none', borderRadius: '12px', color: '#fff',
                      fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: '0 8px 20px -6px rgba(37,99,235,0.4)'
                    }}
                  >
                    Dismiss
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
