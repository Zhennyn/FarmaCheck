import React from 'react';

type Accent = 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'none';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

export const GlassCard: React.FC<GlassCardProps> = ({ accent = 'none', className = '', style, children, ...props }) => {
  const borderVar = accent !== 'none' ? `var(--border-${accent})` : 'var(--border-glass)';
  
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-surface)',
        border: `0.5px solid ${borderVar}`,
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        padding: '1rem',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
