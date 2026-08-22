import React from 'react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div
      style={{
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px dashed var(--border-silver)',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '2rem auto'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--secondary-horizon-subtle)',
          color: 'var(--secondary-horizon)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}
      >
        {icon || <Compass size={28} />}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: actionText ? '1.5rem' : '0', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{
            padding: '0.6rem 1.4rem',
            fontSize: '0.9rem'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
