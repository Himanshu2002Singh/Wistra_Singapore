import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { Users, Search, Building, User, Mail, ArrowUpRight } from 'lucide-react';

const mockMembers = [
  { id: 1, name: 'Alice Chen', company: 'Pacific Maritime Ltd', designation: 'CEO', type: 'Corporate Member', initial: 'AC' },
  { id: 2, name: 'Beatrice Wong', company: 'Global Shipping Solutions', designation: 'Logistics Director', type: 'Individual Member', initial: 'BW' },
  { id: 3, name: 'Clara Ng', company: 'Marine Law & Partners', designation: 'Senior Partner', type: 'Individual Member', initial: 'CN' },
  { id: 4, name: 'Diana Lim', company: 'Ocean Tech Innovations', designation: 'CTO', type: 'Corporate Member', initial: 'DL' },
  { id: 5, name: 'Eleanor Goh', company: 'Port Operations SG', designation: 'Terminal Manager', type: 'Individual Member', initial: 'EG' },
  { id: 6, name: 'Fiona Teo', company: 'Maritime Finance Corp', designation: 'CFO', type: 'Corporate Member', initial: 'FT' },
];

const Directory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredMembers = mockMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <Users size={14} />
            <span>GLOBAL NETWORK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Member Directory</h1>
          <p className="text-sm text-slate-300">Connect with fellow female leaders and maritime executives across Singapore.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0c243b] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by member name or company..." 
              className="w-full pl-11 pr-4 py-3 bg-[#071626] border border-white/20 rounded-lg text-white text-xs placeholder:text-slate-500 focus:border-[#5ee5e9] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bg-[#071626] border border-white/20 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-[#5ee5e9]">
            <option value="">All Membership Categories</option>
            <option value="individual">Individual Member</option>
            <option value="corporate">Corporate Member</option>
          </select>
          <button className="px-6 py-3 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-lg transition cursor-pointer">
            Search
          </button>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div 
              key={member.id} 
              className="bg-[#0c243b] border border-white/10 hover:border-[#5ee5e9]/40 rounded-2xl p-6 shadow-2xl transition duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#163d5a] to-[#1b9aaa] border border-[#5ee5e9]/40 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
                    {member.initial}
                  </div>
                  <div>
                    <h3 className="font-[var(--serif)] text-xl text-white group-hover:text-[#5ee5e9] transition">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#5ee5e9] font-medium">{member.designation}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <p className="text-xs text-slate-300 flex items-center gap-2">
                    <Building size={14} className="text-slate-400" />
                    {member.company}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="bg-[#071626] border border-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-slate-300">
                  {member.type}
                </span>
                <button className="text-[#5ee5e9] hover:underline font-semibold flex items-center gap-1">
                  <span>View Profile</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberLayout>
  );
};

export default Directory;
