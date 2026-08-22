import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { calendarApi } from '../api/calendarApi';
import { PageLoader } from '../components/common/PageLoader';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';

interface CalendarViewPageProps {
  onViewTrip?: (trip: Trip) => void;
}

export const CalendarViewPage: React.FC<CalendarViewPageProps> = ({ onViewTrip }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for backend

  useEffect(() => {
    setIsLoading(true);
    calendarApi
      .getCalendar({ month, year })
      .then(res => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data.trips || res.data.events || []);
          setTrips(list);
        }
      })
      .catch(err => console.warn('Calendar fetch:', err))
      .finally(() => setIsLoading(false));
  }, [month, year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
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

        {/* Month Picker Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-silver)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <button
            onClick={handlePrevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '150px', textAlign: 'center' }}>
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <ChevronRight size={20} />
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
              gridAutoRows: 'minmax(110px, auto)'
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

              // Find trips covering this date
              const dayTrips = trips.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);

              return (
                <div
                  key={dayNum}
                  style={{
                    borderRight: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {dayNum}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayTrips.map(trip => (
                      <div
                        key={trip.id}
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
                          textOverflow: 'ellipsis'
                        }}
                        title={trip.name || trip.title}
                      >
                        ✈️ {trip.name || trip.title}
                      </div>
                    ))}
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
