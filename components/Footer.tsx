'use client'
import { Bus, Mail, MapPin, Heart } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ 
      background: 'linear-gradient(180deg, #0b0f19 0%, #030712 100%)', 
      borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
      padding: '40px 0 24px', 
      color: '#94a3b8',
      position: 'relative'
    }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <div style={{ 
                padding: '6px', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                borderRadius: '8px', 
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              }}>
                <Bus size={16} />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.5px' }}>SmartBus</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#94a3b8', marginBottom: '1rem', fontWeight: 500 }}>
              Sleek QR tickets and turnstile scanning framework for Pune bus commuters.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.a 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.06)', color: '#38bdf8' }}
                whileTap={{ scale: 0.95 }}
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.06)', color: '#38bdf8' }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </motion.a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.8px', marginBottom: '1rem' }}>Quick Links</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0 }}>
              <li>
                <Link href="/book" style={{ fontSize: '0.8rem', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>Book Pass</Link>
              </li>
              <li>
                <Link href="/tickets" style={{ fontSize: '0.8rem', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>My Inventory</Link>
              </li>
              <li>
                <Link href="/support" style={{ fontSize: '0.8rem', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>Support Desk</Link>
              </li>
              <li>
                <Link href="/admin" style={{ fontSize: '0.8rem', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>Admin Panel</Link>
              </li>
            </ul>
          </div>

          {/* Contact Desk */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.8px', marginBottom: '1rem' }}>Contact</h3>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.8rem', fontWeight: 550 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Mail size={14} style={{ color: '#38bdf8' }} />
                <span style={{ color: '#cbd5e1' }}>support@smarttrain.pmpl</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <MapPin size={14} style={{ color: '#38bdf8' }} />
                <span style={{ color: '#cbd5e1' }}>Pune Metro Station, MH</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Copy Section */}
        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
          paddingTop: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '10px', 
          fontSize: '0.75rem', 
          color: '#64748b',
          fontWeight: 600
        }}>
          <div>
            &copy; {currentYear} SmartBus. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            PMPL Commuters <Heart size={10} style={{ color: '#ef4444', fill: '#ef4444' }} />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
