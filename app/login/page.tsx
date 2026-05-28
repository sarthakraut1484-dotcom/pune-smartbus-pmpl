'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Bus } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successScreen, setSuccessScreen] = useState<{ show: boolean; username: string; isNew: boolean }>({ show: false, username: '', isNew: false });
  const router = useRouter();

  const triggerSuccess = (username: string, isNew: boolean, redirectUrl: string) => {
    setSuccessScreen({ show: true, username, isNew });
    setTimeout(() => router.push(redirectUrl), 2400);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        // Automatic local bypass logic for admin@0861
        if (email === 'admin@0861' && password === 'admin@0861') {
          sessionStorage.setItem('isAdminAuthenticated', 'true');
          const dummyUser = { email: 'admin@0861', uid: 'admin-local', displayName: 'Admin' };
          sessionStorage.setItem('localUser', JSON.stringify(dummyUser));
          triggerSuccess('Admin', false, '/admin');
          return;
        }

        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const params = new URLSearchParams(window.location.search);
          triggerSuccess(cred.user.email?.split('@')[0] || 'Commuter', false, params.get('redirect') || '/book');
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            // Local fallback logic
            const username = email.split('@')[0] || 'Commuter';
            const dummyUser = { email, uid: `local-${Date.now()}`, displayName: username };
            sessionStorage.setItem('localUser', JSON.stringify(dummyUser));
            const params = new URLSearchParams(window.location.search);
            
            // If they signed in using admin credentials on this page, route them to /admin
            const targetRedirect = email === 'admin@0861' ? '/admin' : (params.get('redirect') || '/book');
            if (email === 'admin@0861') {
              sessionStorage.setItem('isAdminAuthenticated', 'true');
            }
            triggerSuccess(username, false, targetRedirect);
          } else {
            throw err;
          }
        }
      } else {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const params = new URLSearchParams(window.location.search);
          triggerSuccess(name || cred.user.email?.split('@')[0] || 'Commuter', true, params.get('redirect') || '/book');
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            // Local fallback logic
            const username = name || email.split('@')[0] || 'Commuter';
            const dummyUser = { email, uid: `local-${Date.now()}`, displayName: username };
            sessionStorage.setItem('localUser', JSON.stringify(dummyUser));
            const params = new URLSearchParams(window.location.search);
            triggerSuccess(username, true, params.get('redirect') || '/book');
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const params = new URLSearchParams(window.location.search);
      triggerSuccess(cred.user.displayName || cred.user.email?.split('@')[0] || 'Commuter', false, params.get('redirect') || '/book');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Login Success Overlay ── */}
      <AnimatePresence>
        {successScreen.show && (
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              gap: '24px'
            }}
          >
            {/* Animated ring + checkmark */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              style={{ position: 'relative', width: '100px', height: '100px' }}
            >
              {/* Pulsing glow ring */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.35)'
                }}
              />
              {/* Solid circle */}
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
              }}>
                <CheckCircle2 size={48} color="#fff" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.5px',
                marginBottom: '8px'
              }}>
                {successScreen.isNew ? 'Account Created! 🎉' : 'Welcome back!'}
              </div>
              <div style={{ fontSize: '1.05rem', color: '#94a3b8', fontWeight: 600 }}>
                {successScreen.isNew
                  ? `Hey ${successScreen.username}, your SmartBus account is ready.`
                  : `Logged in as ${successScreen.username}. Redirecting you now…`}
              </div>
            </motion.div>

            {/* SmartBus branding pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '8px 20px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <Bus size={15} strokeWidth={2.2} />
              SmartBus · PMPL Official Pass
            </motion.div>

            {/* Animated progress bar */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                borderRadius: '0 3px 3px 0'
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.4, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Login Form ── */}
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            maxWidth: '480px', 
            width: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isLogin 
                ? 'Enter your details to access your account.' 
                : 'Sign up to get started with our platform.'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                padding: '1rem', 
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '0' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{ position: 'relative' }}
                >
                  <div style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }}>
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '48px' }}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }}>
                <Mail size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Email Address or Username" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }}>
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '2rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ padding: '0 1rem' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '12px',
              backgroundColor: '#fff'
            }}
            type="button"
            disabled={loading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.69 17.61V20.35H19.26C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.26 20.35L15.69 17.61C14.71 18.27 13.46 18.66 12 18.66C9.17 18.66 6.77 16.75 5.88 14.18H2.21V17.03C4.01 20.61 7.74 23 12 23Z" fill="#34A853"/>
              <path d="M5.88 14.18C5.65 13.49 5.52 12.76 5.52 12C5.52 11.24 5.65 10.51 5.88 9.82V6.97H2.21C1.47 8.44 1.05 10.16 1.05 12C1.05 13.84 1.47 15.56 2.21 17.03L5.88 14.18Z" fill="#FBBC05"/>
              <path d="M12 5.34C13.62 5.34 15.07 5.9 16.22 6.99L19.34 3.87C17.46 2.11 14.97 1 12 1C7.74 1 4.01 3.39 2.21 6.97L5.88 9.82C6.77 7.25 9.17 5.34 12 5.34Z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            color: 'var(--text-muted)'
          }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem',
                padding: 0
              }}
              type="button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </>
  );
}
