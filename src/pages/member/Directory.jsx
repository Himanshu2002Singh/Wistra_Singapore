import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const mockMembers = [
  { id: 1, name: 'Alice Chen', company: 'Pacific Maritime Ltd', designation: 'CEO', type: 'Corporate Member', initial: 'A' },
  { id: 2, name: 'Beatrice Wong', company: 'Global Shipping Solutions', designation: 'Logistics Director', type: 'Individual Member', initial: 'B' },
  { id: 3, name: 'Clara Ng', company: 'Marine Law & Partners', designation: 'Senior Partner', type: 'Individual Member', initial: 'C' },
  { id: 4, name: 'Diana Lim', company: 'Ocean Tech Innovations', designation: 'CTO', type: 'Corporate Member', initial: 'D' },
  { id: 5, name: 'Eleanor Goh', company: 'Port Operations SG', designation: 'Terminal Manager', type: 'Individual Member', initial: 'E' },
  { id: 6, name: 'Fiona Teo', company: 'Maritime Finance Corp', designation: 'CFO', type: 'Corporate Member', initial: 'F' },
];

const Directory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredMembers = mockMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MemberLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Member Directory</h1>
          <p className="text-ink/70">Connect with fellow WISTA Singapore members.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-line mb-8 filter-bar flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink/50"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search by name or company..." 
            className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:border-teal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:border-teal text-ink">
          <option value="">All Membership Types</option>
          <option value="individual">Individual Member</option>
          <option value="corporate">Corporate Member</option>
        </select>
        <button className="px-6 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors">
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm border border-line p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-ivory border border-line flex items-center justify-center text-xl font-serif text-blue">
                {member.initial}
              </div>
              <div>
                <h3 className="font-semibold text-ink text-lg">{member.name}</h3>
                <p className="text-sm text-teal">{member.designation}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-ink flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink/50"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                {member.company}
              </p>
            </div>
            <div className="pt-4 border-t border-line flex justify-between items-center">
              <span className="text-xs bg-ivory px-2 py-1 rounded text-ink/70">{member.type}</span>
              <button className="text-sm text-blue hover:underline">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </MemberLayout>
  );
};

export default Directory;
