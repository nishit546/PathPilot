import React from 'react';
import { useTravel } from '../../context/TravelContext';
import { Plus } from 'lucide-react';

export const FloatingPlanButton: React.FC = () => {
  const { setIsCreateTripModalOpen } = useTravel();

  return (
    <button
      onClick={() => setIsCreateTripModalOpen(true)}
      className="floating-plan-btn"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2.5rem',
        padding: '0.85rem 1.45rem',
        background: 'var(--primary-flare)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(255, 72, 0, 0.35)',
        zIndex: 90,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      title="Plan a new multi-city trip"
    >
      <Plus size={20} />
      <span>+ Plan a trip</span>
    </button>
  );
};
