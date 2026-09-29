import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const mockTransactions = [
  { id: 'TXN-001', date: '2026-09-17 14:30', member: 'Jane Doe', description: 'Membership Renewal 2027', amount: 200.00, status: 'Success', method: 'Stripe' },
  { id: 'TXN-002', date: '2026-09-16 09:15', member: 'Pacific Maritime Ltd', description: 'Corporate Membership 2027 (3 Pax)', amount: 600.00, status: 'Success', method: 'Bank Transfer' },
  { id: 'TXN-003', date: '2026-09-15 11:45', member: 'Alice Chen', description: 'Gala Dinner Ticket VIP', amount: 150.00, status: 'Success', method: 'Stripe' },
  { id: 'TXN-004', date: '2026-09-14 16:20', member: 'Beatrice Wong', description: 'Membership Registration Fee', amount: 50.00, status: 'Failed', method: 'Stripe' },
  { id: 'TXN-005', date: '2026-09-10 10:00', member: 'Clara Ng', description: 'Gala Dinner Ticket Standard', amount: 100.00, status: 'Refunded', method: 'Stripe' }
];

const Payments = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Financial Overview</h1>
          <p className="text-ink/70">Monitor payments, renewals, and event revenues.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-line text-ink rounded-md hover:bg-ivory transition-colors">
            Generate Invoice
          </button>
          <button className="px-4 py-2 bg-blue text-white rounded-md hover:bg-blue/90 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Total Collected (MTD)</p>
          <p className="text-3xl font-bold text-teal">SGD 8,450.00</p>
          <p className="text-xs text-teal mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            +15% from last month
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Outstanding Invoices</p>
          <p className="text-3xl font-bold text-coral">SGD 1,200.00</p>
          <p className="text-xs text-ink/50 mt-2">4 invoices pending</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Refunds (MTD)</p>
          <p className="text-3xl font-bold text-ink">SGD 100.00</p>
          <p className="text-xs text-ink/50 mt-2">1 transaction refunded</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="p-4 border-b border-line flex justify-between items-center bg-ivory/50">
          <h2 className="font-serif text-lg text-ink">Recent Transactions</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Search Txn ID or Member..." className="px-3 py-1.5 text-sm border border-line rounded focus:outline-none focus:border-blue" />
            <select className="px-3 py-1.5 text-sm border border-line rounded focus:outline-none focus:border-blue bg-white">
              <option>All Statuses</option>
              <option>Success</option>
              <option>Failed</option>
              <option>Refunded</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70 text-sm">Date & ID</th>
                <th className="p-4 font-medium text-ink/70 text-sm">Member</th>
                <th className="p-4 font-medium text-ink/70 text-sm">Description</th>
                <th className="p-4 font-medium text-ink/70 text-sm">Method</th>
                <th className="p-4 font-medium text-ink/70 text-sm text-right">Amount</th>
                <th className="p-4 font-medium text-ink/70 text-sm">Status</th>
                <th className="p-4 font-medium text-ink/70 text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockTransactions.map((txn, i) => (
                <tr key={i} className="hover:bg-ivory/30">
                  <td className="p-4">
                    <p className="text-sm text-ink">{new Date(txn.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-ink/50 font-mono">{txn.id}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-ink">{txn.member}</td>
                  <td className="p-4 text-sm text-ink/80">{txn.description}</td>
                  <td className="p-4 text-sm text-ink/60">{txn.method}</td>
                  <td className="p-4 text-sm font-medium text-ink text-right">SGD {txn.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      txn.status === 'Success' ? 'bg-teal/10 text-teal' :
                      txn.status === 'Failed' ? 'bg-coral/10 text-coral' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {txn.status === 'Success' ? (
                      <div className="flex justify-end gap-2">
                        <button className="text-blue text-xs hover:underline">Receipt</button>
                        <button className="text-coral text-xs hover:underline ml-2">Refund</button>
                      </div>
                    ) : (
                      <span className="text-ink/30 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Payments;
