import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDemoData } from '../../context/DemoDataContext';
import { getCompanyProfile, updateCompanyProfile, createCompanyProfile } from '../../services/companyService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { userProfile: demoProfile, updateProfile: updateDemoProfile } = useDemoData();

  const [name, setName] = useState(authUser?.name || demoProfile.name);
  const [email, setEmail] = useState(authUser?.email || demoProfile.email);
  const [phone, setPhone] = useState(demoProfile.phone);
  const [businessName, setBusinessName] = useState(authUser?.company?.name || demoProfile.businessName);
  const [gstNumber, setGstNumber] = useState(demoProfile.gstNumber);
  const [address, setAddress] = useState(demoProfile.address);

  const [hasRealCompany, setHasRealCompany] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const company = await getCompanyProfile();
        if (company) {
          setHasRealCompany(true);
          setBusinessName(company.name);
          if (company.gstNumber) setGstNumber(company.gstNumber);
          if (company.email) setEmail(company.email);
          if (company.phone) setPhone(company.phone);
          if (company.address) setAddress(company.address);
        }
      } catch {
        // Fallback to initial values
      }
    };

    if (authUser) {
      setName(authUser.name);
      setEmail(authUser.email);
      if (authUser.company) {
        setBusinessName(authUser.company.name);
        setHasRealCompany(true);
      }
      fetchCompanyData();
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaving(true);

    try {
      if (authUser) {
        if (hasRealCompany || authUser.companyId) {
          const updated = await updateCompanyProfile({
            name: businessName,
            gstNumber,
            email,
            phone,
            address,
          });
          setBusinessName(updated.name);
          if (updated.gstNumber) setGstNumber(updated.gstNumber);
        } else {
          const created = await createCompanyProfile({
            name: businessName,
            gstNumber,
            email,
            phone,
            address,
          });
          setHasRealCompany(true);
          setBusinessName(created.name);
          if (created.gstNumber) setGstNumber(created.gstNumber);
        }
      }

      // Sync demo state as well for seamless UI continuity
      updateDemoProfile({
        name,
        email,
        phone,
        businessName,
        gstNumber,
        address,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Business & Account Profile</h1>
        <p className="text-xs text-[#737373] mt-1">Manage SME details, GST compliance, and contact information</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Profile changes successfully saved to database!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-3 text-xs text-[#d32f2f] font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="p-8 shadow-popover">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4 pb-6 border-b border-[#e5e5e5]">
            <div className="w-14 h-14 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center font-bold text-xl font-display">
              {name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0a0a0a]">{businessName}</h3>
              <p className="text-xs text-[#737373]">{authUser?.role || demoProfile.businessType}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#404040]">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e5e5e5]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#404040]">Company Information</h4>
            <Input label="Registered Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            <Input label="GST Identification Number (GSTIN)" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 27AAACA123411Z5" required />
            <Input label="Registered Business Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="pt-4 border-t border-[#e5e5e5] flex justify-end">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
