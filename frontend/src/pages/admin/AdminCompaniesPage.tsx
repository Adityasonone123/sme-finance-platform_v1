import React from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { Card } from '../../components/ui/Card';

export const AdminCompaniesPage: React.FC = () => {
  const { buyers, userProfile } = useDemoData();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Registered Companies</h1>
        <p className="text-xs text-[#737373] mt-1">SME Suppliers & Corporate Buyers</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            <tr className="hover:bg-[#f5f5f5]/60 transition-colors">
              <td className="py-3.5 px-4 font-bold text-[#0a0a0a]">{userProfile.businessName}</td>
              <td className="py-3.5 px-4 font-semibold text-[#ea580c]">SME Supplier</td>
              <td className="py-3.5 px-4 text-[#737373]">{userProfile.email}</td>
              <td className="py-3.5 px-4 font-semibold text-[#22863a]">Verified</td>
            </tr>
            {buyers.map((b) => (
              <tr key={b.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#0a0a0a]">{b.name}</td>
                <td className="py-3.5 px-4 font-semibold text-[#3b82f6]">Corporate Buyer</td>
                <td className="py-3.5 px-4 text-[#737373]">{b.email}</td>
                <td className="py-3.5 px-4 font-semibold text-[#22863a]">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
