import React, { useState, useEffect, useCallback } from 'react';
import { Trip, TripExpense, BudgetBreakdown } from '../types';
import { tripsApi } from '../api/tripsApi';
import { expensesApi } from '../api/expensesApi';
import { PageLoader } from '../components/common/PageLoader';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Share2,
  Edit3,
  Trash2,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Copy,
  Clock,
  PieChart,
  Globe,
  Lock,
  Receipt
} from 'lucide-react';

interface TripDetailsPageProps {
  tripId: number | string;
  onBack: () => void;
  onEditItinerary: (tripId: number | string) => void;
}

export const TripDetailsPage: React.FC<TripDetailsPageProps> = ({
  tripId,
  onBack,
  onEditItinerary
}) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'expenses' | 'budget'>('schedule');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Expense modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('ACTIVITIES');
  const [expenseAmount, setExpenseAmount] = useState<number>(3000);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadAllTripData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tripRes, expensesRes, budgetRes] = await Promise.all([
        tripsApi.getTripById(tripId),
        tripsApi.getTripExpenses(tripId),
        tripsApi.getTripBudget(tripId)
      ]);

      if (tripRes.success && tripRes.data?.trip) {
        setTrip(tripRes.data.trip);
      } else {
        setError('Trip not found or access denied.');
      }

      if (expensesRes.success) {
        const expList = Array.isArray(expensesRes.data)
          ? expensesRes.data
          : (expensesRes.data?.expenses || []);
        setExpenses(expList);
      }
      if (budgetRes.success && budgetRes.data) {
        setBudget(budgetRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadAllTripData();
  }, [loadAllTripData]);

  // Handle Add Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) return;
    if (!expenseDesc.trim()) return;

    setIsSavingExpense(true);
    try {
      await tripsApi.createExpense(tripId, {
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDesc.trim(),
        date: expenseDate || trip?.startDate || undefined
      });

      setIsAddExpenseOpen(false);
      setExpenseDesc('');
      await loadAllTripData();
    } catch (err: any) {
      alert(err.message || 'Failed to log expense.');
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId: number | string) => {
    try {
      await expensesApi.deleteExpense(expenseId);
      await loadAllTripData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  // Handle Generate Share Link
  const handleShareClick = async () => {
    setIsShareModalOpen(true);
    setIsGeneratingShare(true);
    try {
      const res = await tripsApi.shareTrip(tripId);
      if (res.success && res.data?.shareToken) {
        const fullUrl = `${window.location.origin}/shared/${res.data.shareToken}`;
        setShareUrl(fullUrl);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate share link.');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  if (isLoading) {
    return <PageLoader message="Loading Trip Details & Budget..." />;
  }

  if (error || !trip) {
    return <ErrorState message={error || 'Trip details could not be loaded.'} onRetry={loadAllTripData} />;
  }

  const durationDays = Math.max(
    1,
    Math.ceil(
      ((trip.endDate ? new Date(trip.endDate).getTime() : Date.now()) -
        (trip.startDate ? new Date(trip.startDate).getTime() : Date.now())) /
        (1000 * 60 * 60 * 24)
    ) + 1
  ) || 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Top Breadcrumb & Action Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.95rem',
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Trips</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleShareClick}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.88rem'
            }}
          >
            <Share2 size={16} />
            <span>Share Trip</span>
          </button>

          <button
            onClick={() => onEditItinerary(trip.id)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.25rem',
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(255, 72, 0, 0.25)'
            }}
          >
            <Edit3 size={16} />
            <span>Edit Itinerary Builder</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  background: 'var(--primary-flare-subtle)',
                  color: 'var(--primary-flare)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                {trip.status || 'UPCOMING'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {trip.visibility === 'PUBLIC' ? <Globe size={15} color="var(--primary-flare)" /> : <Lock size={15} color="var(--text-muted)" />}
                <span>{trip.visibility === 'PUBLIC' ? 'Public Community Post' : 'Private Journey'}</span>
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {trip.name || trip.title}
            </h1>
            {trip.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '780px' }}>
                {trip.description}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              background: 'var(--bg-canvas)',
              padding: '0.9rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-silver)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                DURATION
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {durationDays} Days ({trip.startDate} → {trip.endDate})
              </span>
            </div>
            <div style={{ width: '1px', background: 'var(--border-silver)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                BUDGET
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                ₹{trip.totalBudget?.toLocaleString()}
              </span>
            </div>
            <div style={{ width: '1px', background: 'var(--border-silver)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                TOTAL SPENT
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: (budget?.isOverBudget ? '#cf1322' : 'var(--secondary-horizon)') }}>
                ₹{budget?.totalSpent?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-silver)',
          marginBottom: '1.75rem'
        }}
      >
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'schedule' ? '3px solid var(--primary-flare)' : '3px solid transparent',
            color: activeTab === 'schedule' ? 'var(--primary-flare)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'schedule' ? 800 : 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Calendar size={17} />
          <span>Day-by-Day Itinerary ({trip.sections?.length || 0} Stops)</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expenses' ? '3px solid var(--primary-flare)' : '3px solid transparent',
            color: activeTab === 'expenses' ? 'var(--primary-flare)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'expenses' ? 800 : 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Receipt size={17} />
          <span>Expense Tracker ({expenses.length} Logged)</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'budget' ? '3px solid var(--primary-flare)' : '3px solid transparent',
            color: activeTab === 'budget' ? 'var(--primary-flare)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'budget' ? 800 : 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <DollarSign size={17} />
          <span>Live Budget Breakdown & Charts</span>
        </button>
      </div>

      {/* TAB 1: ITINERARY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div>
          {(!trip.sections || trip.sections.length === 0) ? (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-silver)'
              }}
            >
              <MapPin size={36} color="var(--primary-flare)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                No stops added to this itinerary yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Use the Itinerary Builder to add destination stops, days, and activities.
              </p>
              <button
                onClick={() => onEditItinerary(trip.id)}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Launch Itinerary Builder
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {trip.sections.map((section, sIdx) => {
                return (
                  <div
                    key={section.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-silver)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem 1.5rem',
                        background: 'var(--bg-canvas)',
                        borderBottom: '1px solid var(--border-silver)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--primary-flare)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}
                        >
                          {sIdx + 1}
                        </span>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {section.city?.name || `Stop #${sIdx + 1}`}, {section.city?.country}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {section.startDate} → {section.endDate} ({section.days?.length || 0} Days) | Stop Budget: ₹{section.budget?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {section.days?.map(day => (
                        <div
                          key={day.id}
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: '#fafafa',
                            border: '1px solid #eeeeee'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              Day {day.dayNumber} — {day.date}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {day.dayActivities?.length || 0} Activities
                            </span>
                          </div>

                          {(!day.dayActivities || day.dayActivities.length === 0) ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Free exploration day (No scheduled activities).
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {day.dayActivities.map(act => (
                                <div
                                  key={act.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.55rem 0.85rem',
                                    background: '#ffffff',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-silver)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        color: 'var(--secondary-horizon)',
                                        background: 'var(--secondary-horizon-subtle)',
                                        padding: '0.2rem 0.45rem',
                                        borderRadius: '4px'
                                      }}
                                    >
                                      {act.startTime} - {act.endTime}
                                    </span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {act.activity?.name}
                                    </span>
                                    {act.notes && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ({act.notes})
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-flare)' }}>
                                    ₹{act.customCost?.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPENSES TRACKER */}
      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Trip Expenses Log
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Track hotels, meals, transport, and leisure costs in real-time
              </p>
            </div>
            <button
              onClick={() => {
                setExpenseDate(trip.startDate);
                setIsAddExpenseOpen(true);
              }}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.15rem',
                fontSize: '0.88rem'
              }}
            >
              <Plus size={16} />
              <span>+ Log Expense</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-silver)'
              }}
            >
              <DollarSign size={36} color="var(--primary-flare)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                No expenses logged yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Log hotel stays, flight bookings, meals, and tickets to monitor your budget.
              </p>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Log First Expense
              </button>
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-silver)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-silver)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>{exp.description}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--secondary-horizon-subtle)',
                            color: 'var(--secondary-horizon)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)' }}>{exp.date}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                        ₹{exp.amount?.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4d4f',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUDGET BREAKDOWN & CHARTS */}
      {activeTab === 'budget' && (
        <div>
          {budget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Budget Progress Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-silver)',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Budget Utilization</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: (budget.isOverBudget ? '#cf1322' : 'var(--primary-flare)') }}>
                    {budget.percentageUsed}% Used
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '14px',
                    borderRadius: 'var(--radius-full)',
                    background: '#f0f0f0',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(budget.percentageUsed, 100)}%`,
                      background: budget.isOverBudget ? '#cf1322' : 'var(--primary-flare)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#fafafa', borderRadius: 'var(--radius-md)', border: '1px solid #eeeeee' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>TOTAL BUDGET</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{budget.totalBudget?.toLocaleString()}</span>
                  </div>
                  <div style={{ padding: '1rem', background: '#fafafa', borderRadius: 'var(--radius-md)', border: '1px solid #eeeeee' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>TOTAL EXPENDITURE</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: budget.isOverBudget ? '#cf1322' : 'var(--primary-flare)' }}>₹{budget.totalSpent?.toLocaleString()}</span>
                  </div>
                  <div style={{ padding: '1rem', background: '#fafafa', borderRadius: 'var(--radius-md)', border: '1px solid #eeeeee' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>REMAINING BUDGET</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: budget.remainingBudget >= 0 ? '#52c41a' : '#cf1322' }}>₹{budget.remainingBudget?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {budget.categoryBreakdown && Object.keys(budget.categoryBreakdown).length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-silver)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                    Category Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {Object.entries(budget.categoryBreakdown).map(([cat, amount]) => (
                      <div
                        key={cat}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-silver)'
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary-horizon)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {cat}
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginTop: '0.25rem' }}>
                          ₹{amount?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Log Trip Expense"
        subtitle={`Record an expenditure for ${trip.name}`}
      >
        <form onSubmit={handleCreateExpense}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Expense Description *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Hotel reservation, Express rail tickets, Dinner"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                <option value="STAY">Stay / Hotel</option>
                <option value="TRANSPORT">Transport / Transit</option>
                <option value="ACTIVITIES">Activities & Tours</option>
                <option value="MEALS">Meals & Dining</option>
                <option value="SHOPPING">Shopping</option>
                <option value="OTHER">Other Expenses</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step={500}
                min={1}
                className="form-input"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={expenseDate}
              min={trip.startDate}
              max={trip.endDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddExpenseOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSavingExpense}
            >
              {isSavingExpense ? 'Saving...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Your Trip Itinerary"
        subtitle="Anyone with this public read-only link can view your itinerary and fork it to their account."
      >
        {isGeneratingShare ? (
          <PageLoader message="Generating Public Share Link..." />
        ) : (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Public Shareable Link</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={shareUrl}
                  style={{ background: '#f8fafc', cursor: 'text' }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Copy size={16} />
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'var(--secondary-horizon-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}
            >
              <strong>Read-Only Protection:</strong> Visitors to this link cannot modify your trip or add expenses. They can view the day schedule and copy it to their personal PathPilot account.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
