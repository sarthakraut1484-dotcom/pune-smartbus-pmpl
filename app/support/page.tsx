'use client'
import { motion } from 'framer-motion'
import { HelpCircle, Search } from 'lucide-react'

export default function Support() {
  const faqs = [
    { q: 'How do I book a ticket?', a: 'Go to the "Book Ticket" section, select your route, and pay using any UPI app or card. Your QR ticket will be generated instantly.' },
    { q: 'Can I cancel my ticket?', a: 'Tickets can be cancelled up to 15 minutes before the bus departure time for a full refund.' },
    { q: 'Is the digital QR valid for all PMPL buses?', a: 'Yes, our QR tickets are officially recognized and valid across all PMPL routes in Pune.' },
    { q: 'What if my phone battery dies?', a: 'You can log in to your account from any device to show your ticket, or provide your registered mobile number to the conductor.' }
  ]

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <section style={{ padding: '100px 0 60px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '2.5rem', marginBottom: '1rem' }}
          >
            How can we help?
          </motion.h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            Find answers to common questions.
          </p>
          
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input 
              type="text" 
              placeholder="Search for help..." 
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container" style={{ maxWidth: '800px', padding: '80px 0' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '2.5rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}
            >
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                <HelpCircle size={18} style={{ color: 'var(--primary)' }} /> {faq.q}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, paddingLeft: '30px' }}>{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
