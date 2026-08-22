import React, { useState, useEffect, useRef } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import heroArtwork from '../assets/auth-hero-illustration.png';
import { Plane, TrendingUp, Compass, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [bgColor, setBgColor] = useState<string>('#f4f4f4');
  const imgRef = useRef<HTMLImageElement>(null);

  // Automatically sample the EXACT pixel color from the image's corner
  const sampleImageBackground = () => {
    if (!imgRef.current) return;
    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 100;
      canvas.height = img.naturalHeight || 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Sample top-left corner pixel (5, 5)
        const pixelData = ctx.getImageData(5, 5, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];
        const exactHex = `#${((1 << 24) + (r << 16) + g * 256 + b).toString(16).slice(1)}`;
        setBgColor(exactHex);
        document.body.style.backgroundColor = exactHex;
        document.documentElement.style.setProperty('--bg-canvas', exactHex);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  return (
    <div className="auth-container" style={{ backgroundColor: bgColor }}>
      {/* Left Column - Clean Authentication Form */}
      <div className="auth-left-pane" style={{ backgroundColor: bgColor }}>
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSuccess={onAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={onAuthSuccess}
            />
          )}
        </div>
      </div>

      {/* Right Column - Hero Graphic & 4 Floating Feature Badges */}
      <div
        className="auth-right-pane"
        style={{
          backgroundColor: bgColor,
          padding: '2.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {/* Top Row: 2 Floating Cards */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 5,
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Card 1: Tokyo -> Paris Flight */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
              padding: '0.75rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              transition: 'transform 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff6b35 0%, #ff4800 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(255, 72, 0, 0.25)',
                flexShrink: 0
              }}
            >
              <Plane size={22} style={{ transform: 'rotate(-45deg)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Tokyo ➔ Paris
                </span>
                <span
                  style={{
                    background: '#e6f7ec',
                    color: '#0d8a3e',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px'
                  }}
                >
                  On Time
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>
                Flight PP-802 • Multi-Stop Active
              </div>
            </div>
          </div>

          {/* Card 2: Budget */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
              padding: '0.75rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              transition: 'transform 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                flexShrink: 0
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Budget: ₹75,000
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '0.1rem' }}>
                <span>🟢</span>
                <span>18% Under Estimated Cost</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Illustration */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '0.75rem 0' }}>
          <img
            ref={imgRef}
            src={heroArtwork}
            onLoad={sampleImageBackground}
            alt="PathPilot Travel Planning"
            style={{
              maxWidth: '92%',
              maxHeight: '58vh',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block'
            }}
          />
        </div>

        {/* Bottom Row: 2 Floating Cards */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 5,
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Card 3: 15+ Global Cities */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
              padding: '0.75rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              transition: 'transform 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
                flexShrink: 0
              }}
            >
              <Compass size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                15+ Global Cities
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>
                Curated itineraries & sights
              </div>
            </div>
          </div>

          {/* Card 4: Instant Cloud Sync */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
              padding: '0.75rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              transition: 'transform 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.25)',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Instant Cloud Sync
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>
                PostgreSQL & Supabase Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
