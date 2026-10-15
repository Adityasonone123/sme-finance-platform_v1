import React, { useEffect, useState } from 'react';
import {
  getCashFlowSummary,
  getCashFlowEntries,
  createCashFlowEntry,
  deleteCashFlowEntry,
  ApiCashFlowSummary,
  ApiCashFlowEntry,
} from '../../services/cashFlowService';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { AlertTriangle, Plus, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useDemoData } from '../../context/DemoDataContext';

export const CashFlowPage: React.FC = () => {
  const { cashFlowEntries: demoEntries } = useDemoData();

  const [summary, setSummary] = useState<ApiCashFlowSummary | null>(null);
  const [entriesList, setEntriesList] = useState<ApiCashFlowEntry[]>([]);

  // Modal State for New Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDescription, setEntryDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRealData = async () => {
    try {
      const [dbSummary, dbEntries] = await Promise.all([getCashFlowSummary(), getCashFlowEntries()]);
      if (dbSummary) {
        setSummary(dbSummary);
      }
      if (dbEntries) {
        setEntriesList(dbEntries);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const amountVal = parseFloat(entryAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero');
      return;
    }

    setSubmitting(true);

    try {
      await createCashFlowEntry({
        type: entryType,
        amount: amountVal,
        date: entryDate,
        description: entryDescription,
      });

      setIsModalOpen(false);
      setEntryAmount('');
      setEntryDescription('');
      setSuccessMessage('Cash flow entry recorded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchRealData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to record entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this cash flow entry?')) return;
    try {
      await deleteCashFlowEntry(id);
      fetchRealData();
    } catch {
      // Catch
    }
  };

  const currentCash = summary?.currentCash ?? 450000;
  const expectedIncome = summary?.expectedIncome ?? 820000;
  const expectedExpenses = summary?.expectedExpenses ?? 910000;
  const workingCapitalGap = summary?.workingCapitalGap ?? 40000;
  const projectedCash = summary?.projectedCash ?? currentCash + expectedIncome - expectedExpenses;
  const status = summary?.status ?? (projectedCash < 0 ? 'SHORTFALL' : 'SUFFICIENT');

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Working Capital & Cash Flow Engine</h1>
          <p className="text-xs text-[#737373] mt-1">Predictive working capital gap analytics and cash depletion forecasting</p>
        </div>

        <Button
          variant="accent"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Record Cash Flow Entry
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Current Cash" amount={currentCash} subtitle="Bank liquidity" />
        <MetricCard title="Expected Income" amount={expectedIncome} subtitle="Receivables due (30d)" />
        <MetricCard title="Expected Expenses" amount={expectedExpenses} subtitle="Payables due (30d)" />
        <MetricCard title="Projected Balance" amount={projectedCash} subtitle="Net liquidity" />
        <MetricCard
          title="Working Capital Gap"
          amount={workingCapitalGap}
          highlight={status === 'SHORTFALL'}
          trendText={status === 'SHORTFALL' ? 'Shortfall Deficit' : 'Buffer Sufficient'}
          trendType={status === 'SHORTFALL' ? 'warning' : 'positive'}
          subtitle="Buffer evaluation"
        />
      </div>

      {/* Shortfall Alert Banner */}
      {status === 'SHORTFALL' && (
        <div className="p-6 rounded-2xl bg-[#0a0a0a] text-white border border-[#171717] shadow-popover">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[#fb923c]">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Projected Cash Shortage Alert</span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Working capital shortfall detected within 30-day forecast horizon.
              </h3>
              <p className="text-xs text-[#a3a3a3] max-w-2xl leading-relaxed">
                Expected expenses exceed current bank liquidity plus expected invoice collections.
              </p>

              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <span className="text-[#a3a3a3]">
                  Current Cash: <strong className="text-white font-mono-num">₹{currentCash.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-[#a3a3a3]">
                  Expected Income: <strong className="text-[#22863a] font-mono-num">₹{expectedIncome.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-[#a3a3a3]">
                  Expected Expenses: <strong className="text-[#d32f2f] font-mono-num">₹{expectedExpenses.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-[#fb923c] font-bold">
                  Working Capital Gap: <span className="font-mono-num">₹{workingCapitalGap.toLocaleString('en-IN')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#0a0a0a]">Cash Inflow vs Outflow</h3>
              <p className="text-xs text-[#737373]">Monthly breakdown (INR)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={demoEntries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(value: unknown) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="cashIn" fill="#22863a" name="Cash In" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cashOut" fill="#d32f2f" name="Cash Out" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#0a0a0a]">Projected Liquidity Balance</h3>
              <p className="text-xs text-[#737373]">Ending month cash position forecast</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={demoEntries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(value: unknown) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Projected Cash']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="projectedCash" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: '#ea580c' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Manual Cash Flow Ledger Table */}
      {entriesList.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-popover">
          <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Manual Cash Flow Ledger Entries</h3>
            <span className="text-xs text-[#737373]">{entriesList.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {entriesList.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono-num">{new Date(entry.date).toISOString().split('T')[0]}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          entry.type === 'INCOME' ? 'bg-[#22863a]/10 text-[#22863a]' : 'bg-[#d32f2f]/10 text-[#d32f2f]'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{entry.description || 'Cash Flow Record'}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono-num font-bold ${
                        entry.type === 'INCOME' ? 'text-[#22863a]' : 'text-[#d32f2f]'
                      }`}
                    >
                      ₹{(typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-[#737373] hover:text-[#d32f2f] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Cash Flow Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#737373] hover:text-[#0a0a0a]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#0a0a0a] mb-2">Record Cash Flow Entry</h3>
            <p className="text-xs text-[#737373] mb-4">Add operating income or expense to adjust working capital forecast</p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <Select
                label="Entry Type"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as any)}
                theme="supplier"
                options={[
                  { value: 'EXPENSE', label: 'Operating Expense (Outflow)' },
                  { value: 'INCOME', label: 'Operating Income (Inflow)' },
                ]}
              />

              <Input
                label="Amount (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                required
              />

              <Input
                label="Transaction / Due Date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />

              <Input
                label="Description"
                placeholder="e.g. Office Rent, Equipment Outflow, Tax Settlement"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
              />

              <div className="pt-4 flex justify-end space-x-3 border-t border-[#e5e5e5]">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="accent" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Cash Flow Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
