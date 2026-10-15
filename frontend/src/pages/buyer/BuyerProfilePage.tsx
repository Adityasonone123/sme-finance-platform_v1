import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCompanyProfile, CompanyProfile } from '../../services/companyService';
import { Card } from '../../components/ui/Card';
import { Building2, User, Mail, Phone, MapPin, Award, Clock } from 'lucide-react';

export const BuyerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<(CompanyProfile & { creditScore?: number; paymentTermsDays?: number }) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getCompanyProfile();
        setCompany(data);
      } catch {
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const companyName = company?.name || 'Corporate Buyer Profile';
  const paymentTerms = company?.paymentTermsDays ? `${company.paymentTermsDays} Net Days` : '30 Net Days';
  const creditScore = company?.creditScore !== undefined ? `${company.creditScore} / 100` : '85 / 100';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Corporate Buyer Profile</h1>
        <p className="text-xs text-[#737373] mt-1">{companyName}</p>
      </div>

      <Card className="space-y-4 shadow-popover">
        <div className="flex items-center space-x-4 pb-4 border-b border-[#e5e5e5]">
          <div className="p-3 rounded-xl bg-[#0a0a0a] text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0a0a0a]">{companyName}</h3>
            <p className="text-xs text-[#737373]">
              {company?.type || 'CORPORATE'} • Accounts Payable Console
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#737373]">
            Loading buyer profile details from database...
          </div>
        ) : (
          <div className="space-y-3 text-xs divide-y divide-[#e5e5e5]">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#737373]" />
                Contractual Payment Terms:
              </span>
              <span className="font-mono-num font-bold text-[#0a0a0a]">{paymentTerms}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#22863a]" />
                Platform Credit Score:
              </span>
              <span className="font-mono-num font-bold text-[#22863a]">{creditScore}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#737373]" />
                Accounts Contact Name:
              </span>
              <span className="font-semibold text-[#0a0a0a]">{user?.name || 'Not provided'}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#737373]" />
                Accounts Email:
              </span>
              <span className="font-mono-num text-[#0a0a0a]">{user?.email || company?.email || 'Not provided'}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#737373]" />
                GSTIN:
              </span>
              <span className="font-mono-num text-[#0a0a0a]">{company?.gstNumber || 'Not provided'}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[#737373] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#737373]" />
                Phone:
              </span>
              <span className="font-mono-num text-[#0a0a0a]">{company?.phone || 'Not provided'}</span>
            </div>

            {company?.address && (
              <div className="pt-2 flex justify-between items-start">
                <span className="text-[#737373] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#737373]" />
                  Address:
                </span>
                <span className="font-medium text-[#0a0a0a] max-w-xs text-right">{company.address}</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
