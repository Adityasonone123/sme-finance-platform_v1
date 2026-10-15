import React, { useEffect, useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types/models';
import { Shield, Building2, Landmark, UserCheck, RefreshCw, Server } from 'lucide-react';
import { checkHealth } from '../../services/api';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole, resetDemoData } = useDemoData();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [apiMsg, setApiMsg] = useState<string>('');

  useEffect(() => {
    const verifyBackend = async () => {
      try {
        const res = await checkHealth();
        if (res.status === 'ok') {
          setApiStatus('connected');
          setApiMsg(res.message || 'API Connected');
        } else {
          setApiStatus('offline');
        }
      } catch {
        setApiStatus('offline');
      }
    };
    verifyBackend();
  }, []);

  const roles: Array<{ id: Role; label: string; route: string; icon: React.ReactNode }> = [
    { id: 'SUPPLIER', label: 'Supplier / SME', route: '/dashboard', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'BUYER', label: 'Buyer Portal', route: '/buyer/dashboard', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'FINANCIER', label: 'Financier Portal', route: '/finance/dashboard', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'ADMIN', label: 'Admin Portal', route: '/admin/dashboard', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  const handleRoleChange = (role: Role, route: string) => {
    setRole(role);
    navigate(route);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#0a0a0a] text-white p-2 rounded-xl shadow-popover border border-[#404040] flex items-center space-x-2 text-xs">
      <div
        className="flex items-center space-x-1.5 px-2 py-1 bg-[#171717] rounded-lg border border-[#404040]"
        title={apiMsg || 'Backend status'}
      >
        <Server className="w-3.5 h-3.5 text-[#a3a3a3]" />
        <span
          className={`w-2 h-2 rounded-full ${
            apiStatus === 'connected' ? 'bg-[#22863a] animate-pulse' : apiStatus === 'checking' ? 'bg-[#ea580c]' : 'bg-[#d32f2f]'
          }`}
        />
        <span className="text-[11px] font-medium text-[#a3a3a3]">
          {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'checking' ? 'Checking API...' : 'API Offline'}
        </span>
      </div>

      <span className="text-[#a3a3a3] font-semibold px-1 uppercase tracking-wider text-[10px]">Demo:</span>

      <div className="flex bg-[#171717] rounded-lg p-0.5 border border-[#404040]">
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.id, r.route)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                isActive
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#404040]/50'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={resetDemoData}
        title="Reset demo data to initial defaults"
        className="p-1.5 text-[#a3a3a3] hover:text-white hover:bg-[#404040] rounded-lg transition-colors ml-1"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

