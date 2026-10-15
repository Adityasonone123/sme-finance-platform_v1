import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-subtle">
          {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">{icon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white border border-[#d4d4d4] rounded-lg px-3.5 py-2 text-sm text-[#0a0a0a] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-colors ${
              icon ? 'pl-9' : ''
            } ${error ? 'border-[#d32f2f] focus:border-[#d32f2f] focus:ring-[#d32f2f]/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#d32f2f] font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#737373]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
