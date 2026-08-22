import React from 'react';
import { useTravel } from '../../context/TravelContext';
import { Compass, Check } from 'lucide-react';

export const TopRegionalSelections: React.FC = () => {
  const { regions, selectedRegion, setSelectedRegion } = useTravel();

  return (
    <section id="regional-selections" style={{ marginBottom: '2.5rem' }}>
      {/* Section Header with Horizontal Rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
          Top Regional Selections
        </h2>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-silver)' }} />
        {selectedRegion && (
          <button
            onClick={() => setSelectedRegion(null)}
            style={{
              padding: '0.25rem 0.65rem',
              background: 'none',
              border: '1px solid var(--primary-flare)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary-flare)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Clear Region Filter ✕
          </button>
        )}
      </div>

      {/* 5 Regional Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.15rem'
        }}
      >
        {regions.map(reg => {
          const isSelected = selectedRegion === reg.id;
          return (
            <div
              key={reg.id}
              onClick={() => setSelectedRegion(isSelected ? null : reg.id)}
              style={{
                position: 'relative',
                height: '190px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2px solid ${isSelected ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                boxShadow: isSelected ? '0 8px 20px rgba(255, 72, 0, 0.3)' : 'var(--shadow-sm)',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
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
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.2) 60%, rgba(0, 0, 0, 0) 100%)'
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
                    padding: '0.2rem 0.55rem',
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 'var(--radius-full)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {reg.costIndex} Cost
                </span>

                {isSelected ? (
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--primary-flare)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <Check size={14} />
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--border-silver)',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    {reg.cityCount} Cities
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.15rem' }}>
                  {reg.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {reg.tagline}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
