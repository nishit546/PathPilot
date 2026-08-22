import React from 'react';
import { useTravel } from '../../context/TravelContext';
import { Trip } from '../../types';
import { Calendar, MapPin, DollarSign, ArrowRight, Trash2, Plus, Compass } from 'lucide-react';

interface PreviousTripsGridProps {
  onViewTrip?: (trip: Trip) => void;
  onEditItinerary?: (tripId: number | string) => void;
}

export const PreviousTripsGrid: React.FC<PreviousTripsGridProps> = ({ onViewTrip, onEditItinerary }) => {
  const { getFilteredTrips, deleteTrip, setIsCreateTripModalOpen } = useTravel();

  const filteredTrips = getFilteredTrips();

  const getStatusBadgeStyle = (status: string = 'UPCOMING') => {
    switch (status.toUpperCase()) {
      case 'ONGOING':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', label: '🟢 Ongoing' };
      case 'UPCOMING':
        return { bg: 'rgba(96, 168, 192, 0.15)', text: 'var(--secondary-horizon-hover)', border: 'rgba(96, 168, 192, 0.35)', label: '✈️ Upcoming' };
      case 'COMPLETED':
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)', label: '✓ Completed' };
      default:
        return { bg: 'rgba(144, 144, 144, 0.12)', text: '#64748b', border: 'rgba(144, 144, 144, 0.3)', label: 'Draft' };
    }
  };

  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${days} Days · ${Math.max(1, days - 1)} Nights`;
    } catch {
      return 'Multi-day';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section style={{ marginBottom: '4rem' }}>
      {/* Header with Horizontal Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
          Previous & Active Trips
        </h2>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-silver)' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip' : 'Trips'} Found
        </span>
      </div>

      {/* Empty State */}
      {filteredTrips.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-silver)',
            padding: '3.5rem 2rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary-flare-subtle)',
              color: 'var(--primary-flare)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <Compass size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Your next adventure starts here
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            No matching itineraries found. Plan your first multi-city trip and build your personalized itinerary.
          </p>
          <button
            className="btn-primary"
            style={{ width: 'auto', margin: '0 auto' }}
            onClick={() => setIsCreateTripModalOpen(true)}
          >
            <Plus size={16} />
            <span>+ Plan New Trip</span>
          </button>
        </div>
      ) : (
        /* Trips Card Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {filteredTrips.map(trip => {
            const statusInfo = getStatusBadgeStyle(trip.status);
            const routeCities = trip.sections?.map(s => s.city?.name).filter(Boolean) || [];
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
                onClick={() => onViewTrip && onViewTrip(trip)}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-silver)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  cursor: onViewTrip ? 'pointer' : 'default'
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
                {/* Top Cover Image with Overlay */}
                <div style={{ position: 'relative', height: '170px', overflow: 'hidden' }}>
                  <img
                    src={cover}
                    alt={trip.name || trip.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 100%)'
                    }}
                  />

                  {/* Status Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: statusInfo.bg,
                      color: statusInfo.text,
                      border: `1px solid ${statusInfo.border}`,
                      backdropFilter: 'blur(8px)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {statusInfo.label}
                  </div>

                  {/* Quick Delete Top Right */}
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${trip.name || trip.title}"?`)) {
                          deleteTrip(trip.id);
                        }
                      }}
                      title="Delete Trip"
                      style={{
                        padding: '0.35rem',
                        background: 'rgba(255,255,255,0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Date Range Overlay on Cover */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0.65rem',
                      left: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <Calendar size={14} />
                    <span>
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </span>
                    <span style={{ marginLeft: 'auto', opacity: 0.9 }}>
                      {calculateDays(trip.startDate, trip.endDate)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Trip Title */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {trip.name || trip.title}
                  </h3>

                  {/* Route Sequence Path */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.85rem'
                    }}
                  >
                    {routeCities.length > 0 ? (
                      routeCities.map((cityName, idx) => (
                        <React.Fragment key={idx}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              background: 'var(--secondary-horizon-subtle)',
                              color: 'var(--secondary-horizon-hover)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <MapPin size={11} />
                            {cityName}
                          </span>
                          {idx < routeCities.length - 1 && (
                            <span style={{ color: 'var(--muted-slate)', fontSize: '0.75rem' }}>→</span>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No destination stops added
                      </span>
                    )}
                  </div>

                  {/* Card Description */}
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}
                  >
                    {trip.description}
                  </p>

                  {/* Card Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f0f0f0',
                      paddingTop: '0.85rem',
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Budget:</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                        ₹{trip.totalBudget?.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditItinerary) onEditItinerary(trip.id);
                        else if (onViewTrip) onViewTrip(trip);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-flare)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>View Itinerary</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
