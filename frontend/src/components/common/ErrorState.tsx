import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while communicating with the server.',
  onRetry
}) => {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: '#fff4f2',
        border: '1px solid #ffd0c7',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '2rem auto'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#ffe5e0',
          color: '#d93800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}
      >
        <AlertTriangle size={24} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#992600', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#661a00', marginBottom: '1.25rem', lineHeight: 1.4 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            fontSize: '0.88rem'
          }}
        >
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
