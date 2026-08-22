import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { User as UserIcon, Lock, Eye, EyeOff, Sparkles, Shield, Compass } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [role, setRole] = useState<UserRole>('traveler');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic Cartoon Photo display based on role / username
  const currentPhoto = role === 'admin' 
    ? DEMO_USERS.admin.avatar 
    : (username.toLowerCase().includes('admin') ? DEMO_USERS.admin.avatar : DEMO_USERS.traveler.avatar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(username, password, role);
      if (onSuccess) onSuccess();
    } catch {
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type: 'traveler' | 'admin') => {
    quickLogin(type);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="login-form-wrapper" style={{ width: '100%' }}>
      {/* 1. Photo Avatar Display Header (Clean circle without camera badge) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <img
          src={currentPhoto}
          alt="User profile"
          style={{
            width: '64px',
            height: '64px',
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

      {/* Role Switcher (Traveler vs Admin) */}
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
          onClick={() => setRole('traveler')}
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.88rem' }}
        >
          <Compass size={16} />
          <span>Traveler</span>
        </button>
        <button
          type="button"
          className={`role-tab-btn ${role === 'admin' ? 'active' : ''}`}
          onClick={() => setRole('admin')}
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.88rem' }}
        >
          <Shield size={16} />
          <span>Admin</span>
        </button>
      </div>

      {/* 1-Click Quick Demo Login */}
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
          <span>Instant 1-Click Demo Login</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('traveler')}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}
          >
            ⚡ Log in as Traveler
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('admin')}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}
          >
            🛡️ Log in as Admin
          </button>
        </div>
      </div>

      <div className="form-divider" style={{ margin: '0.75rem 0', fontSize: '0.75rem' }}>
        Or sign in with username
      </div>

      {error && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: '#fff1f0',
            border: '1px solid #ffccc7',
            borderRadius: 'var(--radius-md)',
            color: '#cf1322',
            fontSize: '0.825rem',
            marginBottom: '0.75rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Login Form Fields: Username, Password, Login Button */}
      <form onSubmit={handleSubmit}>
        {/* Username Field with Placeholder */}
        <div className="form-group" style={{ marginBottom: '0.85rem' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Username</label>
          <div className="input-with-icon">
            <UserIcon className="input-icon-left" size={18} />
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.75rem 1rem 0.75rem 2.75rem', fontSize: '0.925rem' }}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Password Field */}
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
              onClick={() => alert('Demo Mode: Click "⚡ Log in as Traveler" above for instant access!')}
            >
              Forgot password?
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--primary-flare)', width: '15px', height: '15px' }}
            />
            Remember session
          </label>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Login to PathPilot'}
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
