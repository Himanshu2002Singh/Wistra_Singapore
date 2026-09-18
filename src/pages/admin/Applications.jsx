import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const mockApplications = [
  { id: 'APP-001', name: 'Emily Tan', email: 'emily.t@oceanic.sg', type: 'Individual', date: '2026-09-17', status: 'Pending', company: 'Oceanic Lines' },
  { id: 'APP-002', name: 'Amanda Wei', email: 'a.wei@maritime-law.com', type: 'Individual', date: '2026-09-16', status: 'Pending', company: 'Maritime Law LLC' },
  { id: 'APP-003', name: 'Global Logistics Pte Ltd', email: 'admin@globallogistics.sg', type: 'Corporate', date: '2026-09-15', status: 'Pending', company: 'Global Logistics Pte Ltd' },
  { id: 'APP-004', name: 'Rachel Lim', email: 'r.lim@port-authority.gov.sg', type: 'Individual', date: '2026-09-14', status: 'Pending', company: 'Port Authority SG' },
  { id: 'APP-005', name: 'Sea Tech Innovations', email: 'contact@seatech.com', type: 'Corporate', date: '2026-09-12', status: 'Pending', company: 'Sea Tech Innovations' }
];

const Applications = () => {
  const [applications, setApplications] = useState(mockApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  const handleApprove = (id) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
  };

  const handleReject = (id) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'Rejected' } : app));
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Membership Applications</h1>
          <p className="text-ink/70">Review and manage new member applications.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-line mb-8 filter-bar flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink/50"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search applicants..." 
            className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:border-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:border-blue text-ink"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-ivory border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70">Applicant</th>
                <th className="p-4 font-medium text-ink/70">Type</th>
                <th className="p-4 font-medium text-ink/70">Date Applied</th>
                <th className="p-4 font-medium text-ink/70">Status</th>
                <th className="p-4 font-medium text-ink/70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredApps.length > 0 ? (
                filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-ivory/50">
                    <td className="p-4">
                      <p className="font-medium text-ink">{app.name}</p>
                      <p className="text-sm text-ink/70">{app.email}</p>
                      <p className="text-xs text-ink/50 mt-1">{app.company}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-ink bg-ivory px-2 py-1 rounded">{app.type}</span>
                    </td>
                    <td className="p-4 text-sm text-ink">{app.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(app.id)} className="px-3 py-1 bg-teal text-white text-sm rounded hover:bg-teal/90 transition-colors">Approve</button>
                          <button onClick={() => handleReject(app.id)} className="px-3 py-1 bg-white border border-coral text-coral text-sm rounded hover:bg-coral/10 transition-colors">Reject</button>
                        </div>
                      ) : (
                        <button className="text-blue text-sm hover:underline">View Details</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-ink/50">No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Applications;
