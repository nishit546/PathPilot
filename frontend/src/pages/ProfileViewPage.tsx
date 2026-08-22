import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { Trip } from '../types';
import { PageLoader } from '../components/common/PageLoader';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  CheckCircle,
  Edit3,
  Calendar,
  DollarSign,
  ArrowRight,
  Compass,
  PlaneTakeoff
} from 'lucide-react';

interface ProfileViewPageProps {
  onViewTrip?: (trip: Trip) => void;
  onEditItinerary?: (tripId: number | string) => void;
}

export const ProfileViewPage: React.FC<ProfileViewPageProps> = ({ onViewTrip, onEditItinerary }) => {
  const { currentUser, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Trips under profile
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [tripFilter, setTripFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || currentUser.name?.split(' ')[0] || '');
      setLastName(currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '');
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || '');
      setCountry(currentUser.country || '');
      setAdditionalInfo(currentUser.additionalInfo || currentUser.bio || '');
      setProfilePhoto(currentUser.profilePhoto || '');
    }
  }, [currentUser]);

  useEffect(() => {
    setIsLoadingTrips(true);
    userApi
      .getProfileTrips()
      .then(res => {
        if (res.success && res.data?.trips) {
          setUserTrips(res.data.trips);
        }
      })
      .catch(err => console.warn('Profile trips fetch:', err))
      .finally(() => setIsLoadingTrips(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        additionalInfo: additionalInfo.trim() || null,
        profilePhoto: profilePhoto.trim() || null
      });
      await refreshUser();
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return <PageLoader message="Loading profile..." />;
  }

  const filteredTrips = userTrips.filter(t => {
    if (tripFilter === 'all') return true;
    return t.status?.toLowerCase() === tripFilter.toLowerCase();
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Traveler Profile & Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Manage your personal account details, travel preferences, and preplanned trips
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: '#e6f7eb',
            border: '1px solid #b7ebc5',
            borderRadius: 'var(--radius-md)',
            color: '#135200',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle size={18} color="#52c41a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          marginBottom: '2.5rem'
        }}
      >
        {/* Banner Top */}
        <div style={{ height: '110px', background: 'linear-gradient(135deg, #181c20 0%, #2d3748 100%)' }} />

        {/* Profile Avatar & Details Bar */}
        <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '-50px',
              marginBottom: '1.5rem'
            }}
          >
            <img
              src={currentUser.avatar || currentUser.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
              alt={currentUser.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #ffffff',
                boxShadow: 'var(--shadow-md)',
                background: '#ffffff'
              }}
            />

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? 'btn-secondary' : 'btn-primary'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                fontSize: '0.88rem'
              }}
            >
              <Edit3 size={15} />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>
          </div>

          {!isEditing ? (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {currentUser.name}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      background: 'var(--secondary-horizon-subtle)',
                      color: 'var(--secondary-horizon)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}
                  >
                    Role: {currentUser.role}
                  </span>
                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      background: 'var(--primary-flare-subtle)',
                      color: 'var(--primary-flare)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    {userTrips.length} Total Journeys
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-silver)',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Mail size={18} color="var(--primary-flare)" />
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>EMAIL</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{currentUser.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Phone size={18} color="var(--secondary-horizon)" />
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>PHONE</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{currentUser.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <MapPin size={18} color="#52c41a" />
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>LOCATION</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {currentUser.city && currentUser.country ? `${currentUser.city}, ${currentUser.country}` : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.additionalInfo && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.35rem' }}>Travel Bio</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                    {currentUser.additionalInfo}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Cartoon Avatar Picker */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Choose Traveler Avatar
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.65rem' }}>
                  {[
                    { id: '1', name: 'Alex', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4' },
                    { id: '2', name: 'Sam', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden&backgroundColor=ffdfbf' },
                    { id: '3', name: 'Maya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=c0aede' },
                    { id: '4', name: 'Leo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9' },
                    { id: '5', name: 'Chloe', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=ffd5dc' }
                  ].map(av => {
                    const isSel = profilePhoto === av.url;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setProfilePhoto(av.url)}
                        style={{
                          background: isSel ? 'var(--primary-flare-subtle)' : '#ffffff',
                          border: isSel ? '2.5px solid var(--primary-flare)' : '1.5px solid var(--border-silver)',
                          borderRadius: '12px',
                          padding: '0.35rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSel ? '0 4px 10px rgba(255, 72, 0, 0.2)' : 'none',
                          transform: isSel ? 'scale(1.05)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img src={av.url} alt={av.name} style={{ width: '44px', height: '44px', borderRadius: '8px' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Travel Bio</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Preplanned & Previous Trips Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              My Preplanned & Past Journeys
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Quick access to your travel history and upcoming itineraries
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTripFilter(f.id as any)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${tripFilter === f.id ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                  background: tripFilter === f.id ? 'var(--primary-flare)' : 'transparent',
                  color: tripFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: tripFilter === f.id ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingTrips ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading trips...</p>
        ) : filteredTrips.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-silver)',
              textAlign: 'center'
            }}
          >
            <PlaneTakeoff size={32} color="var(--primary-flare)" style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              No trips found in this category.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredTrips.map(trip => (
              <div
                key={trip.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-silver)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-flare-subtle)',
                        color: 'var(--primary-flare)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {trip.status || 'UPCOMING'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                      ₹{trip.totalBudget?.toLocaleString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {trip.name || trip.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <Calendar size={13} />
                    <span>{trip.startDate} → {trip.endDate}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' }}>
                  {onEditItinerary && (
                    <button
                      onClick={() => onEditItinerary(trip.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-silver)',
                        borderRadius: '4px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Itinerary
                    </button>
                  )}
                  {onViewTrip && (
                    <button
                      onClick={() => onViewTrip(trip)}
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
