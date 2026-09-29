import React, { useState, useEffect } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { getMyPaymentsApi, submitPaymentDetailsApi, getInvoiceByIdApi } from '@/services/paymentService';
import { Wallet, CheckCircle2, FileText, Download, X, AlertCircle } from 'lucide-react';

const mockPayments = [
  { id: 1, date: '15 Nov 2025', description: 'Annual Membership Renewal 2026', amount: '200.00', status: 'PAID', invoice_number: 'WISTA-SG-2025-000101' },
  { id: 2, date: '02 Oct 2025', description: 'Networking Evening & Panel Discussion', amount: '50.00', status: 'PAID', invoice_number: 'WISTA-SG-2025-000088' },
];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [txnRefInput, setTxnRefInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('PAYNOW');
  const [actionMessage, setActionMessage] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getMyPaymentsApi();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map(p => ({
          id: p.id,
          date: new Date(p.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
          description: `${p.application?.membership_type || 'WISTA'} Membership Fee`,
          amount: Number(p.amount).toFixed(2),
          status: p.payment_status,
          method: p.payment_method,
          transaction_reference: p.transaction_reference,
          payment_reference: p.payment_reference,
          invoice_number: p.invoice?.invoice_number || 'N/A',
          invoice_id: p.invoice?.id,
        }));
        setPayments(formatted);
      } else {
        setPayments(mockPayments);
      }
    } catch (err) {
      setPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const outstanding = payments
    .filter(p => ['PENDING', 'SUBMITTED', 'UNDER_VERIFICATION'].includes(p.status))
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) return;
    try {
      const res = await getInvoiceByIdApi(invoiceId);
      if (res && res.success) {
        setSelectedInvoice(res.data);
      }
    } catch (err) {
      alert('Could not retrieve invoice document.');
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!showSubmitModal || !txnRefInput.trim()) return;
    try {
      const res = await submitPaymentDetailsApi(showSubmitModal.id, {
        payment_method: paymentMethodInput,
        transaction_reference: txnRefInput.trim(),
      });
      if (res && res.success) {
        setActionMessage('Payment proof submitted successfully! Awaiting Finance verification.');
        setShowSubmitModal(null);
        setTxnRefInput('');
        fetchPayments();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Failed to submit payment reference.');
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <Wallet size={14} />
            <span>FINANCIAL RECORD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Payments</h1>
          <p className="text-sm text-slate-300">View your payment history, submit PayNow proof, and view invoices.</p>
        </div>

        {actionMessage && (
          <div className="p-4 bg-[#59D781]/15 border border-[#59D781]/40 text-[#59D781] rounded-lg text-xs font-semibold flex justify-between items-center">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> {actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="font-bold ml-4 text-white hover:text-[#59D781]">✕</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Paid ({new Date().getFullYear()})</p>
            <p className="text-3xl font-[var(--serif)] font-normal text-white">SGD {totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Outstanding Balance</p>
            <p className={`text-3xl font-[var(--serif)] font-normal ${outstanding > 0 ? 'text-[#e85d4a]' : 'text-[#59D781]'}`}>
              SGD {outstanding.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Next Renewal</p>
            <p className="text-lg font-semibold text-white">May {new Date().getFullYear() + 1}</p>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-[var(--serif)] font-normal text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#071626] border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Description & Ref</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Invoice / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">Loading payments...</td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition">
                      <td className="p-4">{p.date}</td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{p.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.payment_reference || p.invoice_number}</p>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#5ee5e9]">SGD {p.amount}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          p.status === 'PAID' ? 'bg-[#59D781]/15 text-[#59D781] border-[#59D781]/30' :
                          p.status === 'SUBMITTED' ? 'bg-[#5ee5e9]/15 text-[#5ee5e9] border-[#5ee5e9]/30' :
                          'bg-[#e85d4a]/15 text-[#e85d4a] border-[#e85d4a]/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === 'PENDING' ? (
                          <button
                            onClick={() => setShowSubmitModal(p)}
                            className="px-3 py-1.5 bg-[#e85d4a] text-white text-[10px] font-bold tracking-widest uppercase rounded hover:bg-[#f27663] transition cursor-pointer"
                          >
                            Submit PayNow Ref
                          </button>
                        ) : p.invoice_id ? (
                          <button
                            onClick={() => handleDownloadInvoice(p.invoice_id)}
                            className="text-[#5ee5e9] hover:underline text-xs font-semibold"
                          >
                            View Invoice
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#0c243b] border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <h3 className="text-2xl font-[var(--serif)] text-white">Submit Payment Proof</h3>
                <button onClick={() => setShowSubmitModal(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Please transfer <strong className="text-white font-mono">SGD {showSubmitModal.amount}</strong> via PayNow UEN or Bank Transfer to WISTA Singapore.
              </p>

              <div className="bg-[#071626] p-4 rounded-xl border border-white/10 text-xs text-slate-200 space-y-1.5">
                <p><strong>PayNow UEN:</strong> T12SS0099A</p>
                <p><strong>Bank:</strong> DBS Bank Ltd (Singapore)</p>
                <p><strong>Account:</strong> 012-908123-4</p>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Payment Method</label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white"
                  >
                    <option value="PAYNOW">PayNow</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Transaction / Reference No.</label>
                  <input
                    type="text"
                    placeholder="e.g. PAYNOW-20260923-8822"
                    value={txnRefInput}
                    onChange={(e) => setTxnRefInput(e.target.value)}
                    className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white focus:border-[#5ee5e9] focus:outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(null)}
                    className="px-4 py-2 border border-white/20 text-slate-300 text-xs font-bold uppercase rounded hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold uppercase rounded shadow"
                  >
                    Confirm Submission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default Payments;
