import React from 'react';

type Accent = 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'none';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

export const GlassCard: React.FC<GlassCardProps> = ({ accent = 'none', className = '', style, children, ...props }) => {
  const borderVar = accent !== 'none' ? `var(--border-${accent})` : 'var(--border-glass)';
  
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${borderVar}`,
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-glass)',
        padding: '1.25rem',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
