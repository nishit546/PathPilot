import React, { useState } from 'react';
import { useAuth, CARTOON_AVATARS } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, FileText, Camera } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register } = useAuth();
  const [avatar, setAvatar] = useState(CARTOON_AVATARS[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        name: `${firstName} ${lastName}`.trim(),
        email,
        avatar,
        role: 'traveler',
        phone,
        city,
        country,
        currency: 'INR',
        bio: additionalInfo || 'Ready for multi-city discoveries!',
        travelInterests: ['Sightseeing', 'Adventure', 'Food']
      });
      if (onSuccess) onSuccess();
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form-wrapper" style={{ width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Header & Avatar Selection Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Create Account
          </h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Traveler Profile</span>
        </div>

        {/* Compact Avatar Circles Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {CARTOON_AVATARS.map((imgUrl, idx) => (
            <div
              key={idx}
              className={`avatar-option ${avatar === imgUrl ? 'selected' : ''}`}
              onClick={() => setAvatar(imgUrl)}
              style={{ width: '36px', height: '36px', background: '#ffffff', cursor: 'pointer' }}
              title={`Character ${idx + 1}`}
            >
              <img src={imgUrl} alt={`Avatar ${idx + 1}`} />
            </div>
          ))}
        </div>
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
            marginBottom: '0.5rem'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: First Name & Last Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>First Name *</label>
            <div className="input-with-icon">
              <User className="input-icon-left" size={15} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.65rem 0.55rem 2.25rem', fontSize: '0.85rem' }}
                placeholder="Tapan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Last Name</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
              placeholder="Traveler"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: Email & Phone Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Address *</label>
            <div className="input-with-icon">
              <Mail className="input-icon-left" size={15} />
              <input
                type="email"
                className="form-input"
                style={{ padding: '0.55rem 0.65rem 0.55rem 2.25rem', fontSize: '0.85rem' }}
                placeholder="tapan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone</label>
            <div className="input-with-icon">
              <Phone className="input-icon-left" size={15} />
              <input
                type="tel"
                className="form-input"
                style={{ padding: '0.55rem 0.65rem 0.55rem 2.25rem', fontSize: '0.85rem' }}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Row 3: City & Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>City</label>
            <div className="input-with-icon">
              <MapPin className="input-icon-left" size={15} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.65rem 0.55rem 2.25rem', fontSize: '0.85rem' }}
                placeholder="Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Country</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        {/* Row 4: Additional Info (Compact Single Line) */}
        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={13} color="var(--secondary-horizon)" />
            <span>Additional Info / Travel Style</span>
          </label>
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
            placeholder="e.g. Multi-city explorer, heritage sights, scenic routes"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        {/* Row 5: Passwords */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Password *</label>
            <div className="input-with-icon">
              <Lock className="input-icon-left" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input has-right-icon"
                style={{ padding: '0.55rem 2.1rem 0.55rem 2.1rem', fontSize: '0.85rem' }}
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm Password *</label>
            <div className="input-with-icon">
              <Lock className="input-icon-left" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ padding: '0.55rem 0.65rem 0.55rem 2.1rem', fontSize: '0.85rem' }}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Register Account'}
        </button>
      </form>

      <div style={{ marginTop: '0.65rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
          Sign in instead
        </button>
      </div>
    </div>
  );
};
