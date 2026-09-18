import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { membersList } from '@/data/members';

const Members = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Fallback data if mock isn't available
  const members = membersList || [
    { id: 1, name: 'Alice Chen', email: 'alice@example.com', company: 'Pacific Maritime', type: 'Corporate', status: 'Active', joinedDate: '2023-01-15' },
    { id: 2, name: 'Beatrice Wong', email: 'bea@example.com', company: 'Global Shipping', type: 'Individual', status: 'Active', joinedDate: '2024-03-22' },
    { id: 3, name: 'Clara Ng', email: 'clara@example.com', company: 'Marine Law & Partners', type: 'Individual', status: 'Expired', joinedDate: '2022-11-05' }
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || member.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Members Directory</h1>
          <p className="text-ink/70">Manage all WISTA Singapore members.</p>
        </div>
        <button className="px-4 py-2 bg-blue text-white rounded-md hover:bg-blue/90 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-line mb-8 filter-bar flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink/50"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:border-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:border-blue text-ink"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Individual">Individual</option>
          <option value="Corporate">Corporate</option>
          <option value="Associate">Associate</option>
        </select>
        <select 
          className="border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:border-blue text-ink"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Pending Renewal">Pending Renewal</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-ivory border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70">Member Name</th>
                <th className="p-4 font-medium text-ink/70">Company</th>
                <th className="p-4 font-medium text-ink/70">Type</th>
                <th className="p-4 font-medium text-ink/70">Joined</th>
                <th className="p-4 font-medium text-ink/70">Status</th>
                <th className="p-4 font-medium text-ink/70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-ivory/50">
                  <td className="p-4">
                    <p className="font-medium text-ink">{member.name}</p>
                    <p className="text-sm text-ink/70">{member.email}</p>
                  </td>
                  <td className="p-4 text-sm text-ink">{member.company}</td>
                  <td className="p-4 text-sm text-ink">{member.type}</td>
                  <td className="p-4 text-sm text-ink">{member.joinedDate}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Active' ? 'bg-teal/10 text-teal' :
                      member.status === 'Expired' ? 'bg-coral/10 text-coral' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="text-ink/50 hover:text-blue transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="text-ink/50 hover:text-blue transition-colors" title="View Profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                    </div>
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

export default Members;
