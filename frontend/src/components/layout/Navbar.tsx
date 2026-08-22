import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTravel } from '../../context/TravelContext';
import { Logo } from '../common/Logo';
import {
  Globe,
  MapPin,
  Compass,
  Calendar,
  Users,
  Shield,
  ChevronDown,
  Bell,
  Plane,
  Check,
  User,
  Settings,
  Heart,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  iconType: 'trip' | 'explore' | 'community';
  read: boolean;
  tabTarget?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Upcoming Trip Reminder',
    message: "Your upcoming journey starts soon! Check your itinerary & packing list.",
    time: '10m ago',
    iconType: 'trip',
    read: false,
    tabTarget: 'trips'
  },
  {
    id: 'n2',
    title: 'Explore Recommendations',
    message: 'Discover 25+ top attractions and hidden gems in Tokyo & Paris.',
    time: '2h ago',
    iconType: 'explore',
    read: false,
    tabTarget: 'explore'
  },
  {
    id: 'n3',
    title: 'Community Interaction',
    message: 'Travelers shared 3 new curated itineraries this week.',
    time: '1d ago',
    iconType: 'community',
    read: false,
    tabTarget: 'community'
  }
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', label: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', label: 'British Pound' }
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, logout } = useAuth();
  const { setIsCreateTripModalOpen } = useTravel();

  // Dropdown states
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected Currency (persisted in localStorage)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem('pathpilot_currency') || currentUser?.currency || 'INR';
  });

  // Notifications State with localStorage persistence
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('pathpilot_read_notifications');
      if (stored) {
        const readIds = JSON.parse(stored) as string[];
        return INITIAL_NOTIFICATIONS.map(n => ({
          ...n,
          read: readIds.includes(n.id)
        }));
      }
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Persist read notification IDs
  const persistReadNotifications = (items: NotificationItem[]) => {
    try {
      const readIds = items.filter(n => n.read).map(n => n.id);
      localStorage.setItem('pathpilot_read_notifications', JSON.stringify(readIds));
    } catch {
      // ignore
    }
  };

  // Automatically mark notification as read when user visits that tab
  useEffect(() => {
    setNotifications(prev => {
      let changed = false;
      const updated = prev.map(n => {
        const matchesTab =
          n.tabTarget === activeTab ||
          (n.tabTarget === 'trips' && (activeTab === 'trip-details' || activeTab === 'itinerary'));

        if (matchesTab && !n.read) {
          changed = true;
          return { ...n, read: true };
        }
        return n;
      });

      if (changed) {
        persistReadNotifications(updated);
        return updated;
      }
      return prev;
    });
  }, [activeTab]);

  // Click on a notification item
  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === item.id ? { ...n, read: true } : n));
      persistReadNotifications(updated);
      return updated;
    });

    if (item.tabTarget) {
      onSelectTab(item.tabTarget);
    }
    setIsNotificationsOpen(false);
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistReadNotifications(updated);
      return updated;
    });
  };

  // Refs for click outside
  const currencyRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin';

  // For Admin: remove traveler tabs completely; for Traveler: standard tabs
  const navItems = isAdmin
    ? []
    : [
        { id: 'dashboard', label: 'Dashboard', icon: Globe },
        { id: 'trips', label: 'My Trips', icon: MapPin },
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'community', label: 'Community', icon: Users }
      ];

  // Handle currency selection
  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    localStorage.setItem('pathpilot_currency', code);
    setIsCurrencyOpen(false);
  };

  // Handle Escape key and outside clicks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCurrencyOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setIsCurrencyOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentCurrencyObj = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-silver)',
        padding: '0.65rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease'
      }}
    >
      <div
        style={{
          maxWidth: '1350px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        {/* ======================================================== */}
        {/* LEFT: Brand Logo & Title */}
        {/* ======================================================== */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => {
            onSelectTab(isAdmin ? 'admin' : 'dashboard');
            setIsMobileMenuOpen(false);
          }}
        >
          <Logo size={40} />
          <div>
            <span
              style={{
                fontSize: '1.3rem',
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
            <span style={{ fontSize: '0.68rem', color: isAdmin ? 'var(--primary-flare)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin Portal' : 'Travel Platform'}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER: Navigation Links (Desktop) */}
        {/* ======================================================== */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          {isAdmin ? (
            /* Dedicated Admin Portal Center Indicator */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 1.15rem',
                background: 'var(--primary-flare-subtle)',
                border: '1px solid rgba(255, 72, 0, 0.25)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Shield size={16} color="var(--primary-flare)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                System Administration & Governance
              </span>
            </div>
          ) : (
            /* Traveler Navigation Tabs */
            navItems.map(item => {
              const Icon = item.icon;
              const isTabActive =
                activeTab === item.id ||
                (item.id === 'trips' && (activeTab === 'trip-details' || activeTab === 'itinerary'));

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`nav-tab-btn ${isTabActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isTabActive ? 'var(--primary-flare-subtle)' : 'transparent',
                    color: isTabActive ? 'var(--primary-flare)' : 'var(--text-secondary)',
                    fontWeight: isTabActive ? 700 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {isTabActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '20%',
                        right: '20%',
                        height: '2.5px',
                        background: 'var(--primary-flare)',
                        borderRadius: '2px'
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </nav>

        {/* ======================================================== */}
        {/* RIGHT: Currency, Notifications, CTA Button, Profile Menu */}
        {/* ======================================================== */}
        <div
          className="desktop-nav"
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}
        >
          {/* CURRENCY SELECTOR (Travelers only) */}
          {!isAdmin && (
            <div ref={currencyRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsCurrencyOpen(prev => !prev)}
                aria-label="Select Currency"
                aria-expanded={isCurrencyOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.42rem 0.65rem',
                  background: isCurrencyOpen ? 'rgba(96, 168, 192, 0.2)' : 'var(--secondary-horizon-subtle)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(96, 168, 192, 0.35)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--secondary-horizon)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{currentCurrencyObj.flag}</span>
                <span>{currentCurrencyObj.code} ({currentCurrencyObj.symbol})</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: isCurrencyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* Currency Dropdown Panel */}
              {isCurrencyOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '180px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-silver)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.35rem',
                    zIndex: 150,
                    animation: 'fadeInSlide 0.15s ease-out'
                  }}
                >
                  {CURRENCIES.map(curr => {
                    const isSelected = curr.code === selectedCurrency;
                    return (
                      <button
                        key={curr.code}
                        role="menuitem"
                        onClick={() => handleCurrencySelect(curr.code)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          background: isSelected ? 'var(--secondary-horizon-subtle)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: isSelected ? 'var(--secondary-horizon)' : 'var(--text-primary)',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = '#f7f7f7';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span>{curr.flag}</span>
                          <span>{curr.code} ({curr.symbol})</span>
                        </div>
                        {isSelected && <Check size={14} color="var(--secondary-horizon)" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATION BELL WITH LIVE UNREAD BADGE & DROPDOWN */}
          {!isAdmin && (
            <div ref={notificationsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isNotificationsOpen ? '#f0f0f0' : 'transparent',
                  border: '1px solid var(--border-silver)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => {
                  if (!isNotificationsOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--primary-flare)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 5px rgba(255, 72, 0, 0.3)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-silver)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.75rem',
                    zIndex: 150,
                    animation: 'fadeInSlide 0.15s ease-out'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: '0.5rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-flare)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          padding: '0.55rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: item.read ? 'transparent' : 'rgba(255, 72, 0, 0.05)',
                          borderLeft: item.read ? '3px solid transparent' : '3px solid var(--primary-flare)',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '0.65rem',
                          alignItems: 'flex-start',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = item.read ? '#f9f9f9' : 'rgba(255, 72, 0, 0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = item.read ? 'transparent' : 'rgba(255, 72, 0, 0.05)')}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: item.read ? '#f0f0f0' : 'var(--primary-flare-subtle)',
                            color: item.read ? 'var(--text-muted)' : 'var(--primary-flare)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.1rem'
                          }}
                        >
                          {item.iconType === 'trip' && <Plane size={14} />}
                          {item.iconType === 'explore' && <Compass size={14} />}
                          {item.iconType === 'community' && <Users size={14} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: item.read ? 600 : 800, color: 'var(--text-primary)' }}>
                              {item.title}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                            {item.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRIMARY CTA: "+ Plan a Trip" (Travelers only) */}
          {!isAdmin && (
            <button
              className="btn-primary"
              onClick={() => setIsCreateTripModalOpen(true)}
              style={{
                width: 'auto',
                padding: '0.48rem 1.05rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(255, 72, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Plane size={15} style={{ transform: 'rotate(-45deg)' }} />
              <span>+ Plan a trip</span>
            </button>
          )}

          {/* PROFILE DROPDOWN: [Avatar] User / Admin */}
          {currentUser && (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                aria-label="User profile menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.22rem 0.55rem 0.22rem 0.22rem',
                  background: activeTab === 'profile' ? 'var(--primary-flare-subtle)' : isProfileOpen ? '#eaeaea' : '#f2f2f2',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${activeTab === 'profile' ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'profile' ? '0 0 0 2px rgba(255, 72, 0, 0.15)' : 'none'
                }}
              >
                <img
                  src={currentUser.avatar || currentUser.profilePhoto || (isAdmin ? 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9' : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4')}
                  alt={currentUser.name}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: '#ffffff',
                    border: '1px solid var(--border-silver)'
                  }}
                />
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: activeTab === 'profile' ? 'var(--primary-flare)' : 'var(--text-primary)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {currentUser.name}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'var(--text-secondary)',
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* Profile Dropdown Panel */}
              {isProfileOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '210px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-silver)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.45rem',
                    zIndex: 150,
                    animation: 'fadeInSlide 0.15s ease-out'
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: '0.5rem 0.65rem 0.65rem 0.65rem',
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.email}
                    </div>
                    <span
                      style={{
                        marginTop: '0.35rem',
                        display: 'inline-block',
                        padding: '0.1rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        background: isAdmin ? 'var(--primary-flare-subtle)' : 'var(--secondary-horizon-subtle)',
                        color: isAdmin ? 'var(--primary-flare)' : 'var(--secondary-horizon)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}
                    >
                      {currentUser.role || 'TRAVELER'}
                    </span>
                  </div>

                  {/* Options */}
                  {isAdmin ? (
                    <button
                      role="menuitem"
                      onClick={() => {
                        onSelectTab('admin');
                        setIsProfileOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: '0.5rem 0.65rem',
                        background: activeTab === 'admin' ? 'var(--primary-flare-subtle)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: activeTab === 'admin' ? 'var(--primary-flare)' : 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Shield size={15} />
                      <span>Admin Dashboard</span>
                    </button>
                  ) : (
                    <>
                      <button
                        role="menuitem"
                        onClick={() => {
                          onSelectTab('profile');
                          setIsProfileOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.5rem 0.65rem',
                          background: activeTab === 'profile' ? 'var(--primary-flare-subtle)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: activeTab === 'profile' ? 'var(--primary-flare)' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <User size={15} />
                        <span>My Profile</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          onSelectTab('trips');
                          setIsProfileOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          padding: '0.5rem 0.65rem',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <Heart size={15} />
                        <span>Saved Trips</span>
                      </button>
                    </>
                  )}

                  <div style={{ height: '1px', background: '#f0f0f0', margin: '0.35rem 0' }} />

                  {/* Red Hover Logout Button */}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.5rem 0.65rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#d9381e',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ff4d4f';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#d9381e';
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MOBILE MENU TOGGLE (Travelers only) */}
        {/* ======================================================== */}
        {!isAdmin && (
          <div className="mobile-menu-toggle" style={{ display: 'none' }}>
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              style={{
                background: '#f2f2f2',
                border: '1px solid var(--border-silver)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MOBILE DRAWER (Travelers only) */}
      {/* ======================================================== */}
      {isMobileMenuOpen && !isAdmin && (
        <div
          className="mobile-drawer"
          style={{
            borderTop: '1px solid var(--border-silver)',
            marginTop: '0.65rem',
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'fadeInSlide 0.2s ease-out'
          }}
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isTabActive =
              activeTab === item.id ||
              (item.id === 'trips' && (activeTab === 'trip-details' || activeTab === 'itinerary'));

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isTabActive ? 'var(--primary-flare-subtle)' : 'transparent',
                  color: isTabActive ? 'var(--primary-flare)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'var(--border-silver)', margin: '0.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {CURRENCIES.map(curr => (
                <button
                  key={curr.code}
                  onClick={() => handleCurrencySelect(curr.code)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    borderRadius: '4px',
                    border: selectedCurrency === curr.code ? '1.5px solid var(--secondary-horizon)' : '1px solid var(--border-silver)',
                    background: selectedCurrency === curr.code ? 'var(--secondary-horizon-subtle)' : '#ffffff',
                    color: selectedCurrency === curr.code ? 'var(--secondary-horizon)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {curr.flag} {curr.code}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#d9381e',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                borderRadius: '4px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ff4d4f';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#d9381e';
              }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
