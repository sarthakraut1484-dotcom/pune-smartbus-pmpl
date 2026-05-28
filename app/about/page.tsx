'use client'
import { motion } from 'framer-motion'
import { Users, Target, Shield, Bus, Award, Heart } from 'lucide-react'

export default function About() {
  const values = [
    { icon: <Target size={24} />, title: 'Our Mission', desc: 'To simplify public transport for everyone through technology.' },
    { icon: <Shield size={24} />, title: 'Reliability', desc: 'Providing consistent and dependable ticketing services.' },
    { icon: <Heart size={24} />, title: 'User First', desc: 'Designing every feature with the commuter in mind.' }
  ]

  const stats = [
    { label: 'Commuters Daily', value: '50k+' },
    { label: 'Routes Covered', value: '450+' },
    { label: 'PMPL Partners', value: '100%' }
  ]

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Hero Section */}
      <section style={{ padding: '120px 0 80px', textAlign: 'center', background: 'linear-gradient(to bottom, #f8fafc, #fff)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-1px' }}
          >
            We are <span style={{ color: 'var(--primary)' }}>SmartBus</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}
          >
            Founded in 2026, SmartBus is dedicated to transforming the way Pune commutes. We believe that public transportation should be seamless, digital, and stress-free.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container" style={{ maxWidth: '900px', marginBottom: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '24px' }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Content Section */}
      <section className="container" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>The Future is Digital</h2>
            <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Pune's traffic challenges require modern solutions. By digitizing the ticketing process, we reduce wait times at bus stands and eliminate the hassle of physical cash.
            </p>
            <p style={{ color: '#64748b', lineHeight: 1.7 }}>
              Our platform connects directly with PMPL systems to provide real-time updates and valid digital passes that can be scanned by conductors in seconds.
            </p>
          </div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {values.map((v, i) => (
              <motion.div 
                key={v.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', display: 'flex', gap: '20px' }}
              >
                <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <h4 style={{ marginBottom: '4px', fontWeight: 700 }}>{v.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
