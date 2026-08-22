import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, Compass, Check } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

const CARTOON_AVATARS = [
  { id: '1', name: 'Alex', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4' },
  { id: '2', name: 'Sam', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden&backgroundColor=ffdfbf' },
  { id: '3', name: 'Maya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=c0aede' },
  { id: '4', name: 'Leo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9' },
  { id: '5', name: 'Chloe', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=ffd5dc' }
];

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [role, setRole] = useState<UserRole>('traveler');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(CARTOON_AVATARS[0].url);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeAvatar = role === 'admin'
    ? 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9'
    : selectedAvatar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const normalizedEmail = email.includes('@') ? email.trim().toLowerCase() : `${email.trim().toLowerCase()}@pathpilot.com`;
      const ok = await login({ email: normalizedEmail, password });
      if (ok && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'traveler' | 'admin') => {
    setLoading(true);
    setError('');
    try {
      const ok = await quickLogin(type);
      if (ok && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-wrapper" style={{ width: '100%' }}>
      {/* 1. Avatar & Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.15rem' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={activeAvatar}
            alt="User profile"
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid var(--primary-flare)',
              boxShadow: '0 4px 12px rgba(255, 72, 0, 0.2)',
              background: '#ffffff'
            }}
          />
        </div>

        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
            Sign in to manage your multi-city journeys
          </p>
        </div>
      </div>

      {/* Role Switcher */}
      <div
        style={{
          display: 'flex',
          background: '#dedede',
          border: '1px solid var(--border-silver)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
          marginBottom: '0.85rem',
          gap: '0.25rem'
        }}
      >
        <button
          type="button"
          className={`role-tab-btn ${role === 'traveler' ? 'active' : ''}`}
          onClick={() => {
            setRole('traveler');
            setEmail('traveler@pathpilot.com');
            setPassword('Password123!');
          }}
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
        >
          <Compass size={15} />
          <span>Traveler</span>
        </button>
        <button
          type="button"
          className={`role-tab-btn ${role === 'admin' ? 'active' : ''}`}
          onClick={() => {
            setRole('admin');
            setEmail('admin@pathpilot.com');
            setPassword('AdminPassword123!');
          }}
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
        >
          <Shield size={15} />
          <span>Admin</span>
        </button>
      </div>

      {/* Cartoon Avatar Picker for Traveler Mode */}
      {role === 'traveler' && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border-silver)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.65rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Avatar
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {CARTOON_AVATARS.map(av => {
              const isSel = selectedAvatar === av.url;
              return (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.url)}
                  title={av.name}
                  style={{
                    background: isSel ? 'var(--primary-flare-subtle)' : '#ffffff',
                    border: isSel ? '2px solid var(--primary-flare)' : '1px solid var(--border-silver)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    padding: '1px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isSel ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={av.url} alt={av.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-Click Instant Demo Login */}
      <div
        style={{
          background: 'rgba(96, 168, 192, 0.1)',
          border: '1px dashed var(--secondary-horizon)',
          borderRadius: 'var(--radius-md)',
          padding: '0.55rem 0.75rem',
          marginBottom: '0.85rem'
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--secondary-horizon-hover)',
            marginBottom: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Sparkles size={12} />
          <span>Instant 1-Click Test Access</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="demo-btn"
            disabled={loading}
            onClick={() => handleDemoLogin('traveler')}
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <Compass size={13} />
            <span>Log in as Traveler</span>
          </button>
          <button
            type="button"
            className="demo-btn"
            disabled={loading}
            onClick={() => handleDemoLogin('admin')}
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <Shield size={13} />
            <span>Log in as Admin</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.55rem 0.75rem',
            background: '#fff1f0',
            border: '1px solid #ffccc7',
            borderRadius: 'var(--radius-md)',
            color: '#cf1322',
            fontSize: '0.825rem',
            marginBottom: '0.85rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Email Address</label>
          <div className="input-with-icon">
            <Mail className="input-icon-left" size={15} />
            <input
              type="email"
              className="form-input"
              style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.88rem' }}
              placeholder="traveler@pathpilot.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div className="input-with-icon">
            <Lock className="input-icon-left" size={15} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.88rem' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem', width: '100%', marginTop: '0.25rem' }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '0.85rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don't have an account yet?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-flare)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Create account
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
