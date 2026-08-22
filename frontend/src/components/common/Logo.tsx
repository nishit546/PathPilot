import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ size = 38, className, style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 4px 10px rgba(255, 72, 0, 0.25))', ...style }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="globeGrad" x1="60" y1="120" x2="240" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2c3440" />
          <stop offset="100%" stopColor="#181e26" />
        </linearGradient>

        <linearGradient id="pinGrad" x1="160" y1="60" x2="420" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff7a00" />
          <stop offset="50%" stopColor="#ff5500" />
          <stop offset="100%" stopColor="#e03e00" />
        </linearGradient>

        <linearGradient id="compassBg" x1="220" y1="140" x2="360" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e2530" />
          <stop offset="100%" stopColor="#10141a" />
        </linearGradient>

        <linearGradient id="needleOrange" x1="270" y1="230" x2="350" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff851b" />
          <stop offset="100%" stopColor="#ff4500" />
        </linearGradient>

        <linearGradient id="planeGrad" x1="380" y1="50" x2="470" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff8a00" />
          <stop offset="100%" stopColor="#ff4400" />
        </linearGradient>
      </defs>

      {/* 1. Orbit Arc around Globe */}
      <path
        d="M 50 280 C 40 330 80 375 145 375 C 190 375 220 350 240 325"
        stroke="#ff6600"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. Globe on Left */}
      <circle cx="160" cy="240" r="110" fill="url(#globeGrad)" />
      
      {/* Globe Continents (Stylized white/light-gray shapes) */}
      <path
        d="M 120 160 C 135 150 160 160 170 175 C 180 190 165 210 150 215 C 135 220 115 200 110 185 Z"
        fill="#cbd5e1"
        opacity="0.95"
      />
      <path
        d="M 180 180 C 195 170 215 180 225 195 C 235 215 220 235 200 240 C 185 245 170 230 175 205 Z"
        fill="#cbd5e1"
        opacity="0.95"
      />
      <path
        d="M 115 245 C 130 240 150 255 155 275 C 160 300 140 325 125 330 C 110 335 95 315 100 290 C 105 270 100 250 115 245 Z"
        fill="#cbd5e1"
        opacity="0.95"
      />
      <path
        d="M 175 260 C 190 255 210 270 215 290 C 220 310 205 330 190 335 C 175 340 160 320 165 295 Z"
        fill="#cbd5e1"
        opacity="0.95"
      />

      {/* 3. Orange 'P' Location Pin Body */}
      <path
        d="M 285 65 C 205 65 175 130 175 210 C 175 305 235 385 245 440 C 248 455 258 455 262 440 C 275 390 395 340 395 210 C 395 130 365 65 285 65 Z"
        fill="url(#pinGrad)"
      />

      {/* 4. Compass Housing (Inner dark disc) */}
      <circle cx="285" cy="205" r="72" fill="url(#compassBg)" stroke="#ffffff" strokeWidth="4" />

      {/* 5. Compass Rose Stars (8 points) */}
      {/* North / South / East / West points */}
      <polygon points="285,142 291,199 348,205 291,211 285,268 279,211 222,205 279,199" fill="#ffffff" />
      {/* Corner diagonal points */}
      <polygon points="285,160 295,195 330,205 295,215 285,250 275,215 240,205 275,195" fill="#94a3b8" />

      {/* 6. Orange Compass Needle pointing to top-right */}
      <polygon points="285,205 345,150 298,198" fill="url(#needleOrange)" />
      <polygon points="285,205 230,255 272,212" fill="#e2e8f0" />
      <circle cx="285" cy="205" r="8" fill="#1e293b" stroke="#ffffff" strokeWidth="3" />

      {/* 7. Flight Trail from compass through 'P' to the airplane */}
      <path
        d="M 255 235 C 290 195 345 155 405 115"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* 8. Orange Airplane Soaring Out */}
      <g transform="translate(420, 85) rotate(45) scale(0.9)">
        {/* Airplane Fuselage */}
        <path
          d="M 0 -35 C 4 -35 8 -25 8 -10 L 8 20 C 8 26 5 30 0 32 C -5 30 -8 26 -8 20 L -8 -10 C -8 -25 -4 -35 0 -35 Z"
          fill="url(#planeGrad)"
        />
        {/* Main Wings */}
        <polygon points="0,-10 38,12 34,18 0,5 -34,18 -38,12" fill="url(#planeGrad)" />
        {/* Tail Wings */}
        <polygon points="0,20 16,30 14,34 0,27 -14,34 -16,30" fill="url(#planeGrad)" />
      </g>
    </svg>
  );
};
