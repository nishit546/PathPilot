import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, AdminAnalytics } from '../types';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/common/PageLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  Shield,
  Users,
  MapPin,
  DollarSign,
  Activity,
  Lock,
  Unlock,
  Search,
  TrendingUp,
  CheckCircle,
  PieChart as PieIcon,
  BarChart2,
  LineChart as LineIcon
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getUsers({ limit: 50 })
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (usersRes.success) {
        const uList = Array.isArray(usersRes.data) ? usersRes.data : ((usersRes.data as any)?.users || []);
        setUsers(uList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load admin dashboard. Admin privileges required.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleBlock = async (userId: number | string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await adminApi.unblockUser(userId);
        setActionSuccess('User successfully unblocked!');
      } else {
        await adminApi.blockUser(userId);
        setActionSuccess('User account blocked from platform access.');
      }
      await loadAdminData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'admin') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <Shield size={48} color="#cf1322" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#cf1322', marginBottom: '0.5rem' }}>
          Access Forbidden
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This administrative control center is restricted to authorized PathPilot Administrators.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader message="Loading Platform Analytics & Intelligence..." />;
  }

  if (error || !analytics) {
    return <ErrorState message={error || 'Failed to load admin center.'} onRetry={loadAdminData} />;
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      !userSearch ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.firstName && u.firstName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.lastName && u.lastName.toLowerCase().includes(userSearch.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role.toUpperCase() === roleFilter.toUpperCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'blocked' && u.isBlocked) ||
      (statusFilter === 'active' && !u.isBlocked);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate Pie Chart Angles from tripStatusDistribution
  const statusDist = analytics.tripStatusDistribution || {};
  const statusTotal = Object.values(statusDist).reduce((sum, v) => sum + v, 0) || 1;
  const statusColors: Record<string, string> = {
    PLANNING: '#94a3b8',
    UPCOMING: 'var(--secondary-horizon)',
    ONGOING: '#10b981',
    COMPLETED: 'var(--primary-flare)'
  };

  // Find max visit count for bar chart
  const maxCityVisits = Math.max(...(analytics.topCities?.map(c => c.visitCount) || [1]), 1);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <Shield size={26} color="var(--primary-flare)" />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            System Admin & Platform Intelligence
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Real-time metrics, user governance, destination trends, and interactive analytics charts
        </p>
      </div>

      {actionSuccess && (
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
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL USERS</span>
            <Users size={18} color="var(--primary-flare)" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.overview.totalUsers}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#52c41a', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {analytics.overview.activeUsers} Active Accounts
          </span>
        </div>

        <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TRIPS CREATED</span>
            <MapPin size={18} color="var(--secondary-horizon)" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.overview.totalTrips}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
            {analytics.overview.publicTrips} Shared Publicly
          </span>
        </div>

        <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL DESTINATIONS</span>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.overview.totalCities} Cities
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
            {analytics.overview.totalActivities} Discoverable Activities
          </span>
        </div>

        <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>EXPENSE VOLUME</span>
            <DollarSign size={18} color="#52c41a" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
            ₹{analytics.overview.totalExpenseAmount?.toLocaleString() || '0'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
            {analytics.overview.totalExpensesLogged} Tracked Items
          </span>
        </div>
      </div>

      {/* ANALYTICS CHARTS SECTION (Pie, Bar, Line) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* 1. Pie Chart: Trip Status Distribution */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PieIcon size={18} color="var(--primary-flare)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Trip Status Breakdown (Pie View)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
            {/* SVG Pie Chart */}
            <svg width="140" height="140" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
              {(() => {
                let accumulatedPercent = 0;
                return Object.entries(statusDist).map(([status, count]) => {
                  const percent = (count / statusTotal) * 100;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = -accumulatedPercent;
                  accumulatedPercent += percent;
                  return (
                    <circle
                      key={status}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={statusColors[status] || '#cbd5e1'}
                      strokeWidth="6"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                });
              })()}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {Object.entries(statusDist).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: statusColors[status] || '#cbd5e1' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{status}:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{count} ({Math.round((count / statusTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Bar Chart: Top Destination Cities Leaderboard */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BarChart2 size={18} color="var(--secondary-horizon)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Top Cities Leaderboard (Bar View)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics.topCities?.slice(0, 4).map(city => {
              const widthPercent = Math.max(15, Math.round((city.visitCount / maxCityVisits) * 100));
              return (
                <div key={city.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{city.name}, {city.country}</span>
                    <span style={{ fontWeight: 800, color: 'var(--secondary-horizon)' }}>{city.visitCount} visits</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${widthPercent}%`,
                        background: 'var(--secondary-horizon)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Line Chart / Monthly Trends */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <LineIcon size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Platform Growth Trends (Line/Monthly)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '110px', paddingTop: '10px' }}>
            {analytics.monthlyTrends?.map(item => (
              <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <div
                  style={{
                    width: '24px',
                    height: `${Math.max(20, item.tripsCreated * 18)}px`,
                    background: 'linear-gradient(to top, #8b5cf6, #c084fc)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`${item.tripsCreated} Trips Created`}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Expense Volume Category Distribution */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-silver)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <DollarSign size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Expense Category Breakdown
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {((analytics as any).categoryBreakdown || [
              { category: 'accommodation', amount: 3499738, percentage: 48 },
              { category: 'transport', amount: 1476552, percentage: 20 },
              { category: 'activity', amount: 733147, percentage: 10 },
              { category: 'shopping', amount: 685330, percentage: 9 },
              { category: 'food', amount: 641678, percentage: 9 }
            ]).slice(0, 5).map((cat: any) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat.category}</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>₹{Number(cat.amount).toLocaleString()} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(5, cat.percentage)}%`,
                      background: 'linear-gradient(to right, #10b981, #34d399)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Governance Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              User Accounts & Access Management
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Inspect user roles, account statuses, and manage access
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="input-with-icon" style={{ width: '220px' }}>
              <Search className="input-icon-left" size={16} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.85rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                placeholder="Search name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <select
              className="form-input"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="USER">Traveler (USER)</option>
              <option value="ADMIN">Administrator</option>
            </select>

            <select
              className="form-input"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-silver)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>User</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Email</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>
                      {u.firstName || ''} {u.lastName || ''} {isCurrent && '(You)'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: u.role === 'ADMIN' ? 'var(--primary-flare-subtle)' : 'var(--secondary-horizon-subtle)',
                          color: u.role === 'ADMIN' ? 'var(--primary-flare)' : 'var(--secondary-horizon)',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: u.isBlocked ? '#fff1f0' : '#e6f7eb',
                          color: u.isBlocked ? '#cf1322' : '#135200',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      {!isCurrent && (
                        <button
                          onClick={() => handleToggleBlock(u.id, !!u.isBlocked)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: `1px solid ${u.isBlocked ? '#52c41a' : '#ff4d4f'}`,
                            background: 'transparent',
                            color: u.isBlocked ? '#52c41a' : '#ff4d4f',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {u.isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
