import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminUsersPage: React.FC = () => {
  const users = [
    { id: 'u1', name: 'Aditya Sonone', email: 'aditya@vertexmfg.in', role: 'SUPPLIER', company: 'Vertex Manufacturing Pvt Ltd' },
    { id: 'u2', name: 'Rajesh Sharma', email: 'accounts@apexcomponents.com', role: 'BUYER', company: 'Apex Industrial Components' },
    { id: 'u3', name: 'KredX Underwriter', email: 'risk@kredx.in', role: 'FINANCIER', company: 'KredX Working Capital Trust' },
    { id: 'u4', name: 'System Admin', email: 'admin@smefinance.in', role: 'ADMIN', company: 'Platform Core Services' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Platform User Directory</h1>
        <p className="text-xs text-[#737373] mt-1">Cross-role user accounts</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">User Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Company</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#0a0a0a]">{u.name}</td>
                <td className="py-3.5 px-4 font-mono-num text-[#737373]">{u.email}</td>
                <td className="py-3.5 px-4">
                  <Badge variant={u.role === 'SUPPLIER' ? 'ember' : u.role === 'FINANCIER' ? 'info' : 'default'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">{u.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
