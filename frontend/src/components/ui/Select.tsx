import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type SelectTheme = 'default' | 'financier' | 'supplier' | 'buyer' | 'admin';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  theme?: SelectTheme;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  theme = 'default',
}) => {
  const [internalValue, setInternalValue] = useState<string>(value !== undefined ? value : defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const selectedOption = options.find((opt) => opt.value === internalValue);

  const handleSelectOption = (optValue: string, isOptDisabled?: boolean) => {
    if (disabled || isOptDisabled) return;
    setInternalValue(optValue);
    setIsOpen(false);
    onChange?.({ target: { value: optValue, name: name || selectId } });
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      const initialIdx = options.findIndex((o) => o.value === internalValue);
      setFocusedIndex(initialIdx >= 0 ? initialIdx : 0);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        const targetOpt = options[focusedIndex];
        handleSelectOption(targetOpt.value, targetOpt.disabled);
      }
    }
  };

  // Theme styles
  const themeStyles = {
    default: {
      borderFocus: 'focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20',
      activeItem: 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold',
      hoverItem: 'hover:bg-[#3b82f6]/5 hover:text-[#0a0a0a]',
      checkIcon: 'text-[#3b82f6]',
    },
    financier: {
      borderFocus: 'focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20',
      activeItem: 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold',
      hoverItem: 'hover:bg-[#3b82f6]/5 hover:text-[#0a0a0a]',
      checkIcon: 'text-[#3b82f6]',
    },
    supplier: {
      borderFocus: 'focus:border-[#ea580c] focus:ring-2 focus:ring-[#ea580c]/20',
      activeItem: 'bg-[#ea580c]/10 text-[#ea580c] font-bold',
      hoverItem: 'hover:bg-[#ea580c]/5 hover:text-[#0a0a0a]',
      checkIcon: 'text-[#ea580c]',
    },
    buyer: {
      borderFocus: 'focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20',
      activeItem: 'bg-[#059669]/10 text-[#059669] font-bold',
      hoverItem: 'hover:bg-[#059669]/5 hover:text-[#0a0a0a]',
      checkIcon: 'text-[#059669]',
    },
    admin: {
      borderFocus: 'focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20',
      activeItem: 'bg-[#6366f1]/10 text-[#6366f1] font-bold',
      hoverItem: 'hover:bg-[#6366f1]/5 hover:text-[#0a0a0a]',
      checkIcon: 'text-[#6366f1]',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.default;

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
          {label} {required && <span className="text-[#d32f2f]">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-left flex items-center justify-between transition-colors shadow-subtle cursor-pointer focus:outline-none ${
            error ? 'border-[#d32f2f]' : isOpen ? 'border-[#3b82f6]' : 'border-[#d4d4d4]'
          } ${currentTheme.borderFocus} ${disabled ? 'bg-[#f5f5f5] opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className={`truncate font-medium ${selectedOption ? 'text-[#0a0a0a]' : 'text-[#737373]'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] ml-2 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0a0a0a]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white rounded-xl shadow-popover border border-[#e5e5e5] py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            role="listbox"
            aria-activedescendant={focusedIndex >= 0 ? `${selectId}-opt-${focusedIndex}` : undefined}
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-[#737373] text-center">No options available</div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === internalValue;
                const isFocused = idx === focusedIndex;

                return (
                  <div
                    key={opt.value}
                    id={`${selectId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value, opt.disabled)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-[#a3a3a3]'
                        : isSelected
                        ? currentTheme.activeItem
                        : isFocused
                        ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                        : `text-[#404040] ${currentTheme.hoverItem}`
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className={`w-3.5 h-3.5 ${currentTheme.checkIcon} ml-2 shrink-0`} />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-[#d32f2f] font-medium">{error}</p>}
    </div>
  );
};

Select.displayName = 'Select';
