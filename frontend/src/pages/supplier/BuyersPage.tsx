import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSupplierBuyersDetailed,
  searchBuyers,
  connectBuyer,
  inviteBuyer,
  CorporateBuyer,
  DetailedSupplierBuyers,
} from '../../services/buyerService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, ChevronRight, Plus, X, AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';

export const BuyersPage: React.FC = () => {
  const [data, setData] = useState<DetailedSupplierBuyers>({
    activeBuyers: [],
    pendingRequests: [],
    rejectedRequests: [],
    invitations: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'INVITE'>('SEARCH');

  // Search Tab State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CorporateBuyer[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Invite Tab State
  const [inviteCompanyName, setInviteCompanyName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteContactName, setInviteContactName] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBuyersData = async () => {
    try {
      setLoading(true);
      const detailed = await getSupplierBuyersDetailed();
      setData(detailed);
    } catch {
      setData({ activeBuyers: [], pendingRequests: [], rejectedRequests: [], invitations: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyersData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setErrorMessage(null);
    try {
      const results = await searchBuyers(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSendConnection = async (buyerCompanyId: string) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await connectBuyer(buyerCompanyId);
      setSuccessMessage('Connection request sent to corporate buyer!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsModalOpen(false);
      loadBuyersData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to send connection request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await inviteBuyer(inviteCompanyName, inviteEmail, inviteContactName);
      setSuccessMessage('Invitation sent successfully! No credentials or passwords were created.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsModalOpen(false);
      setInviteCompanyName('');
      setInviteEmail('');
      setInviteContactName('');
      loadBuyersData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Corporate Buyers & Relationships</h1>
          <p className="text-xs text-[#737373] mt-1">
            Connect registered enterprise buyers, track pending requests, and invite new partners
          </p>
        </div>

        <Button
          variant="accent"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage(null);
          }}
        >
          Connect Corporate Buyer
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Connected Buyers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-[#0a0a0a]">Active Connected Buyers</h2>
          <span className="text-xs font-mono-num font-bold text-[#22863a]">{data.activeBuyers.length} Connected</span>
        </div>

        {loading ? (
          <Card className="p-8 text-center text-xs text-[#737373]">Loading buyer relationships...</Card>
        ) : data.activeBuyers.length === 0 ? (
          <Card className="p-8 text-center text-xs text-[#737373] space-y-3">
            <Building2 className="w-8 h-8 text-[#a3a3a3] mx-auto" />
            <div>
              <p className="font-semibold text-sm text-[#0a0a0a]">No Active Corporate Buyers Connected</p>
              <p className="mt-0.5">Invoices can only be issued to buyers with an ACTIVE connection. Click "Connect Corporate Buyer" above to get started.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.activeBuyers.map((b) => (
              <Card key={b.id} className="hover:border-[#ea580c]/50 transition-all flex flex-col justify-between shadow-popover">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-[#0a0a0a] text-white">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <Link to={`/buyers/${b.buyerId}`} className="font-bold text-base text-[#0a0a0a] hover:text-[#ea580c]">
                          {b.name}
                        </Link>
                        {b.gstNumber && <p className="text-xs text-[#737373] font-mono-num">GSTIN: {b.gstNumber}</p>}
                      </div>
                    </div>
                    <Badge variant="success">ACTIVE</Badge>
                  </div>

                  <div className="p-3 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] mb-4 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Contact Email:</span>
                      <span className="font-mono-num font-semibold text-[#0a0a0a]">{b.email || 'Registered Corporate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Invoice Line Status:</span>
                      <span className="font-bold text-[#22863a]">ELIGIBLE FOR INVOICING</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e5e5e5] flex justify-end">
                  <Link
                    to={`/buyers/${b.buyerId}`}
                    className="text-xs font-semibold text-[#ea580c] hover:underline flex items-center space-x-1"
                  >
                    <span>View Payment Risk Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Connection Requests */}
      {data.pendingRequests.length > 0 && (
        <Card className="p-6 space-y-4 shadow-popover border-[#ea580c]/30">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#ea580c]" />
              <h2 className="text-base font-bold font-display text-[#0a0a0a]">Pending Connection Requests (Awaiting Buyer Approval)</h2>
            </div>
            <span className="text-xs font-bold font-mono-num text-[#ea580c]">{data.pendingRequests.length} Pending</span>
          </div>

          <div className="space-y-3">
            {data.pendingRequests.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-[#737373]" />
                  <div>
                    <p className="font-bold text-[#0a0a0a]">{r.name}</p>
                    <p className="text-[11px] text-[#737373]">
                      Request sent on {r.connectedAt ? new Date(r.connectedAt).toLocaleDateString('en-IN') : 'Recently'}
                    </p>
                  </div>
                </div>
                <Badge variant="warning">PENDING APPROVAL</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sent Invitations */}
      {data.invitations.length > 0 && (
        <Card className="p-6 space-y-4 shadow-popover">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-[#3b82f6]" />
              <h2 className="text-base font-bold font-display text-[#0a0a0a]">Sent Invitations (Unregistered Buyers)</h2>
            </div>
            <span className="text-xs font-bold font-mono-num text-[#3b82f6]">{data.invitations.length} Sent</span>
          </div>

          <div className="space-y-3">
            {data.invitations.map((inv) => (
              <div key={inv.id} className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#0a0a0a]">{inv.companyName}</p>
                  <p className="text-[11px] text-[#737373]">Invited: {inv.contactEmail}</p>
                </div>
                <Badge variant="info">INVITATION SENT</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connect / Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#737373] hover:text-[#0a0a0a]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#0a0a0a] mb-1">Connect Corporate Buyer</h3>
            <p className="text-xs text-[#737373] mb-4">Establish official business relationships with registered enterprise buyers</p>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#e5e5e5] mb-6">
              <button
                onClick={() => setActiveTab('SEARCH')}
                className={`pb-2 px-4 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === 'SEARCH'
                    ? 'border-[#ea580c] text-[#ea580c]'
                    : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                }`}
              >
                Search Registered Buyers
              </button>
              <button
                onClick={() => setActiveTab('INVITE')}
                className={`pb-2 px-4 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === 'INVITE'
                    ? 'border-[#ea580c] text-[#ea580c]'
                    : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                }`}
              >
                Invite Unregistered Buyer
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: Search Registered Buyers */}
            {activeTab === 'SEARCH' && (
              <div className="space-y-4 font-sans">
                <form onSubmit={handleSearch} className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search company name or GSTIN (e.g. Zenith)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </form>

                <div className="space-y-3 max-h-60 overflow-y-auto pt-2">
                  {searchResults.length === 0 ? (
                    <p className="text-center text-xs text-[#737373] py-6">
                      {searchQuery ? 'No registered corporate buyers found. Try inviting them using the second tab.' : 'Type a company name or GSTIN above to search.'}
                    </p>
                  ) : (
                    searchResults.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#0a0a0a]">{b.name}</p>
                          {b.gstNumber && <p className="text-[11px] text-[#737373]">GSTIN: {b.gstNumber}</p>}
                        </div>

                        {b.relationshipStatus === 'ACTIVE' ? (
                          <Badge variant="success">Already Connected</Badge>
                        ) : b.relationshipStatus === 'PENDING' ? (
                          <Badge variant="warning">Request Pending</Badge>
                        ) : (
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleSendConnection(b.id)}
                          >
                            Send Request
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Invite Unregistered Buyer */}
            {activeTab === 'INVITE' && (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs font-sans">
                <p className="text-[#737373] mb-2">
                  Send an official invitation link. The buyer will complete their own registration and set their credentials securely.
                </p>

                <Input
                  label="Company Name"
                  placeholder="e.g. Acme Industrial Corp"
                  value={inviteCompanyName}
                  onChange={(e) => setInviteCompanyName(e.target.value)}
                  required
                />

                <Input
                  label="Contact Email Address"
                  type="email"
                  placeholder="procurement@acme.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />

                <Input
                  label="Contact Person Name (Optional)"
                  placeholder="e.g. Ramesh Kumar"
                  value={inviteContactName}
                  onChange={(e) => setInviteContactName(e.target.value)}
                />

                <div className="pt-4 flex justify-end space-x-3 border-t border-[#e5e5e5]">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button variant="accent" type="submit" disabled={submitting}>
                    {submitting ? 'Sending Invitation...' : 'Send Buyer Invitation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
