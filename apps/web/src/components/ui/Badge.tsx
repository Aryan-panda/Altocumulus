import React from 'react';

export const Badge = ({ className = '', children, variant = 'default' }: { className?: string, children: React.ReactNode, variant?: 'default' | 'success' | 'outline' }) => {
  const variants = {
    default: 'bg-surface-elevated text-muted border-hairline',
    success: 'bg-accent/20 text-[#60a5fa] border-accent/50',
    outline: 'border-hairline text-muted bg-transparent'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-[2px] border text-[10px] font-mono tracking-widest uppercase ${variants[variant]} ${className}`}>
      [{children}]
    </span>
  );
};
