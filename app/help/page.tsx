'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, MessageCircle, Phone, Mail, ChevronDown, CheckCircle2, ShieldCheck, MapPin, Search, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const HelpPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'How long is my digital pass valid?',
      a: 'All digital passes are valid for 60 minutes from the time of generation. You must scan the QR code at the bus turnstile within this window.'
    },
    {
      q: 'Can I book multiple tickets at once?',
      a: 'Yes, you can book up to 10 tickets per transaction. You can select the number of Adults and Children during the first step of the booking process.'
    },
    {
      q: 'Do Children need a separate ticket?',
      a: 'Children between 3 and 12 years age need a half-fare ticket. Children under 3 years can travel for free when accompanied by an adult.'
    },
    {
      q: 'Is my payment data secure?',
      a: 'We use bank-grade RSA-2048 encryption to ensure all transaction data is fully protected. No payment details are stored on our servers.'
    },
    {
      q: 'Do you offer a daily unlimited pass?',
      a: 'Yes, PMPML offers a unified daily pass for ₹70 which allows unlimited travel across Pune and Pimpri-Chinchwad for 24 hours.'
    },
    {
      q: 'What if I lose my phone during the journey?',
      a: 'Your digital pass is stored in your local storage. If you lose your phone, please contact PMPML customer support at +91-20-24503300 for assistance.'
    }
  ]

  const contactMethods = [
    { icon: <Phone size={24} />, title: 'PMPL Helpline', desc: '+91-20-24503300', color: '#0f172a' },
    { icon: <Mail size={24} />, title: 'Email Support', desc: 'support@pmpl.org.in', color: '#0f172a' },
    { icon: <MessageCircle size={24} />, title: 'Live Chat', desc: 'Available 24/7', color: '#0f172a' }
  ]

  return (
    <div style={{ padding: '60px 0 120px', backgroundColor: '#fff' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ marginBottom: '12px', fontSize: '2.5rem' }}>Help Center</h1>
          <p style={{ color: '#64748b' }}>Everything you need to know about the digital bus pass system.</p>
        </div>

        {/* Support Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '100px' }}>
          {contactMethods.map((m, i) => (
            <motion.div 
              key={m.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="card" 
              style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#fff', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                 {m.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{m.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{m.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQs Section */}
        <div style={{ marginBottom: '100px' }}>
           <h2 style={{ marginBottom: '40px', textAlign: 'center' }}>Frequent Questions</h2>
           <div style={{ display: 'grid', gap: '16px' }}>
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="card" 
                  style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', borderColor: '#f1f5f9' }}
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeFaq === i ? '#f8fafc' : '#fff' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{faq.q}</div>
                    <motion.div animate={{ rotate: activeFaq === i ? 180 : 0 }} transition={{ type: 'spring', damping: 10 }}>
                      <ChevronDown size={20} color="#94a3b8" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid #f1f5f9' }}
                      >
                        <div style={{ padding: '24px 30px', color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem' }}>{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
           </div>
        </div>

        {/* Trust Badge */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="card" 
          style={{ padding: '40px', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center', border: 'none', borderRadius: '32px' }}
        >
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', marginBottom: '24px' }}>
             <ShieldCheck size={32} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Your Travel, Protected.</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '500px', margin: '0 auto', fontSize: '1.05rem' }}>Our digital issuance system is fully compliant with modern cybersecurity standards to ensure your commute is always secure.</p>
        </motion.div>

      </div>
    </div>
  )
}

export default HelpPage
