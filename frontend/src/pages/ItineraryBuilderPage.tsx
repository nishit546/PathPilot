import React, { useState, useEffect, useCallback } from 'react';
import { Trip, TripSection, TripDay, City, Activity, DayActivity } from '../types';
import { tripsApi } from '../api/tripsApi';
import { itineraryApi } from '../api/itineraryApi';
import { activitiesApi } from '../api/activitiesApi';
import { citiesApi } from '../api/citiesApi';
import { PageLoader } from '../components/common/PageLoader';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';
import {
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

interface ItineraryBuilderPageProps {
  tripId: number | string;
  onBack: () => void;
  onViewTripDetails: (tripId: number | string) => void;
}

export const ItineraryBuilderPage: React.FC<ItineraryBuilderPageProps> = ({
  tripId,
  onBack,
  onViewTripDetails
}) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);

  // Add Section Modal state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionCityId, setSectionCityId] = useState<number | string | null>(null);
  const [sectionStartDate, setSectionStartDate] = useState('');
  const [sectionEndDate, setSectionEndDate] = useState('');
  const [sectionBudget, setSectionBudget] = useState(30000);
  const [sectionNotes, setSectionNotes] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Add Activity Modal state
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [targetDay, setTargetDay] = useState<{ dayId: number | string; dayNumber: number; date: string } | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | string | null>(null);
  const [activityStartTime, setActivityStartTime] = useState('10:00');
  const [activityEndTime, setActivityEndTime] = useState('13:00');
  const [activityCost, setActivityCost] = useState<number>(2500);
  const [activityNotes, setActivityNotes] = useState('');
  const [activityError, setActivityError] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadTripData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tripRes, citiesRes, activitiesRes] = await Promise.all([
        tripsApi.getTripById(tripId),
        citiesApi.getCities({ limit: 50 }),
        activitiesApi.getActivities({ limit: 100 })
      ]);

      if (tripRes.success && tripRes.data?.trip) {
        setTrip(tripRes.data.trip);
      } else {
        setError('Trip not found or access denied.');
      }

      if (citiesRes.success) {
        const cList = Array.isArray(citiesRes.data) ? citiesRes.data : ((citiesRes.data as any)?.cities || []);
        setAvailableCities(cList);
      }
      if (activitiesRes.success) {
        const aList = Array.isArray(activitiesRes.data) ? activitiesRes.data : ((activitiesRes.data as any)?.activities || []);
        setAvailableActivities(aList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load itinerary.');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Open Add Section Modal
  const handleOpenAddSection = () => {
    if (!trip) return;
    setSectionStartDate(trip.startDate);
    setSectionEndDate(trip.endDate);
    setSectionBudget(Math.round(trip.totalBudget / 2));
    if (availableCities.length > 0) setSectionCityId(availableCities[0].id);
    setSectionNotes('');
    setSectionError('');
    setIsAddSectionOpen(true);
  };

  // Submit Section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionCityId) {
      setSectionError('Please select a destination city for this stop.');
      return;
    }
    if (!sectionStartDate || !sectionEndDate) {
      setSectionError('Please specify start and end dates.');
      return;
    }
    if (new Date(sectionStartDate) > new Date(sectionEndDate)) {
      setSectionError('Start date cannot be after end date.');
      return;
    }

    setIsSavingSection(true);
    setSectionError('');

    try {
      await tripsApi.createSection(tripId, {
        cityId: sectionCityId,
        startDate: sectionStartDate,
        endDate: sectionEndDate,
        budget: Number(sectionBudget),
        notes: sectionNotes.trim() || undefined
      });

      setIsAddSectionOpen(false);
      await loadTripData();
      showSuccess('Destination stop added successfully!');
    } catch (err: any) {
      setSectionError(err.message || 'Failed to add stop. Check that dates are within trip boundaries.');
    } finally {
      setIsSavingSection(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: number | string) => {
    if (!window.confirm('Are you sure you want to remove this stop and all scheduled activities for it?')) return;

    try {
      await itineraryApi.deleteSection(sectionId);
      await loadTripData();
      showSuccess('Stop removed from itinerary.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete stop.');
    }
  };

  // Open Add Activity Modal
  const handleOpenAddActivity = (day: TripDay) => {
    setTargetDay({ dayId: day.id, dayNumber: day.dayNumber, date: day.date });
    if (availableActivities.length > 0) {
      setSelectedActivityId(availableActivities[0].id);
      setActivityCost(availableActivities[0].estimatedCost || 2000);
    }
    setActivityStartTime('10:00');
    setActivityEndTime('13:00');
    setActivityNotes('');
    setActivityError('');
    setIsAddActivityOpen(true);
  };

  // Submit Activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDay || !selectedActivityId) return;

    if (activityStartTime >= activityEndTime) {
      setActivityError('End time must be later than start time.');
      return;
    }

    setIsSavingActivity(true);
    setActivityError('');

    try {
      await activitiesApi.assignDayActivity(targetDay.dayId, {
        activityId: selectedActivityId,
        startTime: activityStartTime,
        endTime: activityEndTime,
        customCost: Number(activityCost),
        notes: activityNotes.trim() || undefined
      });

      setIsAddActivityOpen(false);
      await loadTripData();
      showSuccess('Activity scheduled on itinerary!');
    } catch (err: any) {
      setActivityError(err.message || 'Activity time slot overlaps with another scheduled item. Please select a different time.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  // Delete Day Activity
  const handleDeleteActivity = async (dayActivityId: number | string) => {
    try {
      await activitiesApi.deleteDayActivity(dayActivityId);
      await loadTripData();
      showSuccess('Activity removed from schedule.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity.');
    }
  };

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  if (isLoading) {
    return <PageLoader message="Loading Trip Itinerary..." />;
  }

  if (error || !trip) {
    return <ErrorState message={error || 'Trip not found'} onRetry={loadTripData} />;
  }

  // Calculate live totals
  const totalAllocatedBudget = trip.sections?.reduce((sum, s) => sum + (s.budget || 0), 0) || 0;
  let totalScheduledActivities = 0;
  let totalActivityCost = 0;

  trip.sections?.forEach(sec => {
    sec.days?.forEach(d => {
      d.dayActivities?.forEach(a => {
        totalScheduledActivities++;
        totalActivityCost += (a.customCost || 0);
      });
    });
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
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
            onClick={handleOpenAddSection}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.88rem'
            }}
          >
            <Plus size={16} />
            <span>+ Add Destination Stop</span>
          </button>

          <button
            onClick={() => onViewTripDetails(trip.id)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.35rem',
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(255, 72, 0, 0.25)'
            }}
          >
            <CheckCircle size={16} />
            <span>Save & View Trip →</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
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
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle size={18} color="#52c41a" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Trip Hero Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {trip.visibility === 'PUBLIC' ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {trip.name || trip.title}
            </h1>
            {trip.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem', maxWidth: '750px' }}>
                {trip.description}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              background: 'var(--bg-canvas)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-silver)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                DATES
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {trip.startDate} → {trip.endDate}
              </span>
            </div>
            <div style={{ width: '1px', background: 'var(--border-silver)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                TOTAL BUDGET
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                ₹{trip.totalBudget?.toLocaleString() || '0'}
              </span>
            </div>
            <div style={{ width: '1px', background: 'var(--border-silver)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                ACTIVITIES
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--secondary-horizon)' }}>
                {totalScheduledActivities} Scheduled (₹{totalActivityCost.toLocaleString()})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Section Stops Manager */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Itinerary Stops & Scheduled Days
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Add destinations, schedule time slots, and manage day-by-day sightseeing
            </p>
          </div>
          <button
            onClick={handleOpenAddSection}
            className="btn-primary"
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={15} />
            <span>Add Stop</span>
          </button>
        </div>

        {(!trip.sections || trip.sections.length === 0) ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--border-silver)'
            }}
          >
            <MapPin size={40} color="var(--primary-flare)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              No stops added to this trip yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Add your first destination stop (e.g. Paris, Tokyo, Goa) to start scheduling days and activities.
            </p>
            <button
              onClick={handleOpenAddSection}
              className="btn-primary"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              + Add First Destination Stop
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
                  {/* Section City Header */}
                  <div
                    style={{
                      padding: '1.25rem 1.75rem',
                      background: 'linear-gradient(135deg, #181c20 0%, #2d3748 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-flare)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      >
                        {sIdx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                            {section.city?.name || `Destination #${sIdx + 1}`}
                          </h3>
                          <span style={{ fontSize: '0.85rem', color: 'var(--secondary-horizon)', fontWeight: 600 }}>
                            • {section.city?.country}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                          📅 {section.startDate} to {section.endDate} ({section.days?.length || 0} Days) | 💰 Allocated: ₹{section.budget?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      title="Remove this stop"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        color: '#ff7875',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Remove Stop</span>
                    </button>
                  </div>

                  {/* Section Days Schedule */}
                  <div style={{ padding: '1.5rem', background: '#fafafa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {section.days?.map(day => {
                        return (
                          <div
                            key={day.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-silver)',
                              boxShadow: 'var(--shadow-sm)',
                              padding: '1.15rem',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* Day Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #f0f0f0',
                                paddingBottom: '0.65rem',
                                marginBottom: '0.75rem'
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                  Day {day.dayNumber}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                  {day.date}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenAddActivity(day)}
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  background: 'var(--primary-flare-subtle)',
                                  border: '1px solid rgba(255, 72, 0, 0.25)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--primary-flare)',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Plus size={13} />
                                <span>Add Activity</span>
                              </button>
                            </div>

                            {/* Scheduled Day Activities */}
                            {(!day.dayActivities || day.dayActivities.length === 0) ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                No activities scheduled for this day yet.
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                {day.dayActivities.map(act => {
                                  return (
                                    <div
                                      key={act.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <div
                                          style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            color: 'var(--secondary-horizon)',
                                            background: 'var(--secondary-horizon-subtle)',
                                            padding: '0.2rem 0.45rem',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {act.startTime} - {act.endTime}
                                        </div>
                                        <div>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                                            {act.activity?.name || 'Activity'}
                                          </span>
                                          {act.notes && (
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                              {act.notes}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-flare)' }}>
                                          ₹{act.customCost?.toLocaleString()}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteActivity(act.id)}
                                          title="Delete Activity"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--muted-slate)',
                                            cursor: 'pointer',
                                            padding: '0.2rem',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Section Stop Modal */}
      <Modal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        title="Add Itinerary Stop"
        subtitle={`Select a destination city and stay dates within ${trip.startDate} to ${trip.endDate}`}
      >
        <form onSubmit={handleCreateSection}>
          {sectionError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                borderRadius: 'var(--radius-md)',
                color: '#cf1322',
                fontSize: '0.825rem',
                marginBottom: '1rem'
              }}
            >
              {sectionError}
            </div>
          )}

          {/* City Picker */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Destination City *</label>
            <select
              className="form-input"
              value={sectionCityId || ''}
              onChange={(e) => setSectionCityId(Number(e.target.value))}
              required
            >
              {availableCities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.country} ({city.region})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Arrival Date *</label>
              <input
                type="date"
                className="form-input"
                value={sectionStartDate}
                min={trip.startDate}
                max={trip.endDate}
                onChange={(e) => setSectionStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departure Date *</label>
              <input
                type="date"
                className="form-input"
                value={sectionEndDate}
                min={sectionStartDate || trip.startDate}
                max={trip.endDate}
                onChange={(e) => setSectionEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section Budget */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Allocated Stop Budget (₹)</label>
            <input
              type="number"
              step={1000}
              className="form-input"
              value={sectionBudget}
              onChange={(e) => setSectionBudget(Number(e.target.value))}
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Hotel / Transit Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Central Boutique Hotel, High-speed rail transfer"
              value={sectionNotes}
              onChange={(e) => setSectionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddSectionOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSavingSection}
            >
              {isSavingSection ? 'Adding Stop...' : 'Add Stop & Auto-Generate Days'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Activity Modal */}
      <Modal
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        title="Schedule Day Activity"
        subtitle={targetDay ? `Scheduling for Day ${targetDay.dayNumber} (${targetDay.date})` : 'Schedule Activity'}
      >
        <form onSubmit={handleCreateActivity}>
          {activityError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                borderRadius: 'var(--radius-md)',
                color: '#cf1322',
                fontSize: '0.825rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertTriangle size={16} />
              <span>{activityError}</span>
            </div>
          )}

          {/* Activity Selector */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Select Activity *</label>
            <select
              className="form-input"
              value={selectedActivityId || ''}
              onChange={(e) => {
                const actId = Number(e.target.value);
                setSelectedActivityId(actId);
                const found = availableActivities.find(a => a.id === actId);
                if (found) setActivityCost(found.estimatedCost || 2000);
              }}
              required
            >
              {availableActivities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.name} ({act.category}) — ₹{act.estimatedCost?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot (Start & End) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="time"
                className="form-input"
                value={activityStartTime}
                onChange={(e) => setActivityStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="time"
                className="form-input"
                value={activityEndTime}
                onChange={(e) => setActivityEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Custom Cost */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Estimated / Custom Cost (₹)</label>
            <input
              type="number"
              step={100}
              className="form-input"
              value={activityCost}
              onChange={(e) => setActivityCost(Number(e.target.value))}
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Booking / Reservation Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Fast-track entry reserved, Meet at main gate"
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddActivityOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSavingActivity}
            >
              {isSavingActivity ? 'Scheduling...' : 'Schedule Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
