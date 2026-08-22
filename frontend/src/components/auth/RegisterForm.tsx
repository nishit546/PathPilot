import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, MapPin, Phone, Info, Image as ImageIcon } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

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
    country: '',
    additionalInfo: '',
    profilePhoto: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations matching backend Zod schema
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
        additionalInfo: formData.additionalInfo.trim() || null,
        profilePhoto: formData.profilePhoto.trim() || null
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
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Join PathPilot to plan personalized multi-city trips
        </p>
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
            marginBottom: '0.85rem',
            lineHeight: 1.4
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.35rem' }}>
        {/* Name Fields (First + Last) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.825rem' }}>First Name *</label>
            <div className="input-with-icon">
              <User className="input-icon-left" size={16} />
              <input
                type="text"
                name="firstName"
                className="form-input"
                style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
                placeholder="Tapan"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.825rem' }}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
              placeholder="Traveler"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.825rem' }}>Email Address *</label>
          <div className="input-with-icon">
            <Mail className="input-icon-left" size={16} />
            <input
              type="email"
              name="email"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
              placeholder="traveler@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Password & Confirm */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.825rem' }}>Password (min 6) *</label>
            <div className="input-with-icon">
              <Lock className="input-icon-left" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.825rem' }}>Confirm *</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* City & Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.825rem' }}>City</label>
            <div className="input-with-icon">
              <MapPin className="input-icon-left" size={16} />
              <input
                type="text"
                name="city"
                className="form-input"
                style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
                placeholder="Mumbai"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.825rem' }}>Country</label>
            <input
              type="text"
              name="country"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
              placeholder="India"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.825rem' }}>Phone Number</label>
          <div className="input-with-icon">
            <Phone className="input-icon-left" size={16} />
            <input
              type="tel"
              name="phone"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Profile Photo URL */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.825rem' }}>Profile Photo URL</label>
          <div className="input-with-icon">
            <ImageIcon className="input-icon-left" size={16} />
            <input
              type="url"
              name="profilePhoto"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
              placeholder="https://images.unsplash.com/..."
              value={formData.profilePhoto}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Additional Info / Bio */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontSize: '0.825rem' }}>Additional Info / Travel Bio</label>
          <div className="input-with-icon">
            <Info className="input-icon-left" size={16} style={{ top: '1rem' }} />
            <textarea
              name="additionalInfo"
              className="form-input"
              rows={2}
              style={{ padding: '0.65rem 0.85rem 0.65rem 2.4rem', fontSize: '0.88rem', resize: 'none' }}
              placeholder="Tell us about your favorite travel destinations..."
              value={formData.additionalInfo}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
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
            fontSize: '0.9rem'
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
