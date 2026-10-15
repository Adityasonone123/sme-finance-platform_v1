import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Buyer,
  Invoice,
  Payment,
  CashFlowEntry,
  FinancingOffer,
  FinancingRequest,
  Notification,
  UserProfile,
  Role,
} from '../types/models';
import {
  initialUserProfile,
  initialBuyers,
  initialInvoices,
  initialPayments,
  initialCashFlowEntries,
  initialFinancingOffers,
  initialFinancingRequests,
  initialNotifications,
} from '../data/mockData';

interface DemoDataContextType {
  currentRole: Role;
  setRole: (role: Role) => void;
  userProfile: UserProfile;
  buyers: Buyer[];
  invoices: Invoice[];
  payments: Payment[];
  cashFlowEntries: CashFlowEntry[];
  financingOffers: FinancingOffer[];
  financingRequests: FinancingRequest[];
  notifications: Notification[];
  
  // Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'amountPaid' | 'remainingAmount' | 'historyTimeline'>) => Invoice;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void;
  recordPayment: (payment: Omit<Payment, 'id' | 'paymentId' | 'status'>) => Payment;
  requestFinancing: (request: Omit<FinancingRequest, 'id' | 'requestId' | 'status' | 'appliedDate' | 'repaymentSchedule'>) => FinancingRequest;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Role Portal Simulated Actions
  approveBuyerInvoice: (invoiceId: string) => void;
  rejectBuyerInvoice: (invoiceId: string) => void;
  approveFinancingApplication: (requestId: string) => void;
  rejectFinancingApplication: (requestId: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'sme_finance_platform_demo_data_v1';

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>('SUPPLIER');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [cashFlowEntries] = useState<CashFlowEntry[]>(initialCashFlowEntries);
  const [financingOffers] = useState<FinancingOffer[]>(initialFinancingOffers);
  const [financingRequests, setFinancingRequests] = useState<FinancingRequest[]>(initialFinancingRequests);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
        if (parsed.userProfile) setUserProfile(parsed.userProfile);
        if (parsed.buyers) setBuyers(parsed.buyers);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.financingRequests) setFinancingRequests(parsed.financingRequests);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (e) {
      console.warn('Failed to load demo state from localStorage', e);
    }
  }, []);

  // Sync to localStorage
  const saveState = (updatedState: Partial<{
    currentRole: Role;
    userProfile: UserProfile;
    buyers: Buyer[];
    invoices: Invoice[];
    payments: Payment[];
    financingRequests: FinancingRequest[];
    notifications: Notification[];
  }>) => {
    try {
      const currentState = {
        currentRole: updatedState.currentRole ?? currentRole,
        userProfile: updatedState.userProfile ?? userProfile,
        buyers: updatedState.buyers ?? buyers,
        invoices: updatedState.invoices ?? invoices,
        payments: updatedState.payments ?? payments,
        financingRequests: updatedState.financingRequests ?? financingRequests,
        notifications: updatedState.notifications ?? notifications,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (e) {
      console.warn('Failed to save demo state to localStorage', e);
    }
  };

  const setRole = (role: Role) => {
    setCurrentRole(role);
    saveState({ currentRole: role });
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'amountPaid' | 'remainingAmount' | 'historyTimeline'>): Invoice => {
    const id = `inv_${Date.now()}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      status: 'PENDING',
      amountPaid: 0,
      remainingAmount: invoiceData.amount,
      createdAt: new Date().toISOString(),
      historyTimeline: [
        {
          id: `t_${Date.now()}`,
          title: 'Invoice Created',
          date: new Date().toISOString().split('T')[0],
          description: 'Invoice issued and logged in platform',
        },
      ],
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // Update buyer totals
    const updatedBuyers = buyers.map((b) => {
      if (b.id === invoiceData.buyerId) {
        return {
          ...b,
          totalInvoiced: b.totalInvoiced + invoiceData.amount,
          outstandingAmount: b.outstandingAmount + invoiceData.amount,
        };
      }
      return b;
    });
    setBuyers(updatedBuyers);

    saveState({ invoices: updatedInvoices, buyers: updatedBuyers });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        return { ...inv, ...updates };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    saveState({ invoices: updatedInvoices });
  };

  const recordPayment = (paymentData: Omit<Payment, 'id' | 'paymentId' | 'status'>): Payment => {
    const id = `pay_${Date.now()}`;
    const paymentId = `PAY-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newPayment: Payment = {
      ...paymentData,
      id,
      paymentId,
      status: 'COMPLETED',
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);

    // Update target invoice
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === paymentData.invoiceId) {
        const newPaid = inv.amountPaid + paymentData.amount;
        const newRemaining = Math.max(0, inv.amount - newPaid);
        let newStatus = inv.status;
        if (newRemaining === 0) {
          newStatus = 'PAID';
        } else if (newPaid > 0) {
          newStatus = 'PARTIALLY_PAID';
        }

        const newTimeline = [
          ...inv.historyTimeline,
          {
            id: `t_${Date.now()}`,
            title: newRemaining === 0 ? 'Payment Completed' : 'Partial Payment Received',
            date: paymentData.paymentDate,
            description: `Received ₹${paymentData.amount.toLocaleString('en-IN')} via ${paymentData.method}`,
          },
        ];

        return {
          ...inv,
          amountPaid: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          historyTimeline: newTimeline,
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);

    saveState({ payments: updatedPayments, invoices: updatedInvoices });
    return newPayment;
  };

  const requestFinancing = (requestData: Omit<FinancingRequest, 'id' | 'requestId' | 'status' | 'appliedDate' | 'repaymentSchedule'>): FinancingRequest => {
    const id = `fin_${Date.now()}`;
    const requestId = `REQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const appliedDate = new Date().toISOString().split('T')[0];

    // Estimate total repayment: Principal + (Principal * Rate * Tenure / 365) + Processing Fee
    const interestAmt = Math.round((requestData.requestedAmount * (requestData.interestRate / 100) * requestData.tenureDays) / 365);
    const totalRepayment = requestData.requestedAmount + interestAmt + requestData.processingFee;

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + requestData.tenureDays);
    const repaymentDueDate = dueDateObj.toISOString().split('T')[0];

    const newRequest: FinancingRequest = {
      ...requestData,
      id,
      requestId,
      approvedAmount: requestData.requestedAmount,
      totalRepayment,
      status: 'SUBMITTED',
      appliedDate,
      repaymentDueDate,
      repaymentSchedule: [
        {
          id: `sch_${Date.now()}`,
          dueDate: repaymentDueDate,
          amount: totalRepayment,
          status: 'PENDING',
        },
      ],
    };

    const updatedRequests = [newRequest, ...financingRequests];
    setFinancingRequests(updatedRequests);

    // Add notification
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title: 'Financing Application Submitted',
      message: `Request ${requestId} for ₹${requestData.requestedAmount.toLocaleString('en-IN')} submitted to ${requestData.lenderName}.`,
      category: 'FINANCING',
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `/financing/${id}`,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    saveState({ financingRequests: updatedRequests, notifications: updatedNotifs });
    return newRequest;
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveState({ notifications: updated });
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveState({ notifications: updated });
  };

  const updateProfile = (profileUpdates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...profileUpdates };
    setUserProfile(updated);
    saveState({ userProfile: updated });
  };

  const approveBuyerInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: 'APPROVED' as const } : inv
    );
    setInvoices(updatedInvoices);
    saveState({ invoices: updatedInvoices });
  };

  const rejectBuyerInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: 'REJECTED' as const } : inv
    );
    setInvoices(updatedInvoices);
    saveState({ invoices: updatedInvoices });
  };

  const approveFinancingApplication = (requestId: string) => {
    const updatedRequests = financingRequests.map((req) =>
      req.id === requestId ? { ...req, status: 'APPROVED' as const, disbursedDate: new Date().toISOString().split('T')[0] } : req
    );
    setFinancingRequests(updatedRequests);
    saveState({ financingRequests: updatedRequests });
  };

  const rejectFinancingApplication = (requestId: string) => {
    const updatedRequests = financingRequests.map((req) =>
      req.id === requestId ? { ...req, status: 'REJECTED' as const } : req
    );
    setFinancingRequests(updatedRequests);
    saveState({ financingRequests: updatedRequests });
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentRole('SUPPLIER');
    setUserProfile(initialUserProfile);
    setBuyers(initialBuyers);
    setInvoices(initialInvoices);
    setPayments(initialPayments);
    setFinancingRequests(initialFinancingRequests);
    setNotifications(initialNotifications);
  };

  return (
    <DemoDataContext.Provider
      value={{
        currentRole,
        setRole,
        userProfile,
        buyers,
        invoices,
        payments,
        cashFlowEntries,
        financingOffers,
        financingRequests,
        notifications,
        addInvoice,
        updateInvoice,
        recordPayment,
        requestFinancing,
        markNotificationRead,
        markAllNotificationsRead,
        updateProfile,
        approveBuyerInvoice,
        rejectBuyerInvoice,
        approveFinancingApplication,
        rejectFinancingApplication,
        resetDemoData,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
};
