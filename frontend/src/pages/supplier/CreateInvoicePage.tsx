import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuyers, CorporateBuyer } from '../../services/buyerService';
import { createInvoice } from '../../services/invoiceService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { UploadCloud, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();

  const [availableBuyers, setAvailableBuyers] = useState<Array<{ value: string; label: string }>>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(107 + Math.random() * 900)}`);
  const [buyerId, setBuyerId] = useState('');
  const [amount, setAmount] = useState('450000');
  const [issueDate, setIssueDate] = useState('2026-08-18');
  const [paymentTermsDays, setPaymentTermsDays] = useState('45');
  const [description, setDescription] = useState('Precision CNC Aluminum Assemblies & Mounting Brackets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuyersList = async () => {
      try {
        const dbBuyers = await getBuyers();
        if (Array.isArray(dbBuyers) && dbBuyers.length > 0) {
          const options = dbBuyers.map((b: CorporateBuyer) => ({
            value: b.id,
            label: `${b.name} (Active Connection)`,
          }));
          setAvailableBuyers(options);
          setBuyerId(options[0].value);
        } else {
          setAvailableBuyers([]);
          setBuyerId('');
        }
      } catch {
        setAvailableBuyers([]);
        setBuyerId('');
      }
    };

    fetchBuyersList();
  }, []);

  // Auto calculate Due Date based on Issue Date + Terms
  const calculateDueDate = (issue: string, terms: number) => {
    if (!issue) return '';
    const d = new Date(issue);
    d.setDate(d.getDate() + terms);
    return d.toISOString().split('T')[0];
  };

  const dueDate = calculateDueDate(issueDate, parseInt(paymentTermsDays) || 30);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocumentName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerId) {
      setErrorMessage('Invoices can only be issued to Corporate Buyers with an ACTIVE connection.');
      return;
    }

    setSubmitting(true);

    try {
      const newInv = await createInvoice({
        invoiceNumber,
        buyerId,
        amount: parseFloat(amount) || 0,
        issueDate,
        dueDate,
        paymentTerms: parseInt(paymentTermsDays) || 30,
        description,
        documentFile: selectedFile,
      });

      navigate(`/invoices/${newInv.id}`);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/invoices')}
          className="p-1.5 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Issue New Invoice</h1>
          <p className="text-xs text-[#737373]">Register verified invoice to trigger cash flow tracking</p>
        </div>
      </div>

      <Card className="p-8 shadow-popover">
        {availableBuyers.length === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[#fff7ed] border border-[#ea580c]/30 text-xs space-y-3">
            <div className="flex items-start space-x-2 text-[#c2410c]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No Active Corporate Buyer Connections Found</p>
                <p className="mt-0.5 text-[#737373]">
                  Invoices can only be issued to Corporate Buyers with an ACTIVE connection. Please search and send a connection request from the Corporate Buyers directory.
                </p>
              </div>
            </div>
            <Button variant="accent" size="sm" onClick={() => navigate('/buyers')}>
              Go to Corporate Buyers Directory →
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
            />

            <Select
              label="Corporate Buyer (Active Only)"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              theme="supplier"
              options={
                availableBuyers.length > 0
                  ? availableBuyers
                  : [{ value: '', label: 'No Active Buyers Connected' }]
              }
              disabled={availableBuyers.length === 0}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Invoice Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />

            <Select
              label="Payment Terms"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
              theme="supplier"
              options={[
                { value: '15', label: '15 Net Days' },
                { value: '30', label: '30 Net Days' },
                { value: '45', label: '45 Net Days' },
                { value: '60', label: '60 Net Days' },
                { value: '90', label: '90 Net Days' },
              ]}
            />
          </div>

          <div className="p-3 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5] flex justify-between items-center text-xs">
            <span className="text-[#737373]">Calculated Due Date:</span>
            <span className="font-mono-num font-bold text-[#0a0a0a] text-sm">{dueDate}</span>
          </div>

          <Input
            label="Description of Goods / Services"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Document Upload Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
              Supporting Invoice PDF Document (Optional)
            </label>
            <div className="border-2 border-dashed border-[#d4d4d4] hover:border-[#ea580c] rounded-xl p-6 text-center bg-[#f5f5f5]/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-[#ea580c] mx-auto mb-2" />
              {documentName ? (
                <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#22863a]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{documentName} (Attached)</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#0a0a0a]">Click or drag invoice file here</p>
                  <p className="text-[11px] text-[#737373] mt-0.5">Supports PDF, PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e5e5e5] flex items-center justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={submitting || availableBuyers.length === 0}>
              {submitting ? 'Creating Invoice...' : 'Create & Issue Invoice'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
