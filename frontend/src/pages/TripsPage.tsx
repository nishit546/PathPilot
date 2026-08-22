import React, { useState } from 'react';
import { useTravel } from '../context/TravelContext';
import { Trip } from '../types';
import { PageLoader } from '../components/common/PageLoader';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import {
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Trash2,
  Share2,
  Compass
} from 'lucide-react';

interface TripsPageProps {
  onViewTrip: (trip: Trip) => void;
  onEditItinerary: (tripId: number | string) => void;
  onPlanNewTrip: () => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({
  onViewTrip,
  onEditItinerary,
  onPlanNewTrip
}) => {
  const {
    trips,
    isLoadingTrips,
    tripsError,
    fetchTrips,
    deleteTrip,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    getFilteredTrips
  } = useTravel();

  const [deletingTripId, setDeletingTripId] = useState<number | string | null>(null);

  const filteredTrips = getFilteredTrips();

  const handleDelete = async (e: React.MouseEvent, tripId: number | string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip itinerary?')) return;
    setDeletingTripId(tripId);
    try {
      await deleteTrip(tripId);
    } finally {
      setDeletingTripId(null);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return '1 Day';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return `${days} Days / ${days - 1} Nights`;
  };

  if (isLoadingTrips && trips.length === 0) {
    return <PageLoader message="Loading your travel itineraries..." />;
  }

  if (tripsError) {
    return <ErrorState message={tripsError} onRetry={fetchTrips} />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            My Travel Itineraries
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Manage, edit, and organize all your upcoming and past personalized multi-city journeys
          </p>
        </div>

        <button
          onClick={onPlanNewTrip}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.35rem',
            fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(255, 72, 0, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>+ Plan a New Trip</span>
        </button>
      </div>

      {/* Toolbar: Status Tabs + Search + Sort */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Trips' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'ongoing', label: 'Ongoing' },
            { id: 'completed', label: 'Completed' },
            { id: 'planning', label: 'Draft' }
          ].map(tab => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${active ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                  background: active ? 'var(--primary-flare)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ width: '220px' }}>
            <Search className="input-icon-left" size={16} />
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.5rem 0.85rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
              placeholder="Search by city or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              className="form-input"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date-desc">Newest Departure</option>
              <option value="date-asc">Earliest Departure</option>
              <option value="budget-desc">Highest Budget</option>
              <option value="duration-desc">Longest Duration</option>
              <option value="name-asc">Trip Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Grid View */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={<Compass size={32} />}
          title="No travel itineraries found"
          description={
            searchQuery
              ? `No journeys match your filter "${searchQuery}". Try clearing your search keywords.`
              : 'You haven\'t planned any trips in this category yet. Start your next adventure now!'
          }
          actionText="+ Plan a New Trip"
          onAction={onPlanNewTrip}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {filteredTrips.map(trip => {
            const duration = calculateDuration(trip.startDate, trip.endDate);
            const defaultParis = '1502602898657-3e91760cbb34';
            const rawCover = trip.coverImage || (trip as any).coverPhoto || (trip as any).cover_image_url;
            let cover = rawCover && !rawCover.includes(defaultParis) ? rawCover : null;

            if (!cover && trip.sections && trip.sections.length > 0) {
              for (const sec of trip.sections) {
                if (sec.city?.imageUrl) { cover = sec.city.imageUrl; break; }
                if ((sec.city as any)?.image) { cover = (sec.city as any).image; break; }
              }
            }

            if (!cover) {
              const text = `${trip.title || trip.name || ''} ${trip.description || ''}`.toLowerCase();
              if (text.includes('jaipur') || text.includes('rajasthan')) cover = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('goa')) cover = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('delhi')) cover = 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('manali')) cover = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('kashi') || text.includes('varanasi')) cover = 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('tokyo') || text.includes('japan')) cover = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80';
              else if (text.includes('dubai')) cover = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80';
              else {
                const fallbackList = [
                  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'
                ];
                let sum = 0;
                const keyStr = String(trip.id || trip.title || 'trip');
                for (let i = 0; i < keyStr.length; i++) sum += keyStr.charCodeAt(i);
                cover = fallbackList[sum % fallbackList.length];
              }
            }

            return (
              <div
                key={trip.id}
                onClick={() => onViewTrip(trip)}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-silver)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Cover Image & Badges */}
                <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={cover}
                    alt={trip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        background: 'rgba(24, 28, 32, 0.75)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: 'var(--radius-full)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {trip.status || 'UPCOMING'}
                    </span>

                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      ₹{trip.totalBudget?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem',
                      lineHeight: 1.2
                    }}
                  >
                    {trip.name || trip.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {trip.description || 'Personalized multi-stop itinerary.'}
                  </p>

                  {/* Dates & Duration */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <Calendar size={14} color="var(--primary-flare)" />
                    <span style={{ fontWeight: 600 }}>{trip.startDate} → {trip.endDate}</span>
                    <span style={{ color: 'var(--text-muted)' }}>• {duration}</span>
                  </div>

                  {/* Destination stops tags */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem', flex: 1 }}>
                    {trip.sections && trip.sections.length > 0 ? (
                      trip.sections.map(sec => (
                        <span
                          key={sec.id}
                          style={{
                            padding: '0.2rem 0.55rem',
                            background: 'var(--secondary-horizon-subtle)',
                            color: 'var(--secondary-horizon)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          📍 {sec.city?.name || 'City'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No destination stops added
                      </span>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f0f0f0',
                      paddingTop: '0.85rem'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItinerary(trip.id);
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'none',
                        border: '1px solid var(--border-silver)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Itinerary</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <button
                        onClick={(e) => handleDelete(e, trip.id)}
                        disabled={deletingTripId === trip.id}
                        style={{
                          padding: '0.4rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete Trip"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
