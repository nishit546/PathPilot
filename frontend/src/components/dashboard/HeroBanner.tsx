import React from 'react';
import bannerImg from '../../assets/banner-image.png';

export const HeroBanner: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-silver)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.75rem',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src={bannerImg}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/banner-image.png';
        }}
        alt="PathPilot Travel Banner"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '340px',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block'
        }}
      />
    </div>
  );
};
