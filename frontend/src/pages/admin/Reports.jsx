import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const Reports = () => {
  const reportTypes = [
    {
      title: 'Membership Report',
      description: 'Comprehensive data on active members, growth trends, demographics, and membership types.',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5c-1 0-2 1-2 2v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    {
      title: 'Financial Report',
      description: 'Revenue summaries, outstanding invoices, event profitability, and payment method breakdowns.',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
    },
    {
      title: 'Events Report',
      description: 'Attendance rates, registration statistics, revenue per event, and feedback summaries.',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    },
    {
      title: 'Communications Report',
      description: 'Email open rates, click-through metrics, and engagement statistics for campaigns.',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    }
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">Reports & Analytics</h1>
        <p className="text-ink/70">Generate, view, and export data reports for WISTA Singapore.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-line flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-ivory rounded-full flex items-center justify-center text-blue">
                {report.icon}
              </div>
              <h2 className="text-xl font-serif text-ink">{report.title}</h2>
            </div>
            <p className="text-sm text-ink/70 mb-6 flex-1">{report.description}</p>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-ink/70 mb-1">Date Range</label>
                  <select className="w-full text-sm border border-line rounded px-3 py-2 bg-white focus:outline-none focus:border-blue text-ink">
                    <option>Last 30 Days</option>
                    <option>This Quarter</option>
                    <option>Year to Date (2026)</option>
                    <option>Previous Year (2025)</option>
                    <option>Custom Range...</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t border-line">
                <button className="px-4 py-2 bg-blue text-white text-sm rounded hover:bg-blue/90 transition-colors font-medium">
                  Generate Report
                </button>
                <button className="px-4 py-2 bg-white border border-line text-ink text-sm rounded hover:bg-ivory transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export CSV
                </button>
                <button className="px-4 py-2 bg-white border border-line text-ink text-sm rounded hover:bg-ivory transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default Reports;
