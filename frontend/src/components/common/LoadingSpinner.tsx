import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color = 'var(--primary-flare)',
  className = '',
  label
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem'
      }}
      className={className}
    >
      <Loader2
        size={size}
        color={color}
        style={{
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {label && (
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading PathPilot...' }) => {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '3rem 2rem'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--primary-flare-subtle)',
          border: '1px solid rgba(255, 72, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <Loader2 size={32} color="var(--primary-flare)" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
};
