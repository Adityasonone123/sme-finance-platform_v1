import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Landmark,
  FileCheck,
  Layers,
  LayoutDashboard,
  User,
  Bell,
  LogOut,
  ShoppingBag,
  DollarSign,
  PieChart,
  ChevronDown,
} from 'lucide-react';

export const FinanceLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/financier/login');
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const mainNavItems = [
    { label: 'Overview', path: '/finance/dashboard', icon: LayoutDashboard },
    { label: 'Financing Marketplace', path: '/finance/marketplace', icon: ShoppingBag },
    { label: 'Underwriting Queue', path: '/finance/requests', icon: FileCheck },
    { label: 'Lending Offers', path: '/finance/offers', icon: Layers },
    { label: 'Disbursements', path: '/finance/disbursements', icon: Landmark },
    { label: 'Repayments', path: '/finance/repayments', icon: DollarSign },
    { label: 'Portfolio', path: '/finance/portfolio', icon: PieChart },
  ];

  const accountNavItems = [
    { label: 'Profile', path: '/finance/profile', icon: User },
    { label: 'Notifications', path: '/finance/notifications', icon: Bell },
  ];

  const institutionName = user?.company?.name || 'KredX Working Capital Trust';

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#0a0a0a] flex flex-col font-sans">
      <header className="bg-[#171717] text-white border-b border-[#404040] px-6 py-4 relative z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Branding */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#3b82f6] rounded-lg text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold font-display text-base text-white">{institutionName}</h1>
              <p className="text-xs text-[#a3a3a3]">
                {user?.name ? `${user.name} • ` : ''}Financial Institution Portal
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Profile Link */}
            <Link
              to="/finance/profile"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                location.pathname === '/finance/profile'
                  ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#404040] border-[#404040]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>

            {/* Quick Notifications Link */}
            <Link
              to="/finance/notifications"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                location.pathname === '/finance/notifications'
                  ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#404040] border-[#404040]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </Link>

            {/* Menu Dropdown Button Container */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#171717]"
              >
                <span>Menu</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Navigation Dropdown Panel */}
              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white text-[#0a0a0a] rounded-xl shadow-popover border border-[#e5e5e5] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* MAIN SECTION */}
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                    Main
                  </div>
                  <div className="space-y-0.5 px-2">
                    {mainNavItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-[#3b82f6] text-white font-bold shadow-sm'
                              : 'text-[#404040] hover:bg-[#f5f5f5] hover:text-[#0a0a0a] font-medium'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* SEPARATOR */}
                  <hr className="my-2 border-[#e5e5e5]" />

                  {/* ACCOUNT SECTION */}
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                    Account
                  </div>
                  <div className="space-y-0.5 px-2">
                    {accountNavItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-[#3b82f6] text-white font-bold shadow-sm'
                              : 'text-[#404040] hover:bg-[#f5f5f5] hover:text-[#0a0a0a] font-medium'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Separate Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#404040] transition-colors border border-[#404040]"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
