import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { CreditCard, CheckCircle2, ShieldCheck, FileText, ArrowUpRight, History } from 'lucide-react';

const MembershipPage = () => {
  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <CreditCard size={14} />
            <span>MEMBER CREDENTIALS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Membership</h1>
          <p className="text-sm text-slate-300">View your active membership status, renewal terms, and history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Current Status Card */}
            <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#e85d4a] uppercase">WISTA SINGAPORE CHAPTER</p>
                  <h2 className="text-2xl font-[var(--serif)] font-normal text-white">Current Membership</h2>
                </div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#59D781]/15 text-[#59D781] border border-[#59D781]/30 rounded-full text-xs font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#59D781] animate-pulse"></span>
                  Active Member
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Membership Category</p>
                  <p className="text-base font-semibold text-white">Individual Membership</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Membership ID</p>
                  <p className="text-base font-mono font-bold text-white">WISTA-SG-000001</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Start Date</p>
                  <p className="text-base font-semibold text-white">01 Jun 2026</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Valid Until</p>
                  <p className="text-base font-serif text-[#5ee5e9]">31 May 2027</p>
                </div>
              </div>

              <div className="bg-[#071626] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-xs">Annual Membership Paid</p>
                  <p className="text-xs text-slate-300">Your membership is active through 31 May 2027.</p>
                </div>
                <button className="px-4 py-2 bg-[#5ee5e9]/10 border border-[#5ee5e9]/40 text-[#5ee5e9] hover:bg-[#5ee5e9] hover:text-[#0b1f33] text-xs font-bold tracking-widest uppercase rounded-md transition cursor-pointer whitespace-nowrap">
                  Request Renewal Invoice
                </button>
              </div>
            </div>

            {/* Membership History */}
            <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <History size={18} className="text-[#5ee5e9]" />
                <h2 className="text-xl font-[var(--serif)] font-normal text-white">Membership History</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider bg-[#071626]">
                      <th className="p-3.5 font-bold">Period</th>
                      <th className="p-3.5 font-bold">Category</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200">
                    <tr className="hover:bg-white/5 transition">
                      <td className="p-3.5">Jun 2026 - May 2027</td>
                      <td className="p-3.5 font-medium">Individual Member</td>
                      <td className="p-3.5"><span className="text-[#59D781] font-bold">Active</span></td>
                      <td className="p-3.5 text-right">
                        <button className="text-[#5ee5e9] hover:underline inline-flex items-center gap-1 font-medium">
                          <span>INV-2026-001</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition">
                      <td className="p-3.5">Jun 2025 - May 2026</td>
                      <td className="p-3.5 font-medium">Individual Member</td>
                      <td className="p-3.5"><span className="text-slate-400">Completed</span></td>
                      <td className="p-3.5 text-right">
                        <button className="text-[#5ee5e9] hover:underline inline-flex items-center gap-1 font-medium">
                          <span>INV-2025-089</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Benefits Sidebar */}
          <div className="bg-gradient-to-br from-[#0c243b] via-[#163d5a] to-[#071626] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <h2 className="text-2xl font-[var(--serif)] font-normal text-white border-b border-white/15 pb-4">
              Member Benefits
            </h2>
            <ul className="space-y-4 text-xs text-slate-200">
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#59D781] shrink-0 mt-0.5" />
                <span>Full access to WISTA International directory and 56 global chapters</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#59D781] shrink-0 mt-0.5" />
                <span>Member rates for WISTA Singapore networking sessions and Galas</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#59D781] shrink-0 mt-0.5" />
                <span>Exclusive participation in executive roundtables and warship visits</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#59D781] shrink-0 mt-0.5" />
                <span>Voting rights at WISTA Singapore Annual General Meetings</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#59D781] shrink-0 mt-0.5" />
                <span>Leadership exchange and female mentorship programs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default MembershipPage;
