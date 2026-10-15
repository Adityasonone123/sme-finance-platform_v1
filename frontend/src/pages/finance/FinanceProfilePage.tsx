import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Landmark, Shield, User, Building, CheckCircle2, AlertCircle } from 'lucide-react';

export const FinanceProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [institutionName, setInstitutionName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.company) {
      setInstitutionName(user.company.name || '');
      setGstNumber(user.company.gstNumber || '');
      setEmail(user.company.email || user.email || '');
      setPhone(user.company.phone || '');
      setAddress(user.company.address || '');
    } else {
      // Fallback
      setInstitutionName('KredX Working Capital Trust');
      setGstNumber('27EEEKR112233Z4');
      setEmail(user?.email || 'underwriting@kredx.com');
      setPhone('+91 22 9988 7766');
      setAddress('Financial Center, BKC, Mumbai, Maharashtra 400051');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      await apiClient.put('/api/company', {
        name: institutionName,
        gstNumber,
        email,
        phone,
        address,
      });

      await refreshUser();
      setSuccessMessage('Institution profile updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update institution profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financial Institution Profile</h1>
        <p className="text-xs text-[#737373] mt-1">
          Registered institution credentials, authorized officer identity, and underwriting configuration
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-3 text-xs text-[#d32f2f] font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Authorized Officer Info Card */}
        <Card className="p-6 space-y-4 md:col-span-1 shadow-popover">
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-[#e5e5e5]">
            <div className="p-4 rounded-full bg-[#3b82f6]/10 text-[#3b82f6]">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0a0a0a]">{user?.name || 'Authorized Officer'}</h3>
              <p className="text-xs text-[#737373]">{user?.email}</p>
              <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">
                FINANCIAL INSTITUTION
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-[#737373]">
              <User className="w-4 h-4 text-[#3b82f6]" />
              <span>Officer ID: <strong className="text-[#0a0a0a] font-mono-num">{user?.id?.slice(0, 8)}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-[#737373]">
              <Building className="w-4 h-4 text-[#3b82f6]" />
              <span>Institution: <strong className="text-[#0a0a0a]">{user?.company?.name || 'Registered Lender'}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-[#737373]">
              <Shield className="w-4 h-4 text-[#22863a]" />
              <span>Status: <strong className="text-[#22863a]">VERIFIED LENDER</strong></span>
            </div>
          </div>
        </Card>

        {/* Right Column: Institution Profile Form */}
        <Card className="p-6 md:col-span-2 shadow-popover">
          <h2 className="text-base font-bold font-display text-[#0a0a0a] mb-4 pb-3 border-b border-[#e5e5e5]">
            Institution Registration & Operations Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <Input
              label="Financial Institution Name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GSTIN / Registration Number"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />

              <Input
                label="Institution Contact Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
                  Institution Role / Type
                </label>
                <input
                  type="text"
                  value="FINANCIAL_INSTITUTION (Lender / NBFC / Trust)"
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] text-[#737373] cursor-not-allowed font-semibold text-xs"
                />
              </div>
            </div>

            <Input
              label="Registered Office Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="pt-4 flex justify-end border-t border-[#e5e5e5]">
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? 'Saving Profile...' : 'Update Institution Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
