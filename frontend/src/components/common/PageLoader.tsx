import React from 'react';
import { Loader2 } from 'lucide-react';

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

export default PageLoader;
