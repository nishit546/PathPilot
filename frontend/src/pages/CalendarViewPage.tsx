import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { calendarApi } from '../api/calendarApi';
import { PageLoader } from '../components/common/PageLoader';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Plane } from 'lucide-react';

interface CalendarViewPageProps {
  onViewTrip?: (trip: Trip) => void;
}

export const CalendarViewPage: React.FC<CalendarViewPageProps> = ({ onViewTrip }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Today reference for highlighting
  const realToday = new Date();
  const todayYear = realToday.getFullYear();
  const todayMonth = realToday.getMonth() + 1; // 1-indexed (1-12)
  const todayDay = realToday.getDate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for backend

  useEffect(() => {
    setIsLoading(true);
    calendarApi
      .getCalendar({ month, year })
      .then(res => {
        if (res.success && res.data) {
          const rawList = Array.isArray(res.data)
            ? res.data
            : (res.data.trips || res.data.events || []);

          // Normalize dates and IDs
          const normalized = rawList.map((t: any) => ({
            ...t,
            id: t.id ?? t.tripId ?? 0,
            title: t.name || t.title || 'Trip Itinerary',
            startDate: typeof t.startDate === 'string' ? t.startDate.split('T')[0] : '',
            endDate: typeof t.endDate === 'string' ? t.endDate.split('T')[0] : ''
          }));
          setTrips(normalized);
        } else {
          setTrips([]);
        }
      })
      .catch(err => {
        console.warn('Calendar fetch:', err);
        setTrips([]);
      })
      .finally(() => setIsLoading(false));
  }, [month, year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar days grid calculation
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
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
            Travel Calendar
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Interactive month overview mapping scheduled departures and multi-city sections
          </p>
        </div>

        {/* Month Picker Controls + Today Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#ffffff',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-silver)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <button
            onClick={handlePrevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-primary)' }}
            aria-label="Previous Month"
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, minWidth: '145px', textAlign: 'center', color: 'var(--text-primary)' }}>
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-primary)' }}
            aria-label="Next Month"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={handleToday}
            className="btn-secondary"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.78rem', marginLeft: '0.25rem' }}
          >
            Today
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Loading Scheduled Trips..." />
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-silver)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Day Names Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: 'var(--bg-canvas)',
              borderBottom: '1px solid var(--border-silver)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.75rem 0'
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ color: 'var(--text-secondary)' }}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: 'minmax(115px, auto)'
            }}
          >
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} style={{ background: '#fbfbfb', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              // Exact Today match
              const isToday = year === todayYear && month === todayMonth && dayNum === todayDay;

              // Find trips covering this date
              const dayTrips = trips.filter(t => {
                if (!t.startDate || !t.endDate) return false;
                return t.startDate <= dateStr && t.endDate >= dateStr;
              });

              return (
                <div
                  key={dayNum}
                  style={{
                    borderRight: isToday ? '2px solid var(--primary-flare)' : '1px solid #f0f0f0',
                    borderBottom: isToday ? '2px solid var(--primary-flare)' : '1px solid #f0f0f0',
                    borderLeft: isToday ? '2px solid var(--primary-flare)' : 'none',
                    borderTop: isToday ? '2px solid var(--primary-flare)' : 'none',
                    padding: '0.55rem',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isToday
                      ? 'rgba(255, 72, 0, 0.05)'
                      : dayTrips.length > 0
                      ? 'rgba(255, 72, 0, 0.02)'
                      : '#ffffff',
                    position: 'relative',
                    boxShadow: isToday ? 'inset 0 0 0 1px var(--primary-flare)' : 'none'
                  }}
                >
                  {/* Day Header Row with Today highlight */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isToday ? 900 : 700,
                        color: isToday ? '#ffffff' : 'var(--text-primary)',
                        background: isToday ? 'var(--primary-flare)' : 'transparent',
                        width: isToday ? '24px' : 'auto',
                        height: isToday ? '24px' : 'auto',
                        borderRadius: isToday ? '50%' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isToday ? '0 2px 6px rgba(255, 72, 0, 0.4)' : 'none'
                      }}
                    >
                      {dayNum}
                    </span>

                    {isToday && (
                      <span
                        style={{
                          padding: '0.1rem 0.45rem',
                          background: 'var(--primary-flare)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayTrips.map(trip => {
                      const tId = trip.id || (trip as any).tripId;
                      const title = trip.name || trip.title || 'Trip Itinerary';
                      return (
                        <div
                          key={tId || title}
                          onClick={() => onViewTrip && onViewTrip(trip)}
                          style={{
                            padding: '0.25rem 0.45rem',
                            background: 'var(--primary-flare-subtle)',
                            border: '1px solid rgba(255, 72, 0, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--primary-flare)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title={title}
                        >
                          <Plane size={11} />
                          <span>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarViewPage;
