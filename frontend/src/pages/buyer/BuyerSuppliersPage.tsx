import React, { useEffect, useState } from 'react';
import {
  getBuyerSupplierRequests,
  getConnectedSuppliersForBuyer,
  acceptSupplierRequest,
  rejectSupplierRequest,
  SupplierRequest,
  ConnectedSupplier,
} from '../../services/buyerService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, CheckCircle2, XCircle, Clock, Users, AlertCircle } from 'lucide-react';

export const BuyerSuppliersPage: React.FC = () => {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [suppliers, setSuppliers] = useState<ConnectedSupplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqList, supList] = await Promise.all([
        getBuyerSupplierRequests(),
        getConnectedSuppliersForBuyer(),
      ]);
      setRequests(reqList);
      setSuppliers(supList);
    } catch {
      setRequests([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (id: string) => {
    setErrorMessage(null);
    try {
      await acceptSupplierRequest(id);
      setSuccessMessage('Connection request accepted! Relationship is now ACTIVE.');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (id: string) => {
    setErrorMessage(null);
    try {
      await rejectSupplierRequest(id);
      setSuccessMessage('Connection request declined.');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to decline request');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Connected SME Suppliers</h1>
        <p className="text-xs text-[#737373] mt-1">
          Review incoming relationship requests and manage authorized SME supplier connections
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

      {/* Pending Connection Requests Section */}
      <Card className="p-6 space-y-4 shadow-popover border-[#ea580c]/30">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#ea580c]" />
            <h2 className="text-base font-bold font-display text-[#0a0a0a]">Incoming Supplier Connection Requests</h2>
          </div>
          <span className="text-xs font-bold font-mono-num px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#ea580c] border border-[#fb923c]/30">
            {requests.length} Pending
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#737373] py-4 text-center">Loading connection requests...</p>
        ) : requests.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#737373]">
            No pending supplier connection requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-[#0a0a0a] text-white shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0a0a0a]">{r.supplierName}</h4>
                    <p className="text-xs text-[#737373]">
                      Requested on {new Date(r.requestDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="accent"
                    size="sm"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleAccept(r.id)}
                  >
                    Accept Connection
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleReject(r.id)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Connected Active Suppliers Section */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#22863a]" />
            <h2 className="text-base font-bold font-display text-[#0a0a0a]">Authorized Connected SME Suppliers</h2>
          </div>
          <span className="text-xs font-bold font-mono-num px-2.5 py-0.5 rounded-full bg-[#22863a]/10 text-[#22863a] border border-[#22863a]/30">
            {suppliers.length} Active
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#737373] py-4 text-center">Loading connected suppliers...</p>
        ) : suppliers.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#737373]">
            <p className="font-semibold text-sm text-[#0a0a0a]">No connected suppliers yet</p>
            <p className="mt-1">Once you accept a supplier connection request, they will appear here and can issue verified invoices.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-xs space-y-2 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#22863a]/10 text-[#22863a]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0a0a0a]">{s.supplierName}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#22863a]">ACTIVE CONNECTION</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f5f5f5] space-y-1 text-[#737373]">
                  {s.supplierGst && <p>GSTIN: <span className="font-mono-num font-semibold text-[#0a0a0a]">{s.supplierGst}</span></p>}
                  {s.supplierEmail && <p>Contact Email: <span className="font-semibold text-[#0a0a0a]">{s.supplierEmail}</span></p>}
                  <p>Connected Since: <span className="font-mono-num">{new Date(s.connectedSince).toLocaleDateString('en-IN')}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
