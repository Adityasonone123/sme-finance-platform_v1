import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotificationCount } from '../services/notificationService';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  TrendingUp,
  Building2,
  Landmark,
  Bell,
  User,
  Menu,
  X,
  Plus,
  Search,
  LogOut,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch {
        // Fallback
      }
    };

    fetchUnreadCount();
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/supplier/login');
  };

  const navItems = [
    { label: 'Overview', path: '/supplier/dashboard', icon: LayoutDashboard },
    { label: 'Invoices', path: '/supplier/invoices', icon: FileText },
    { label: 'Payments', path: '/supplier/payments', icon: CreditCard },
    { label: 'Cash Flow', path: '/supplier/cash-flow', icon: TrendingUp },
    { label: 'Buyers', path: '/supplier/buyers', icon: Building2 },
    { label: 'Financing', path: '/supplier/financing', icon: Landmark },
    {
      label: 'Notifications',
      path: '/supplier/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Profile', path: '/supplier/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#0a0a0a] flex flex-col font-sans">
      {/* Top Mobile Bar */}
      <header className="lg:hidden bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-[#404040] hover:bg-[#f5f5f5]"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-base font-display text-[#0a0a0a]">Supplier Portal</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/supplier/notifications" className="relative p-2 text-[#404040] hover:text-[#0a0a0a]">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ea580c] rounded-full" />
            )}
          </Link>
          <button onClick={handleLogout} className="p-2 text-[#737373] hover:text-[#d32f2f]" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-[#e5e5e5] flex flex-col z-40 transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Logo & Brand Header */}
          <div className="p-6 border-b border-[#e5e5e5]">
            <Link to="/supplier/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center text-white font-bold text-sm">
                SF
              </div>
              <div>
                <h1 className="font-bold font-display text-sm text-[#0a0a0a]">SME Supplier Portal</h1>
                <p className="text-[11px] text-[#ea580c] font-semibold">Working Capital Engine</p>
              </div>
            </Link>
          </div>

          {/* Quick Create CTA */}
          <div className="px-4 py-4">
            <Link
              to="/supplier/invoices/new"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-[#ea580c] hover:bg-[#c2410c] text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/supplier/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#404040] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ea580c]' : 'text-[#737373]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-[#ea580c] text-white' : 'bg-[#fff7ed] text-[#ea580c] border border-[#ea580c]/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer in Sidebar */}
          <div className="p-4 border-t border-[#e5e5e5] bg-[#f5f5f5]/50 flex items-center justify-between">
            <Link to="/supplier/profile" className="flex items-center space-x-3 group flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0) : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0a0a0a] truncate group-hover:text-[#ea580c] transition-colors">
                  {user?.name || 'Supplier Account'}
                </p>
                <p className="text-[11px] text-[#737373] truncate">{user?.email || 'supplier@sme.com'}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#737373] hover:text-[#d32f2f] hover:bg-[#e5e5e5] rounded-lg transition-colors ml-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Desktop Bar */}
          <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-[#e5e5e5]">
            <div className="flex items-center space-x-4 max-w-md w-full">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
                <input
                  type="text"
                  placeholder="Search supplier invoices, buyers, payments..."
                  className="w-full bg-[#f5f5f5] text-xs text-[#0a0a0a] pl-9 pr-4 py-2 rounded-lg border border-[#e5e5e5] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/20">
                Supplier / SME Mode
              </span>

              <Link
                to="/supplier/notifications"
                className="relative p-2 text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ea580c] rounded-full" />
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#737373] hover:text-[#d32f2f] hover:bg-[#f5f5f5] transition-colors border border-[#e5e5e5]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* Page Body Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
