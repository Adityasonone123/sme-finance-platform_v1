import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  UserCheck,
  Building2,
  Landmark,
  Shield,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'BUYER') navigate('/buyer/dashboard', { replace: true });
      else if (user.role === 'FINANCIAL_INSTITUTION') navigate('/finance/dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'SUPPLIER') navigate('/supplier/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const portals = [
    {
      role: 'SUPPLIER',
      title: 'Supplier / SME Portal',
      subtitle: 'For SMEs, Vendors & Manufacturers',
      description: 'Track cash flow forecasts, monitor buyer payment risk profiles, and unlock non-recourse invoice discounting lines.',
      features: ['7/30/60/90-Day Cash Flow Engine', 'Working Capital Deficit Alerts', '80% Invoice Discounting Line', 'Buyer Payment Scoring'],
      icon: <UserCheck className="w-6 h-6 text-[#ea580c]" />,
      loginPath: '/supplier/login',
      buttonText: 'Supplier Portal Login',
      badgeBg: 'bg-[#fff7ed] border-[#fb923c]/30 text-[#ea580c]',
    },
    {
      role: 'BUYER',
      title: 'Corporate Buyer Portal',
      subtitle: 'For Enterprises & Procurement Teams',
      description: 'Manage accounts payable console, verify incoming supplier invoices, approve payment schedules, and streamline vendor relations.',
      features: ['Accounts Payable Console', 'Invoice Verification Workflows', 'Vendor Payment History Logs', 'Early Payment Options'],
      icon: <Building2 className="w-6 h-6 text-[#ea580c]" />,
      loginPath: '/buyer/login',
      buttonText: 'Corporate Buyer Login',
      badgeBg: 'bg-[#fff7ed] border-[#fb923c]/30 text-[#ea580c]',
    },
    {
      role: 'FINANCIAL_INSTITUTION',
      title: 'Financier Portal',
      subtitle: 'For Institutional Lenders & NBFCs',
      description: 'Underwrite invoice discounting requests, review buyer creditworthiness metrics, issue competitive lending offers, and disburse capital.',
      features: ['Underwriting Queue', 'Credit & Buyer Delay Risk Analytics', 'Lending Offer Management', 'Disbursement & Repayment Tracking'],
      icon: <Landmark className="w-6 h-6 text-[#3b82f6]" />,
      loginPath: '/financier/login',
      buttonText: 'Financier Portal Login',
      badgeBg: 'bg-[#eff6ff] border-[#60a5fa]/30 text-[#3b82f6]',
    },
  ];

  const faqs = [
    {
      q: 'How does the SME Finance platform calculate working capital gaps?',
      a: 'The platform integrates verified outstanding invoices, recurring incoming cash receipts, and scheduled operational expenses to project daily cash positions over 7, 30, 60, and 90-day horizon windows.',
    },
    {
      q: 'What is the maximum invoice financing limit available to suppliers?',
      a: 'Suppliers can request invoice discounting up to a strict cap of 80% of the remaining unpaid invoice balance for approved invoices, preserving a 20% security buffer.',
    },
    {
      q: 'How are Corporate Buyer Payment Scores evaluated?',
      a: 'Buyer payment scores are calculated deterministically by evaluating historical delay days (contractual terms vs actual payment arrival), on-time completion percentages, and outstanding exposure balances.',
    },
    {
      q: 'How are role-based security boundaries enforced?',
      a: 'All requests are authenticated via HTTP-only JWT tokens. The backend enforces strict role-based access control (RBAC) and company isolation guards on every API endpoint to prevent cross-tenant access.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#0a0a0a] font-sans selection:bg-[#ea580c] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-[#0a0a0a] flex items-center justify-center text-white font-bold text-base shadow-xs">
              SF
            </div>
            <div>
              <span className="font-bold text-lg font-display text-[#0a0a0a] block leading-tight">SME Finance Platform</span>
              <span className="text-[10px] text-[#ea580c] font-semibold tracking-wider uppercase">Working Capital Engine</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-[#737373]">
            <a href="#portals" className="hover:text-[#ea580c] transition-colors">Business Portals</a>
            <a href="#demo-preview" className="hover:text-[#ea580c] transition-colors">Dashboard Preview</a>
            <a href="#capabilities" className="hover:text-[#ea580c] transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-[#ea580c] transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-[#ea580c] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/supplier/login')}>
              Sign In
            </Button>
            <Button variant="accent" size="sm" onClick={() => navigate('/register')}>
              Register Account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#fff7ed] border border-[#fb923c]/30 text-[#ea580c] text-xs font-bold mb-8 shadow-xs">
          <Zap className="w-3.5 h-3.5" />
          <span>Multi-Tenant SME Working Capital & Financing Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[#0a0a0a] mb-6 leading-[1.1] max-w-4xl mx-auto">
          Bridge Working Capital Shortfalls. Unlock Instant Invoice Liquidity.
        </h1>

        <p className="text-base sm:text-xl text-[#737373] max-w-3xl mx-auto mb-12 leading-relaxed font-normal">
          A unified financial platform connecting SME Suppliers, Corporate Buyers, and Institutional Financiers with cash flow forecasting, buyer risk scoring, and non-recourse invoice discounting.
        </p>

        {/* Platform Key Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
          <div className="p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-xs text-center">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-[#ea580c]">₹500Cr+</p>
            <p className="text-xs text-[#737373] font-semibold mt-1">Invoice Volume Tracked</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-xs text-center">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-[#22863a]">80% Cap</p>
            <p className="text-xs text-[#737373] font-semibold mt-1">Max Invoice Advance</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-xs text-center">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-[#3b82f6]">7-90 Days</p>
            <p className="text-xs text-[#737373] font-semibold mt-1">Cash Deficit Forecast</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-xs text-center">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-[#0a0a0a]">3 Portals</p>
            <p className="text-xs text-[#737373] font-semibold mt-1">Participant Entry Points</p>
          </div>
        </div>

        {/* Business Participant Portal Entry Hub */}
        <div id="portals" className="pt-4">
          <div className="text-left mb-8">
            <h2 className="text-2xl font-bold font-display text-[#0a0a0a]">Business Participant Portals</h2>
            <p className="text-xs text-[#737373]">Select your organization role to access your dedicated participant portal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {portals.map((p) => (
              <Card
                key={p.role}
                className="p-6 flex flex-col justify-between hover:shadow-popover transition-all border-[#e5e5e5] bg-white group hover:border-[#ea580c]/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] group-hover:bg-[#fff7ed] transition-colors">
                      {p.icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${p.badgeBg}`}>
                      {p.role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-display text-[#0a0a0a] mb-1">{p.title}</h3>
                  <p className="text-[11px] font-semibold text-[#ea580c] mb-3">{p.subtitle}</p>
                  <p className="text-xs text-[#737373] leading-relaxed mb-6">{p.description}</p>

                  <div className="space-y-2 mb-6 pt-4 border-t border-[#e5e5e5]">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center space-x-2 text-[11px] text-[#404040]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22863a] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => navigate(p.loginPath)}
                >
                  {p.buttonText}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Platform Live Preview Mockup */}
      <section id="demo-preview" className="py-16 bg-white border-y border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-display text-[#0a0a0a] mb-3">
              Real-Time Working Capital Dashboard
            </h2>
            <p className="text-sm text-[#737373]">
              Deterministic cash flow intelligence and buyer payment risk profiling at a glance
            </p>
          </div>

          <div className="rounded-2xl bg-[#0a0a0a] text-white p-6 sm:p-8 border border-[#171717] shadow-popover text-left">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#404040]">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#d32f2f]" />
                  <div className="w-3 h-3 rounded-full bg-[#ea580c]" />
                  <div className="w-3 h-3 rounded-full bg-[#22863a]" />
                </div>
                <span className="text-xs font-mono-num text-[#a3a3a3]">sme-finance.internal/supplier/dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#22863a]/20 text-[#22863a] border border-[#22863a]/30">
                  Live Database Sync
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#171717] border border-[#404040]">
                <p className="text-[11px] text-[#a3a3a3] font-semibold uppercase">Cash Available</p>
                <p className="text-xl font-bold font-mono-num text-white mt-1">₹4,50,000</p>
              </div>
              <div className="p-4 rounded-xl bg-[#171717] border border-[#404040]">
                <p className="text-[11px] text-[#a3a3a3] font-semibold uppercase">Expected Receipts</p>
                <p className="text-xl font-bold font-mono-num text-[#22863a] mt-1">₹8,20,000</p>
              </div>
              <div className="p-4 rounded-xl bg-[#171717] border border-[#404040]">
                <p className="text-[11px] text-[#a3a3a3] font-semibold uppercase">Upcoming Expenses</p>
                <p className="text-xl font-bold font-mono-num text-[#d32f2f] mt-1">₹13,10,000</p>
              </div>
              <div className="p-4 rounded-xl bg-[#ea580c]/10 border border-[#ea580c]/40">
                <p className="text-[11px] text-[#ea580c] font-semibold uppercase">Working Capital Gap</p>
                <p className="text-xl font-bold font-mono-num text-[#ea580c] mt-1">₹40,000</p>
                <p className="text-[11px] text-[#a3a3a3] mt-0.5">Deficit in 18 days</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#171717] border border-[#404040]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">Buyer Risk Score & Reliability</span>
                  <span className="text-[11px] text-[#22863a] font-semibold">Zenith Logistics (LOW RISK)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#a3a3a3]">
                    <span>Contractual Terms: 30 Net Days</span>
                    <span>Actual Avg: 32 Days</span>
                  </div>
                  <div className="w-full bg-[#404040] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#22863a] h-full w-[94%]" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#404040] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Eligible Invoice Financing Line</p>
                  <p className="text-[11px] text-[#a3a3a3] mt-0.5">Max 80% Advance against Invoice INV-2026-001</p>
                  <p className="text-sm font-bold font-mono-num text-[#ea580c] mt-1">Available: ₹3,60,000</p>
                </div>
                <Button variant="accent" size="sm" onClick={() => navigate('/supplier/login')}>
                  Apply Now →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Core Capabilities */}
      <section id="capabilities" className="py-16 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold font-display text-[#0a0a0a] mb-3">
            Built for Financial Integrity & Scale
          </h2>
          <p className="text-sm text-[#737373]">
            Architected with PostgreSQL Decimal precision, automated cron overdue tracking, and multi-tenant security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-[#e5e5e5] shadow-card">
            <Clock className="w-6 h-6 text-[#ea580c] mb-3" />
            <h3 className="text-lg font-bold font-display text-[#0a0a0a] mb-2">Deterministic Forecast</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              No black-box guesses. Cash flow gap engine projects exact net positions across 7, 30, 60, and 90-day timeframes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#e5e5e5] shadow-card">
            <Activity className="w-6 h-6 text-[#3b82f6] mb-3" />
            <h3 className="text-lg font-bold font-display text-[#0a0a0a] mb-2">Buyer Score Algorithm</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Evaluates buyer payment delay patterns, on-time ratio, and unpaid exposure to categorize accounts into LOW, MEDIUM, or HIGH risk.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#e5e5e5] shadow-card">
            <Lock className="w-6 h-6 text-[#22863a] mb-3" />
            <h3 className="text-lg font-bold font-display text-[#0a0a0a] mb-2">Tenant Isolation & Security</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              HTTP-only JWT session storage, IDOR resource protection guards, and company ownership verification on every endpoint.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="how-it-works" className="py-16 bg-white border-y border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-display text-[#0a0a0a] mb-3">
              How the Ecosystem Works
            </h2>
            <p className="text-sm text-[#737373]">
              A seamless 4-step workflow linking suppliers, corporate buyers, and institutional financiers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Issue Invoice', desc: 'Supplier registers invoice with buyer details & supporting PDF.' },
              { step: '02', title: 'Buyer Approval', desc: 'Corporate buyer verifies invoice details in AP console.' },
              { step: '03', title: 'Gap Detection', desc: 'Engine flags upcoming cash deficit date & calculates 80% financing limit.' },
              { step: '04', title: 'Instant Payout', desc: 'Financier approves request and disburses capital directly.' },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
                <span className="text-xs font-mono-num font-bold text-[#ea580c] bg-white px-2.5 py-1 rounded-md border border-[#e5e5e5]">
                  {item.step}
                </span>
                <h4 className="text-base font-bold font-display text-[#0a0a0a] mt-4 mb-2">{item.title}</h4>
                <p className="text-xs text-[#737373] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-display text-[#0a0a0a] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#737373]">
            Key details about our multi-portal platform architecture and financial controls
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="rounded-xl bg-white border border-[#e5e5e5] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#ea580c]" /> : <ChevronDown className="w-4 h-4 text-[#737373]" />}
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-[#737373] leading-relaxed border-t border-[#f5f5f5]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-[#0a0a0a] text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold font-display mb-4">Ready to Access Your Portal?</h2>
          <p className="text-sm text-[#a3a3a3] max-w-xl mx-auto mb-8">
            Access your dedicated Supplier, Buyer, or Financier portal workspace today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="accent" size="lg" onClick={() => navigate('/supplier/login')}>
              Supplier Portal Login
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/buyer/login')}>
              Buyer Portal Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] bg-white py-8 text-center text-xs text-[#737373]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-[#0a0a0a] text-white font-bold text-xs flex items-center justify-center">
              SF
            </div>
            <span className="font-bold text-[#0a0a0a]">SME Finance Platform</span>
          </div>
          <p>© 2026 SME Finance Platform. All role-based portals separated & protected.</p>
          <div className="flex items-center space-x-4 text-[11px]">
            <a href="#portals" className="hover:underline">Portals</a>
            <a href="#faq" className="hover:underline">FAQ</a>
            <Link to="/admin/login" className="hover:underline flex items-center space-x-1 text-[#737373] hover:text-[#d32f2f]">
              <Shield className="w-3 h-3 text-[#d32f2f]" />
              <span>Platform Admin Login</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
