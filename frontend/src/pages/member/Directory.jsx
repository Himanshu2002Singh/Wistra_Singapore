import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { Users } from 'lucide-react';

const Directory = () => (
  <MemberLayout>
    <div className="space-y-8 pb-16">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
          <Users size={14} />
          <span>GLOBAL NETWORK</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Member Directory</h1>
        <p className="text-sm text-slate-300">Connect with fellow members across the WISTA network.</p>
      </div>

      <div role="status" className="bg-[#0c243b] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <h2 className="font-[var(--serif)] text-2xl text-white font-normal">Member directory is not available yet</h2>
        <p className="mt-3 text-sm text-slate-300">There is no member directory API available, so member records and profile visibility settings cannot be shown here.</p>
      </div>
    </div>
  </MemberLayout>
);

export default Directory;
