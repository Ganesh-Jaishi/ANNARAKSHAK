/**
 * RescueClock — Precision countdown timer for food deterioration window.
 * Clean, production-ready SVG ring with readable typography.
 */
import { useState, useEffect } from 'react';

export default function RescueClock({ availableUntil, size = 'md' }) {
  const [status, setStatus] = useState({ 
    remainingMin: 0, 
    label: 'SAFE', 
    color: '#16a34a', 
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    percent: 100 
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const until = new Date(availableUntil);
      const remainingMs = until - now;
      const remainingMin = Math.max(0, remainingMs / 60000);

      let label, color, bgColor, borderColor, percent;

      if (remainingMin <= 0) {
        label = 'EXPIRED';
        color = '#64748b';
        bgColor = '#f1f5f9';
        borderColor = '#cbd5e1';
        percent = 0;
      } else if (remainingMin <= 60) {
        label = 'CRITICAL';
        color = '#dc2626';
        bgColor = '#fef2f2';
        borderColor = '#fecaca';
        percent = Math.min(100, (remainingMin / 60) * 100);
      } else if (remainingMin <= 240) {
        label = 'URGENT';
        color = '#d97706';
        bgColor = '#fffbeb';
        borderColor = '#fde68a';
        percent = Math.min(100, (remainingMin / 240) * 100);
      } else {
        label = 'SAFE';
        color = '#16a34a';
        bgColor = '#f0fdf4';
        borderColor = '#bbf7d0';
        percent = 100;
      }

      setStatus({ remainingMin, label, color, bgColor, borderColor, percent });
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [availableUntil]);

  const formatTime = (min) => {
    if (min <= 0) return '0h 0m';
    const h = Math.floor(min / 60);
    const m = Math.floor(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isSmall = size === 'sm';
  const width = isSmall ? 76 : 104;
  const stroke = isSmall ? 4 : 5;
  const radius = (width - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (status.percent / 100) * circumference;

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: isSmall ? '6px' : '10px',
        borderRadius: '12px',
        background: status.bgColor,
        border: `1px solid ${status.borderColor}`,
        boxShadow: 'var(--shadow-xs)',
      }}
      title={`Rescue Clock: ${status.label} • ${formatTime(status.remainingMin)} remaining`}
    >
      <div style={{ position: 'relative', width, height: width, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={width} height={width} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.06)"
            strokeWidth={stroke}
          />
          {/* Indicator */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="transparent"
            stroke={status.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 700, 
            fontSize: isSmall ? '0.85rem' : '1.15rem', 
            color: status.color,
            lineHeight: 1.1 
          }}>
            {formatTime(status.remainingMin)}
          </div>
          <div style={{ 
            fontSize: isSmall ? '0.55rem' : '0.65rem', 
            fontWeight: 700, 
            color: status.color,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginTop: 2
          }}>
            {status.label}
          </div>
        </div>
      </div>
    </div>
  );
}
