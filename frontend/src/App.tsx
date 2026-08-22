import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Compass, LogOut, Plus, Search, MapPin, Calendar, DollarSign, Sparkles, User, Globe, ChevronRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'trips' | 'calendar' | 'budget'>('dashboard');

  if (!isAuthenticated || !currentUser) {
    return <AuthPage onAuthSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--border-silver)',
          padding: '0.85rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-flare)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Compass size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                PathPilot
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Globe },
              { id: 'trips', label: 'My Trips', icon: MapPin },
              { id: 'explore', label: 'Explore Cities & Activities', icon: Search },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'budget', label: 'Budget', icon: DollarSign },
            ].map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: active ? 'var(--primary-flare-subtle)' : 'transparent',
                    color: active ? 'var(--primary-flare)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
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

        {/* Right User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            style={{
              padding: '0.55rem 1.1rem',
              background: 'var(--primary-flare)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 72, 0, 0.25)'
            }}
            onClick={() => alert('Trip Planner creation step will open in next phase!')}
          >
            <Plus size={16} />
            <span>+ Plan a trip</span>
          </button>

          {/* User Profile Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.35rem 0.65rem 0.35rem 0.35rem',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-silver)'
            }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{currentUser.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-horizon)', fontWeight: 600, textTransform: 'capitalize' }}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={logout}
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
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Welcome Hero Banner (Wireframe Screen 3) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 246, 248, 0.9)), url("https://www.tripit.com/sites/tripit/files/acn/2022-06/illu-homepage-hero.svg") right center no-repeat',
            backgroundSize: 'contain',
            border: '1px solid var(--border-silver)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            marginBottom: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ maxWidth: '650px' }}>
            <div className="brand-pill" style={{ marginBottom: '0.75rem' }}>
              <Sparkles size={14} />
              <span>Personalized Multi-City Planner</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
              Good morning, {currentUser.name} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Ready to design your next multi-city journey? Organize travel stops, assign daily activities, compute budgets automatically, and share unforgettable itineraries.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                onClick={() => alert('Opening Create Trip modal...')}
              >
                <Plus size={18} />
                <span>+ Plan a trip</span>
              </button>
              <button
                className="btn-secondary"
                style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
                onClick={() => setActiveTab('explore')}
              >
                <Search size={16} />
                <span>Explore Top Regions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Notification of Successful Step 1 Completion */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-silver)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              ✅ Step 1: Login & Registration Portal Successfully Implemented!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Equipped with the 40/60 split layout, custom color palette, demo accounts, and authentication state management.
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-silver)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <LogOut size={16} />
            <span>Test Logout / Switch Account</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
