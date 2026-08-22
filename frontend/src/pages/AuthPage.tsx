import React, { useState, useEffect, useRef } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import heroArtwork from '../assets/auth-hero-illustration.png';

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

      {/* Right Column - Razor Sharp Native Resolution Image */}
      <div className="auth-right-pane" style={{ backgroundColor: bgColor }}>
        <img
          ref={imgRef}
          src={heroArtwork}
          onLoad={sampleImageBackground}
          alt="PathPilot Travel Planning"
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '94vh',
            objectFit: 'contain',
            objectPosition: 'center',
            imageRendering: 'auto',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};
