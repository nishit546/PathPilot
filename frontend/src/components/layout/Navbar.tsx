import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTravel } from '../../context/TravelContext';
import { Compass, Plus, Globe, MapPin, Search, Calendar, Users, Shield, User, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, logout } = useAuth();
  const { setIsCreateTripModalOpen } = useTravel();

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Globe },
    { id: 'trips', label: 'My Trips', icon: MapPin },
    { id: 'explore', label: 'Explore', icon: Search },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : [])
  ];

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-silver)',
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
          onClick={() => onSelectTab('dashboard')}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-flare)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(255, 72, 0, 0.25)'
            }}
          >
            <Compass size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                display: 'block'
              }}
            >
              PathPilot
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Travel Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: active ? 'var(--primary-flare-subtle)' : 'transparent',
                  color: active ? 'var(--primary-flare)' : 'var(--text-secondary)',
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Currency Pill */}
        <div
          style={{
            padding: '0.35rem 0.75rem',
            background: 'var(--secondary-horizon-subtle)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(96, 168, 192, 0.3)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--secondary-horizon)'
          }}
        >
          {currentUser?.currency || 'INR'} (₹)
        </div>

        {/* Plan a Trip CTA Button */}
        <button
          className="btn-primary"
          style={{
            width: 'auto',
            padding: '0.5rem 1.1rem',
            fontSize: '0.88rem',
            boxShadow: '0 4px 14px rgba(255, 72, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          onClick={() => setIsCreateTripModalOpen(true)}
        >
          <Plus size={16} />
          <span>+ Plan a trip</span>
        </button>

        {/* User Profile Pill & Logout */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.25rem 0.65rem 0.25rem 0.25rem',
              background: '#f2f2f2',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-silver)'
            }}
          >
            <img
              src={currentUser.avatar || currentUser.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
              alt={currentUser.name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#ffffff',
                border: '1px solid var(--border-silver)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--secondary-horizon)', fontWeight: 700, textTransform: 'uppercase' }}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Log Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted-slate)',
                cursor: 'pointer',
                padding: '0.2rem',
                marginLeft: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
