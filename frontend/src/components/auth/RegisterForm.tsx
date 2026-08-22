import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, MapPin, Phone, Check, Sparkles } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export const CARTOON_AVATARS = [
  {
    id: 'avatar-1',
    name: 'Alex',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4'
  },
  {
    id: 'avatar-2',
    name: 'Sam',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden&backgroundColor=ffdfbf'
  },
  {
    id: 'avatar-3',
    name: 'Maya',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=c0aede'
  },
  {
    id: 'avatar-4',
    name: 'Leo',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9'
  },
  {
    id: 'avatar-5',
    name: 'Chloe',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=ffd5dc'
  }
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    country: ''
  });

  const [selectedAvatar, setSelectedAvatar] = useState<string>(CARTOON_AVATARS[0].url);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters.');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ok = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        profilePhoto: selectedAvatar
      });

      if (ok && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form-wrapper" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '0.85rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '0.15rem' }}>
          Pick your cartoon avatar and start planning
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '0.45rem 0.75rem',
            background: '#fff1f0',
            border: '1px solid #ffccc7',
            borderRadius: 'var(--radius-md)',
            color: '#cf1322',
            fontSize: '0.8rem',
            marginBottom: '0.65rem',
            lineHeight: 1.3
          }}
        >
          {error}
        </div>
      )}

      {/* No-Scroll Compact Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {/* 1. Cartoon Avatar Bar (Compact 5 items) */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border-silver)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Avatar
          </span>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {CARTOON_AVATARS.map(avatar => {
              const isSelected = selectedAvatar === avatar.url;
              return (
                <button
                  type="button"
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  title={avatar.name}
                  style={{
                    background: isSelected ? 'var(--primary-flare-subtle)' : '#ffffff',
                    border: isSelected ? '2px solid var(--primary-flare)' : '1px solid var(--border-silver)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    padding: '2px',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 2px 8px rgba(255, 72, 0, 0.3)' : 'none',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--primary-flare)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Check size={9} strokeWidth={3.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. First Name & Last Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>First Name *</label>
            <input
              type="text"
              name="firstName"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* 3. Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="traveler@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Phone</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="+91 98765..."
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 4. Password & Confirm Password */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Password (min 6) *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Confirm *</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* 5. City & Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>City</label>
            <input
              type="text"
              name="city"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Country</label>
            <input
              type="text"
              name="country"
              className="form-input"
              style={{ padding: '0.48rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="e.g. India"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem', width: '100%', marginTop: '0.35rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>

      <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-flare)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
