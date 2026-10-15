import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    // Primary: black background, white text per DESIGN.md
    primary: 'bg-[#0a0a0a] text-white hover:bg-[#171717] active:bg-black focus:ring-[#0a0a0a]',
    // Secondary: white/transparent, thin gray border per DESIGN.md
    secondary: 'bg-white text-[#0a0a0a] border border-[#d4d4d4] hover:bg-[#f5f5f5] hover:border-[#a3a3a3] active:bg-[#e5e5e5] focus:ring-[#d4d4d4]',
    // Accent: Ember Orange for key actions per DESIGN.md
    accent: 'bg-[#ea580c] text-white hover:bg-[#c2410c] active:bg-[#9a3412] focus:ring-[#ea580c]',
    outline: 'border border-[#d4d4d4] text-[#404040] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]',
    danger: 'bg-[#d32f2f] text-white hover:bg-[#b71c1c] focus:ring-[#d32f2f]',
    ghost: 'text-[#404040] hover:text-[#0a0a0a] hover:bg-[#e5e5e5]/50',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
