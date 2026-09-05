import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-mono uppercase tracking-wider text-xs transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-[2px] backdrop-blur-md relative overflow-hidden group';
    
    const variants = {
      primary: 'bg-white text-background hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]',
      accent: 'bg-accent/80 text-white border border-accent hover:bg-accent shadow-[0_0_20px_rgba(30,41,59,0.3)]',
      secondary: 'bg-surface/50 border border-hairline text-primary hover:bg-surface-elevated hover:border-muted',
      ghost: 'bg-transparent text-muted hover:text-primary hover:bg-surface/30',
    };
    
    const sizes = {
      sm: 'h-8 px-4',
      md: 'h-10 px-6',
      lg: 'h-12 px-8',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">{props.children}</span>
        {/* Subtle hover gleam */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-0" />
      </button>
    );
  }
);
Button.displayName = 'Button';
