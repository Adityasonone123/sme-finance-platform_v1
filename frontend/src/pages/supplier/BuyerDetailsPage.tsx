import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import { Buyer } from '../../types/models';

import { getBuyerById, updateBuyer, getBuyerScore } from '../../services/buyerService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RiskBadge, InvoiceStatusBadge } from '../../components/ui/Badge';
import { ArrowLeft, AlertTriangle, Edit3, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const BuyerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { buyers: demoBuyers, invoices } = useDemoData();
  const navigate = useNavigate();

  const demoBuyer = demoBuyers.find((b) => b.id === id);
  const [buyer, setBuyer] = useState<Buyer | null>(demoBuyer || null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editName, setEditName] = useState(buyer?.name || '');
  const [editGst, setEditGst] = useState(buyer?.gstNumber || '');
  const [editEmail, setEditEmail] = useState(buyer?.email || '');
  const [editPhone, setEditPhone] = useState(buyer?.phone || '');
  const [editAddress, setEditAddress] = useState(buyer?.address || '');

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [dbBuyer, scoreData] = await Promise.all([
          getBuyerById(id),
          getBuyerScore(id),
        ]);

        if (dbBuyer) {
          const mappedBuyer: Buyer = {
            id: dbBuyer.id,
            name: dbBuyer.name,
            code: demoBuyer?.code || `BUY-001`,
            contactPerson: dbBuyer.name,
            email: dbBuyer.email || 'corporate@buyer.com',
            phone: dbBuyer.phone || '+91 98765 00000',
            address: dbBuyer.address || 'Corporate Park, Mumbai',
            gstNumber: dbBuyer.gstNumber || '27AAACB123411Z2',
            creditScore: scoreData?.creditScore ?? demoBuyer?.creditScore ?? 85,
            riskLevel: scoreData?.riskLevel ?? demoBuyer?.riskLevel ?? 'LOW',
            avgPaymentDays: scoreData?.avgPaymentDays ?? demoBuyer?.avgPaymentDays ?? 30,
            contractualTermsDays: scoreData?.contractualTermsDays ?? demoBuyer?.contractualTermsDays ?? 30,
            totalInvoiced: scoreData?.totalInvoiced ?? demoBuyer?.totalInvoiced ?? 1500000,
            totalPaid: scoreData?.totalPaid ?? demoBuyer?.totalPaid ?? 1200000,
            outstandingAmount: scoreData?.outstandingAmount ?? demoBuyer?.outstandingAmount ?? 300000,
            overdueAmount: scoreData?.overdueAmount ?? demoBuyer?.overdueAmount ?? 0,
            latePaymentCount: scoreData?.overdueInvoicesCount ?? demoBuyer?.latePaymentCount ?? 0,
          };
          setBuyer(mappedBuyer);
          setEditName(mappedBuyer.name);
          setEditGst(mappedBuyer.gstNumber || '');
          setEditEmail(mappedBuyer.email);
          setEditPhone(mappedBuyer.phone);
          setEditAddress(mappedBuyer.address);
        }
      } catch {
        // Fallback to demo buyer
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [id]);

  const handleUpdateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !buyer) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const updated = await updateBuyer(id, {
        name: editName,
        gstNumber: editGst,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      });

      const updatedBuyerState: Buyer = {
        ...buyer,
        name: updated.name,
        email: updated.email || editEmail,
        phone: updated.phone || editPhone,
        address: updated.address || editAddress,
        gstNumber: updated.gstNumber || editGst,
      };

      setBuyer(updatedBuyerState);
      setIsEditModalOpen(false);
      setSuccessMessage('Corporate buyer profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update buyer profile');
    } finally {
      setSubmitting(false);
    }
  };

  const buyerInvoices = invoices.filter((i) => i.buyerId === id);

  if (loading && !buyer) {
    return <div className="text-center py-20 font-sans text-xs text-[#737373]">Loading buyer profile...</div>;
  }

  if (!buyer) {
    return (
      <div className="text-center py-20 font-sans">
        <h2 className="text-lg font-bold font-display text-[#0a0a0a]">Buyer Not Found</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/buyers')}>
          Back to Buyers
        </Button>
      </div>
    );
  }

  const delayDiff = buyer.avgPaymentDays - buyer.contractualTermsDays;

  // Chart data: Contractual vs Actual Days
  const chartData = [
    { label: 'Contractual Terms', days: buyer.contractualTermsDays, fill: '#22863a' },
    { label: 'Actual Average Payment', days: buyer.avgPaymentDays, fill: '#d32f2f' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/buyers')}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">{buyer.name}</h1>
              <RiskBadge risk={buyer.riskLevel} />
            </div>
            <p className="text-xs text-[#737373] mt-0.5">GSTIN: {buyer.gstNumber} • Email: {buyer.email}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          icon={<Edit3 className="w-4 h-4" />}
          onClick={() => {
            setEditName(buyer.name);
            setEditGst(buyer.gstNumber || '');
            setEditEmail(buyer.email);
            setEditPhone(buyer.phone);
            setEditAddress(buyer.address);
            setIsEditModalOpen(true);
          }}
        >
          Edit Corporate Buyer
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* High Delay Alert Banner */}
      {delayDiff > 10 && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#d32f2f]" />
            <div>
              <p className="font-bold text-[#d32f2f]">Payment Delay Pattern Detected</p>
              <p className="text-[#404040]">
                Contractual: <strong className="font-mono-num">{buyer.contractualTermsDays} days</strong> | Actual Average:{' '}
                <strong className="font-mono-num">{buyer.avgPaymentDays} days</strong> | Delay Difference:{' '}
                <strong className="font-mono-num text-[#d32f2f]">+{delayDiff} days</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Credit Score</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">{buyer.creditScore} / 100</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Invoiced</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">₹{buyer.totalInvoiced.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Total Paid</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">₹{buyer.totalPaid.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Outstanding</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">₹{buyer.outstandingAmount.toLocaleString('en-IN')}</p>
        </Card>
      </div>

      {/* Historical Payment Behavior Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold font-display text-[#0a0a0a] mb-4">Historical Payment Delay Analysis</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `${v} days`} />
                <Tooltip formatter={(value: unknown) => [`${value} Days`, 'Turnaround']} />
                <Bar dataKey="days" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Company Info Box */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold font-display text-[#0a0a0a] border-b border-[#e5e5e5] pb-3">
            Company Information
          </h3>
          <div className="space-y-2 text-xs divide-y divide-[#e5e5e5]">
            <div className="pt-2 flex justify-between">
              <span className="text-[#737373]">GSTIN:</span>
              <span className="font-mono-num font-semibold">{buyer.gstNumber}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#737373]">Address:</span>
              <span className="font-semibold text-right max-w-[150px]">{buyer.address}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#737373]">Contact Phone:</span>
              <span className="font-mono-num font-semibold">{buyer.phone}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#737373]">Late Incidents:</span>
              <span className="font-mono-num font-bold text-[#d32f2f]">{buyer.latePaymentCount} overdue</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#737373]">Overdue Balance:</span>
              <span className="font-mono-num font-bold text-[#d32f2f]">₹{buyer.overdueAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Buyer's Invoices Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-base font-bold font-display text-[#0a0a0a]">Invoice History with {buyer.name}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {buyerInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                    <Link to={`/invoices/${inv.id}`} className="hover:text-[#ea580c]">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-[#737373] font-mono-num">{inv.issueDate}</td>
                  <td className="py-3.5 px-4 text-[#737373] font-mono-num">{inv.dueDate}</td>
                  <td className="py-3.5 px-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                    ₹{inv.remainingAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Buyer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-[#737373] hover:text-[#0a0a0a]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#0a0a0a] mb-2">Edit Corporate Buyer Profile</h3>
            <p className="text-xs text-[#737373] mb-6">Update contact details, address, and GST identification number.</p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBuyer} className="space-y-4">
              <Input
                label="Company Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Input
                label="GSTIN (GST Number)"
                placeholder="e.g. 27AAACA123411Z5"
                value={editGst}
                onChange={(e) => setEditGst(e.target.value)}
              />

              <Input
                label="Contact Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />

              <Input
                label="Registered Office Address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />

              <div className="pt-4 flex justify-end space-x-3 border-t border-[#e5e5e5]">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="accent" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Corporate Buyer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
