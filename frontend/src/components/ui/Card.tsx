import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-card ${
        onClick ? 'cursor-pointer hover:border-[#a3a3a3] transition-all duration-150' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
