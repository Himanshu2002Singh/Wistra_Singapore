import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const Payments = () => {
  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">My Payments</h1>
        <p className="text-ink/70">View your payment history and download invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Total Paid (2026)</p>
          <p className="text-2xl font-bold text-ink">SGD 250.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-coral">SGD 0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line flex flex-col justify-center items-start">
          <p className="text-sm text-ink/70 mb-2">Next Payment Due</p>
          <span className="px-3 py-1 bg-ivory text-ink text-sm rounded-full">Jan 2027</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line">
        <div className="p-6 border-b border-line flex justify-between items-center">
          <h2 className="text-xl font-serif text-ink">Payment History</h2>
          <button className="text-teal text-sm font-medium hover:underline">Download Statement</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-ivory border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70">Date</th>
                <th className="p-4 font-medium text-ink/70">Description</th>
                <th className="p-4 font-medium text-ink/70">Amount</th>
                <th className="p-4 font-medium text-ink/70">Status</th>
                <th className="p-4 font-medium text-ink/70 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="p-4 text-ink">15 Nov 2025</td>
                <td className="p-4 text-ink">Annual Membership Renewal 2026</td>
                <td className="p-4 text-ink">SGD 200.00</td>
                <td className="p-4"><span className="badge-success px-2 py-1 bg-teal/10 text-teal rounded-full text-xs">Paid</span></td>
                <td className="p-4 text-right">
                  <button className="text-blue text-sm hover:underline">Download PDF</button>
                </td>
              </tr>
              <tr>
                <td className="p-4 text-ink">02 Oct 2025</td>
                <td className="p-4 text-ink">Networking Evening & Panel Discussion (VIP Entry)</td>
                <td className="p-4 text-ink">SGD 50.00</td>
                <td className="p-4"><span className="badge-success px-2 py-1 bg-teal/10 text-teal rounded-full text-xs">Paid</span></td>
                <td className="p-4 text-right">
                  <button className="text-blue text-sm hover:underline">Download PDF</button>
                </td>
              </tr>
              <tr>
                <td className="p-4 text-ink">12 Nov 2024</td>
                <td className="p-4 text-ink">Annual Membership Renewal 2025</td>
                <td className="p-4 text-ink">SGD 200.00</td>
                <td className="p-4"><span className="badge-success px-2 py-1 bg-teal/10 text-teal rounded-full text-xs">Paid</span></td>
                <td className="p-4 text-right">
                  <button className="text-blue text-sm hover:underline">Download PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Payments;
