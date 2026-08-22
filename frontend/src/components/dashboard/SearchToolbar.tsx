import React, { useState } from 'react';
import { useTravel, GroupByOption, SortByOption } from '../../context/TravelContext';
import { Search, SlidersHorizontal, Layers, ArrowUpDown, X, Check } from 'lucide-react';

export const SearchToolbar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    selectedRegion,
    setSelectedRegion
  } = useTravel();

  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const groupOptions: { value: GroupByOption; label: string }[] = [
    { value: 'none', label: 'None (Default)' },
    { value: 'status', label: 'By Trip Status' },
    { value: 'region', label: 'By Geographic Region' },
    { value: 'year', label: 'By Departure Year' }
  ];

  const sortOptions: { value: SortByOption; label: string }[] = [
    { value: 'date-desc', label: 'Departure Date (Latest First)' },
    { value: 'date-asc', label: 'Departure Date (Earliest First)' },
    { value: 'budget-desc', label: 'Budget (Highest to Lowest)' },
    { value: 'duration-desc', label: 'Duration (Longest First)' },
    { value: 'name-asc', label: 'Trip Title (A – Z)' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Trips' },
    { value: 'ongoing', label: 'Ongoing Only' },
    { value: 'upcoming', label: 'Upcoming Only' },
    { value: 'completed', label: 'Completed Only' }
  ];

  const hasActiveFilters = statusFilter !== 'all' || selectedRegion !== null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        background: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-silver)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        position: 'relative'
      }}
    >
      {/* 1. Universal Search Bar Input */}
      <div style={{ flex: '1 1 320px', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={18}
          style={{ position: 'absolute', left: '1rem', color: 'var(--muted-slate)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          className="form-input"
          style={{
            padding: '0.65rem 2.5rem 0.65rem 2.75rem',
            fontSize: '0.92rem',
            background: '#fafafa',
            borderColor: searchQuery ? 'var(--primary-flare)' : 'var(--border-silver)'
          }}
          placeholder="Search destinations, multi-city trips, or stops (e.g. Paris, Tokyo, Europe)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '0.85rem',
              background: 'none',
              border: 'none',
              color: 'var(--muted-slate)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 2. Group by Dropdown Button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setIsGroupOpen(!isGroupOpen);
            setIsFilterOpen(false);
            setIsSortOpen(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1rem',
            background: groupBy !== 'none' ? 'var(--secondary-horizon-subtle)' : '#ffffff',
            border: `1px solid ${groupBy !== 'none' ? 'var(--secondary-horizon)' : 'var(--border-silver)'}`,
            borderRadius: 'var(--radius-md)',
            color: groupBy !== 'none' ? 'var(--secondary-horizon-hover)' : 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Layers size={16} />
          <span>Group by: {groupOptions.find(o => o.value === groupBy)?.label.split(' ')[0]}</span>
        </button>

        {isGroupOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: '200px',
              background: '#ffffff',
              border: '1px solid var(--border-silver)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              padding: '0.4rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.35rem 0.65rem' }}>
              GROUP TRIPS BY
            </div>
            {groupOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setGroupBy(opt.value);
                  setIsGroupOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: groupBy === opt.value ? 'var(--secondary-horizon-subtle)' : 'transparent',
                  color: groupBy === opt.value ? 'var(--secondary-horizon-hover)' : 'var(--text-primary)',
                  fontWeight: groupBy === opt.value ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{opt.label}</span>
                {groupBy === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Filter Dropdown Button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            setIsGroupOpen(false);
            setIsSortOpen(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1rem',
            background: hasActiveFilters ? 'var(--primary-flare-subtle)' : '#ffffff',
            border: `1px solid ${hasActiveFilters ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
            borderRadius: 'var(--radius-md)',
            color: hasActiveFilters ? 'var(--primary-flare)' : 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Filter {hasActiveFilters && '•'}</span>
        </button>

        {isFilterOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: '220px',
              background: '#ffffff',
              border: '1px solid var(--border-silver)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              padding: '0.6rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              TRIP STATUS
            </div>
            {statusOptions.map(st => (
              <button
                key={st.value}
                onClick={() => {
                  setStatusFilter(st.value);
                  setIsFilterOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.45rem 0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: statusFilter === st.value ? 'var(--primary-flare-subtle)' : 'transparent',
                  color: statusFilter === st.value ? 'var(--primary-flare)' : 'var(--text-primary)',
                  fontWeight: statusFilter === st.value ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{st.label}</span>
                {statusFilter === st.value && <Check size={14} />}
              </button>
            ))}

            {hasActiveFilters && (
              <div style={{ borderTop: '1px solid var(--border-silver)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSelectedRegion(null);
                    setIsFilterOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-flare)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Sort by Dropdown Button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsGroupOpen(false);
            setIsFilterOpen(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1rem',
            background: '#ffffff',
            border: '1px solid var(--border-silver)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowUpDown size={16} />
          <span>Sort by...</span>
        </button>

        {isSortOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: '240px',
              background: '#ffffff',
              border: '1px solid var(--border-silver)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              padding: '0.4rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.35rem 0.65rem' }}>
              SORT ORDER
            </div>
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  setIsSortOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: sortBy === opt.value ? 'var(--primary-flare-subtle)' : 'transparent',
                  color: sortBy === opt.value ? 'var(--primary-flare)' : 'var(--text-primary)',
                  fontWeight: sortBy === opt.value ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{opt.label}</span>
                {sortBy === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
