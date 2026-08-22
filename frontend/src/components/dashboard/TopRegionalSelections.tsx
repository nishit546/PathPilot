import React, { useState } from 'react';
import { useTravel, RegionInfo } from '../../context/TravelContext';
import {
  Compass,
  Check,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Globe,
  Plus,
  Info
} from 'lucide-react';

export const TopRegionalSelections: React.FC = () => {
  const { regions, selectedRegion, setSelectedRegion, setIsCreateTripModalOpen, getFilteredTrips } = useTravel();
  const [activeModalRegion, setActiveModalRegion] = useState<RegionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'cities' | 'activities' | 'trips'>('cities');

  const activeRegionObj = regions.find(r => r.id === selectedRegion);
  const openRegion = activeModalRegion || activeRegionObj;

  const handleCardClick = (reg: RegionInfo) => {
    if (selectedRegion === reg.id && activeModalRegion?.id === reg.id) {
      // Toggle off if clicking same
      setSelectedRegion(null);
      setActiveModalRegion(null);
    } else {
      setSelectedRegion(reg.id);
      setActiveModalRegion(reg);
      setActiveTab('cities');
    }
  };

  const closeModal = () => {
    setActiveModalRegion(null);
  };

  return (
    <section id="regional-selections" style={{ marginBottom: '2.5rem' }}>
      {/* Section Header with Horizontal Rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={20} color="var(--primary-flare)" />
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
            Top Regional Selections
          </h2>
        </div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-silver)' }} />

        {selectedRegion && (
          <button
            onClick={() => {
              setSelectedRegion(null);
              setActiveModalRegion(null);
            }}
            style={{
              padding: '0.3rem 0.75rem',
              background: 'rgba(255, 72, 0, 0.08)',
              border: '1px solid var(--primary-flare)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary-flare)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Clear Filter ({regions.find(r => r.id === selectedRegion)?.name})</span>
            <X size={14} />
          </button>
        )}
      </div>

      {/* 5 Regional Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.15rem'
        }}
      >
        {regions.map(reg => {
          const isSelected = selectedRegion === reg.id;
          return (
            <div
              key={reg.id}
              onClick={() => handleCardClick(reg)}
              style={{
                position: 'relative',
                height: '210px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2px solid ${isSelected ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                boxShadow: isSelected
                  ? '0 10px 25px rgba(255, 72, 0, 0.35)'
                  : 'var(--shadow-sm)',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }
              }}
            >
              {/* Background Image */}
              <img
                src={reg.image}
                alt={reg.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.72)',
                  transition: 'transform 0.4s ease'
                }}
              />

              {/* Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.3) 55%, rgba(0, 0, 0, 0.1) 100%)'
                }}
              />

              {/* Top Badges */}
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
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: 'var(--radius-full)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {reg.cityCount} Cities • {reg.costIndex}
                </span>

                {isSelected ? (
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'var(--primary-flare)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(255, 72, 0, 0.5)'
                    }}
                  >
                    <Check size={15} />
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 'var(--radius-full)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    Details ↗
                  </span>
                )}
              </div>

              {/* Bottom Content */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.85rem',
                  left: '0.85rem',
                  right: '0.85rem',
                  color: '#ffffff'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.2rem' }}>
                  {reg.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3
                  }}
                >
                  {reg.tagline}
                </p>

                {/* Vibe Tags preview */}
                {reg.travelVibe && reg.travelVibe.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {reg.travelVibe.slice(0, 2).map((vibe, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* REGIONAL DETAILS MODAL OVERLAY */}
      {activeModalRegion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            {/* Modal Hero Header */}
            <div style={{ position: 'relative', height: '230px', flexShrink: 0 }}>
              <img
                src={activeModalRegion.image}
                alt={activeModalRegion.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, rgba(0, 0, 0, 0.2) 100%)'
                }}
              />

              {/* Close Button Top Right */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={20} />
              </button>

              {/* Header Title & Badges */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '1.25rem',
                  left: '1.5rem',
                  right: '1.5rem',
                  color: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--primary-flare)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {activeModalRegion.costIndex} Region
                  </span>
                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                  >
                    {activeModalRegion.cityCount} Key Cities
                  </span>
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  {activeModalRegion.name}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.25rem', fontWeight: 500 }}>
                  {activeModalRegion.tagline}
                </p>
              </div>
            </div>

            {/* Modal Body Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Quick Metrics Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.85rem',
                  padding: '1rem',
                  background: 'var(--secondary-horizon-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={18} color="var(--primary-flare)" />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      BEST SEASON
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {activeModalRegion.bestSeason || 'Year-round'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <DollarSign size={18} color="var(--primary-flare)" />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      EST. DAILY BUDGET
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {activeModalRegion.avgCostPerDay || 'Moderate'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={18} color="var(--primary-flare)" />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      IDEAL DURATION
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {activeModalRegion.recommendedDuration || '7 Days'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Narrative Description */}
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {activeModalRegion.description}
              </p>

              {/* Travel Vibe Tags */}
              {activeModalRegion.travelVibe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Regional Vibes:</span>
                  {activeModalRegion.travelVibe.map((vibe, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(96, 168, 192, 0.12)',
                        color: 'var(--secondary-horizon-hover)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      ✦ {vibe}
                    </span>
                  ))}
                </div>
              )}

              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-silver)',
                  marginBottom: '1.25rem'
                }}
              >
                <button
                  onClick={() => setActiveTab('cities')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'cities' ? '3px solid var(--primary-flare)' : '3px solid transparent',
                    color: activeTab === 'cities' ? 'var(--primary-flare)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'cities' ? 800 : 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <MapPin size={16} />
                  <span>Top Destinations ({activeModalRegion.topCities?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('activities')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'activities' ? '3px solid var(--primary-flare)' : '3px solid transparent',
                    color: activeTab === 'activities' ? 'var(--primary-flare)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'activities' ? 800 : 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Popular Experiences ({activeModalRegion.popularActivities?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: CITIES GRID */}
              {activeTab === 'cities' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {activeModalRegion.topCities?.map((city, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-silver)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'relative', height: '120px' }}>
                        <img
                          src={city.image}
                          alt={city.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            left: '0.65rem',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '1rem'
                          }}
                        >
                          {city.name}
                        </span>
                        <span
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            padding: '0.15rem 0.45rem',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#ffffff',
                            fontSize: '0.7rem'
                          }}
                        >
                          {city.country}
                        </span>
                      </div>

                      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', flex: 1 }}>
                          📍 <strong>Highlight:</strong> {city.highlight}
                        </p>

                        <button
                          onClick={() => {
                            closeModal();
                            setIsCreateTripModalOpen(true);
                          }}
                          className="btn-secondary"
                          style={{
                            width: '100%',
                            padding: '0.35rem',
                            fontSize: '0.78rem',
                            justifyContent: 'center',
                            marginTop: 'auto'
                          }}
                        >
                          <Plus size={13} />
                          <span>Plan Trip Here</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: ACTIVITIES LIST */}
              {activeTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeModalRegion.popularActivities?.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem 1rem',
                        background: '#ffffff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-silver)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              background: 'var(--primary-flare-subtle)',
                              color: 'var(--primary-flare)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            {act.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {act.duration}</span>
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {act.name}
                        </h4>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                          {act.cost}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Est. per person</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                background: '#f8fafc',
                borderTop: '1px solid var(--border-silver)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexShrink: 0
              }}
            >
              <button
                className="btn-secondary"
                onClick={closeModal}
                style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedRegion(activeModalRegion.id);
                    closeModal();
                  }}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                >
                  <Check size={16} />
                  <span>Filter Trips ({activeModalRegion.name})</span>
                </button>

                <button
                  className="btn-primary"
                  onClick={() => {
                    closeModal();
                    setIsCreateTripModalOpen(true);
                  }}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem', background: 'var(--secondary-horizon-hover)' }}
                >
                  <Plus size={16} />
                  <span>+ Plan Trip in {activeModalRegion.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopRegionalSelections;
