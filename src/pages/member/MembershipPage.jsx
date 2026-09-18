import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const MembershipPage = () => {
  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">My Membership</h1>
        <p className="text-ink/70">View your current membership status and history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-line p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-line gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Current Membership</h2>
                <p className="text-ink/70">WISTA Singapore</p>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-teal"></span>
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-ink/50 mb-1">Membership Type</p>
                <p className="font-semibold text-ink">Individual Member</p>
              </div>
              <div>
                <p className="text-sm text-ink/50 mb-1">Member ID</p>
                <p className="font-semibold text-ink">WISTA-SG-2024-089</p>
              </div>
              <div>
                <p className="text-sm text-ink/50 mb-1">Start Date</p>
                <p className="font-semibold text-ink">01 Jan 2026</p>
              </div>
              <div>
                <p className="text-sm text-ink/50 mb-1">Valid Until</p>
                <p className="font-semibold text-ink">31 Dec 2026</p>
              </div>
            </div>

            <div className="bg-ivory p-4 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">Auto-renewal is off</p>
                <p className="text-sm text-ink/70">Your membership will expire on 31 Dec 2026.</p>
              </div>
              <button className="px-4 py-2 border border-teal text-teal hover:bg-teal hover:text-white rounded-md transition-colors whitespace-nowrap">
                Enable Auto-renew
              </button>
            </div>
          </div>

          {/* Membership History */}
          <div className="bg-white rounded-lg shadow-sm border border-line p-6 md:p-8">
            <h2 className="text-xl font-serif text-ink mb-6">Membership History</h2>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 font-medium text-ink/70">Period</th>
                    <th className="pb-3 font-medium text-ink/70">Type</th>
                    <th className="pb-3 font-medium text-ink/70">Status</th>
                    <th className="pb-3 font-medium text-ink/70 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-4">Jan 2026 - Dec 2026</td>
                    <td className="py-4">Individual</td>
                    <td className="py-4"><span className="text-teal text-sm">Active</span></td>
                    <td className="py-4 text-right">
                      <a href="#" className="text-blue text-sm hover:underline">View Invoice</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Jan 2025 - Dec 2025</td>
                    <td className="py-4">Individual</td>
                    <td className="py-4"><span className="text-ink/50 text-sm">Expired</span></td>
                    <td className="py-4 text-right">
                      <a href="#" className="text-blue text-sm hover:underline">View Invoice</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4">Jan 2024 - Dec 2024</td>
                    <td className="py-4">Individual</td>
                    <td className="py-4"><span className="text-ink/50 text-sm">Expired</span></td>
                    <td className="py-4 text-right">
                      <a href="#" className="text-blue text-sm hover:underline">View Invoice</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Benefits Sidebar */}
        <div className="bg-blue text-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-serif mb-6">Member Benefits</h2>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <span className="text-teal font-bold mt-0.5">✓</span>
              <span className="text-sm text-white/90">Access to WISTA International network and directory</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-teal font-bold mt-0.5">✓</span>
              <span className="text-sm text-white/90">Discounted rates for WISTA Singapore events and galas</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-teal font-bold mt-0.5">✓</span>
              <span className="text-sm text-white/90">Exclusive networking sessions with industry leaders</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-teal font-bold mt-0.5">✓</span>
              <span className="text-sm text-white/90">Voting rights at Annual General Meetings</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-teal font-bold mt-0.5">✓</span>
              <span className="text-sm text-white/90">Mentorship program opportunities</span>
            </li>
          </ul>
        </div>
      </div>
    </MemberLayout>
  );
};

export default MembershipPage;
