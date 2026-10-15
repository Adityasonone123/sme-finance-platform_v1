import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { UserCheck, Building2, Landmark, Shield, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { Role } from '../../types/models';

interface PortalConfig {
  role: Role;
  portalTitle: string;
  portalSubtitle: string;
  badgeText: string;
  badgeBg: string;
  accentColor: string;
  icon: React.ReactNode;
  defaultEmail: string;
  dashboardPath: string;
}

const portalConfigs: Record<string, PortalConfig> = {
  SUPPLIER: {
    role: 'SUPPLIER',
    portalTitle: 'Supplier / SME Portal Login',
    portalSubtitle: 'Access cash flow forecasting & working capital discounting',
    badgeText: 'Supplier Portal',
    badgeBg: 'bg-[#ea580c]',
    accentColor: '#ea580c',
    icon: <UserCheck className="w-6 h-6 text-white" />,
    defaultEmail: 'rajesh@acmeenterprises.com',
    dashboardPath: '/supplier/dashboard',
  },
  BUYER: {
    role: 'BUYER',
    portalTitle: 'Corporate Buyer Portal Login',
    portalSubtitle: 'Manage accounts payable, invoice approvals & payment schedules',
    badgeText: 'Buyer Portal',
    badgeBg: 'bg-[#ea580c]',
    accentColor: '#ea580c',
    icon: <Building2 className="w-6 h-6 text-white" />,
    defaultEmail: 'procurement@zenithlogistics.com',
    dashboardPath: '/buyer/dashboard',
  },
  FINANCIAL_INSTITUTION: {
    role: 'FINANCIAL_INSTITUTION',
    portalTitle: 'Financial Institution Portal Login',
    portalSubtitle: 'Review invoice discounting requests, underwrite risk & disburse capital',
    badgeText: 'Financier Portal',
    badgeBg: 'bg-[#3b82f6]',
    accentColor: '#3b82f6',
    icon: <Landmark className="w-6 h-6 text-white" />,
    defaultEmail: 'lender@kredx.com',
    dashboardPath: '/finance/dashboard',
  },
  ADMIN: {
    role: 'ADMIN',
    portalTitle: 'Platform Administration Console',
    portalSubtitle: 'Manage platform governance, global system metrics & tenant accounts',
    badgeText: 'Admin Portal',
    badgeBg: 'bg-[#d32f2f]',
    accentColor: '#d32f2f',
    icon: <Shield className="w-6 h-6 text-white" />,
    defaultEmail: 'admin@smefinance.com',
    dashboardPath: '/admin/dashboard',
  },
};

export const LoginPage: React.FC<{ targetRole?: Role }> = ({ targetRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  // Infer portal role from prop or route pathname
  const currentPath = location.pathname.toLowerCase();
  let portalRole: Role = targetRole || 'SUPPLIER';
  if (currentPath.includes('buyer')) portalRole = 'BUYER';
  else if (currentPath.includes('financier') || currentPath.includes('finance')) portalRole = 'FINANCIAL_INSTITUTION';
  else if (currentPath.includes('admin')) portalRole = 'ADMIN';

  const config = portalConfigs[portalRole] || portalConfigs.SUPPLIER;

  const [email, setEmail] = useState(config.defaultEmail);
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [roleMismatch, setRoleMismatch] = useState<{ actualRole: Role; correctPortalPath: string; correctPortalName: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRoleMismatch(null);
    setSubmitting(true);

    try {
      const loggedUser = await login({ email, password });
      const actualRole = loggedUser.role as Role;

      // Check for Role Mismatch
      if (actualRole !== portalRole && (portalRole === 'ADMIN' || actualRole !== 'ADMIN')) {
        // Logout immediately to prevent unauthorized state in wrong portal
        await logout();
        let correctPath = '/supplier/login';
        let correctName = 'Supplier Portal';
        const roleStr = actualRole as string;
        if (roleStr === 'BUYER') {
          correctPath = '/buyer/login';
          correctName = 'Buyer Portal';
        } else if (roleStr === 'FINANCIAL_INSTITUTION' || roleStr === 'FINANCIER') {
          correctPath = '/financier/login';
          correctName = 'Financial Institution Portal';
        } else if (roleStr === 'ADMIN') {
          correctPath = '/admin/login';
          correctName = 'Admin Portal';
        }

        setRoleMismatch({ actualRole, correctPortalPath: correctPath, correctPortalName: correctName });
        return;
      }

      // Role matches -> navigate to appropriate portal dashboard
      let targetPath = config.dashboardPath;
      const roleStr = actualRole as string;
      if (roleStr === 'BUYER') targetPath = '/buyer/dashboard';
      else if (roleStr === 'FINANCIAL_INSTITUTION' || roleStr === 'FINANCIER') targetPath = '/finance/dashboard';
      else if (roleStr === 'ADMIN') targetPath = '/admin/dashboard';
      else if (roleStr === 'SUPPLIER') targetPath = '/supplier/dashboard';

      navigate(targetPath);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-3">
            <div className={`p-3 rounded-xl shadow-xs ${config.badgeBg}`}>
              {config.icon}
            </div>
          </div>
          <h2 className="text-2xl font-bold font-display text-[#0a0a0a]">{config.portalTitle}</h2>
          <p className="text-xs text-[#737373] mt-1">{config.portalSubtitle}</p>
        </div>

        <Card className="p-8 shadow-popover">
          {/* Role Mismatch Warning Alert */}
          {roleMismatch && (
            <div className="mb-6 p-4 rounded-xl bg-[#fff7ed] border border-[#ea580c]/30 text-xs space-y-3">
              <div className="flex items-start space-x-2 text-[#c2410c]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Access Denied / Role Mismatch</p>
                  <p className="mt-0.5 text-[#737373]">
                    This account is registered as <span className="font-semibold text-[#0a0a0a]">{roleMismatch.actualRole}</span> and cannot access the {config.badgeText}. Please use the {roleMismatch.correctPortalName}.
                  </p>
                </div>
              </div>
              <Button
                variant="accent"
                size="sm"
                className="w-full"
                onClick={() => navigate(roleMismatch.correctPortalPath)}
              >
                Go to {roleMismatch.correctPortalName} Login →
              </Button>
            </div>
          )}

          {/* Standard Login Error Alert */}
          {error && !roleMismatch && (
            <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={submitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {submitting ? 'Authenticating...' : `Sign in to ${config.badgeText}`}
            </Button>
          </form>

          {/* Registration & Demo Pre-fill Links */}
          <div className="mt-6 pt-4 border-t border-[#e5e5e5] text-center space-y-3">
            {portalRole !== 'ADMIN' && (
              <p className="text-xs text-[#737373]">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-[#ea580c] font-semibold hover:underline">
                  Register new account
                </Link>
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setEmail(config.defaultEmail);
                setPassword('Password123!');
              }}
              className="text-[11px] font-semibold text-[#737373] hover:text-[#ea580c] underline"
            >
              Auto-fill Demo {config.badgeText} Credentials
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center space-x-1 text-xs text-[#737373] hover:text-[#0a0a0a]">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Selection</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
