import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, Compass } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [role, setRole] = useState<UserRole>('traveler');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultAvatar = role === 'admin'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <img
          src={defaultAvatar}
          alt="User profile"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2.5px solid var(--primary-flare)',
            boxShadow: '0 4px 12px rgba(255, 72, 0, 0.2)',
            background: '#ffffff'
          }}
        />

        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
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
          marginBottom: '1rem',
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
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.88rem' }}
        >
          <Compass size={16} />
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
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.88rem' }}
        >
          <Shield size={16} />
          <span>Admin</span>
        </button>
      </div>

      {/* 1-Click Instant Demo Login */}
      <div
        style={{
          background: 'rgba(96, 168, 192, 0.1)',
          border: '1px dashed var(--secondary-horizon)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--secondary-horizon-hover)',
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Sparkles size={13} />
          <span>Instant 1-Click Test Access</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="demo-btn"
            disabled={loading}
            onClick={() => handleDemoLogin('traveler')}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', flex: 1 }}
          >
            ⚡ Log in as Traveler
          </button>
          <button
            type="button"
            className="demo-btn"
            disabled={loading}
            onClick={() => handleDemoLogin('admin')}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', flex: 1 }}
          >
            🛡️ Log in as Admin
          </button>
        </div>
      </div>

      <div className="form-divider" style={{ margin: '0.75rem 0', fontSize: '0.75rem' }}>
        Or sign in with email credentials
      </div>

      {error && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            background: '#fff1f0',
            border: '1px solid #ffccc7',
            borderRadius: 'var(--radius-md)',
            color: '#cf1322',
            fontSize: '0.85rem',
            marginBottom: '0.75rem',
            lineHeight: 1.4
          }}
        >
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '0.85rem' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
          <div className="input-with-icon">
            <Mail className="input-icon-left" size={18} />
            <input
              type="email"
              className="form-input"
              style={{ padding: '0.75rem 1rem 0.75rem 2.75rem', fontSize: '0.925rem' }}
              placeholder="e.g. traveler@pathpilot.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Password</label>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--secondary-horizon)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={() => alert('Demo Credentials:\nTraveler: traveler@pathpilot.com / Password123!\nAdmin: admin@pathpilot.com / AdminPassword123!')}
            >
              Demo credentials?
            </button>
          </div>
          <div className="input-with-icon">
            <Lock className="input-icon-left" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input has-right-icon"
              style={{ padding: '0.75rem 2.75rem 0.75rem 2.75rem', fontSize: '0.925rem' }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Login to PathPilot'}
        </button>
      </form>

      <div style={{ marginTop: '1.15rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-flare)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Sign up now
        </button>
      </div>
    </div>
  );
};
