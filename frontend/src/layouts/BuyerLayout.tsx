import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, FileText, CreditCard, User, LayoutDashboard, LogOut, Users } from 'lucide-react';

export const BuyerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/buyer/login');
  };

  const navItems = [
    { label: 'Overview', path: '/buyer/dashboard', icon: LayoutDashboard },
    { label: 'Invoices Received', path: '/buyer/invoices', icon: FileText },
    { label: 'Payments History', path: '/buyer/payments', icon: CreditCard },
    { label: 'Connected Suppliers', path: '/buyer/suppliers', icon: Users },
    { label: 'Buyer Profile', path: '/buyer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#0a0a0a] flex flex-col font-sans">
      <header className="bg-[#0a0a0a] text-white border-b border-[#171717] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#ea580c] rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold font-display text-base text-white">Corporate Buyer Portal</h1>
              <p className="text-xs text-[#a3a3a3]">{user?.name || 'Procurement Console'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-[#ea580c] text-white' : 'text-[#a3a3a3] hover:text-white hover:bg-[#171717]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#171717] transition-colors border border-[#404040]"
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
