import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#e5e5e5] shadow-popover flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
            <h3 className="text-lg font-semibold font-display text-[#0a0a0a]">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};
