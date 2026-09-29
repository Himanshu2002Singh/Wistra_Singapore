import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const Communications = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Communications</h1>
          <p className="text-ink/70">Manage announcements, newsletters, and emails to members.</p>
        </div>
        <button className="px-6 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors flex items-center gap-2 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          New Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 bg-blue text-white rounded-md font-medium">All Messages</button>
          <button className="w-full text-left px-4 py-3 text-ink/70 hover:bg-ivory hover:text-ink rounded-md transition-colors">Drafts (2)</button>
          <button className="w-full text-left px-4 py-3 text-ink/70 hover:bg-ivory hover:text-ink rounded-md transition-colors">Scheduled</button>
          <button className="w-full text-left px-4 py-3 text-ink/70 hover:bg-ivory hover:text-ink rounded-md transition-colors">Sent</button>
          
          <div className="pt-6 mt-6 border-t border-line">
            <h3 className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-3 px-2">Templates</h3>
            <button className="w-full text-left px-4 py-2 text-sm text-ink hover:text-blue transition-colors">Membership Renewal</button>
            <button className="w-full text-left px-4 py-2 text-sm text-ink hover:text-blue transition-colors">Event Invitation</button>
            <button className="w-full text-left px-4 py-2 text-sm text-ink hover:text-blue transition-colors">Monthly Newsletter</button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-line divide-y divide-line">
            
            <div className="p-4 md:p-6 hover:bg-ivory/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-bold uppercase tracking-wider">Draft</span>
                  <span className="text-xs text-ink/50">Newsletter</span>
                </div>
                <h3 className="font-semibold text-ink text-lg mb-1">October 2026 Monthly Newsletter</h3>
                <p className="text-sm text-ink/70 mb-2">Updates on recent events, upcoming gala dinner details, and member spotlight...</p>
                <p className="text-xs text-ink/50">Last edited: Today, 10:30 AM by Super Admin</p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <button className="px-3 py-1.5 text-sm bg-blue text-white rounded hover:bg-blue/90">Edit Draft</button>
                <button className="px-3 py-1.5 text-sm border border-line text-ink rounded hover:bg-ivory">Delete</button>
              </div>
            </div>

            <div className="p-4 md:p-6 hover:bg-ivory/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-teal/10 text-teal rounded text-[10px] font-bold uppercase tracking-wider">Sent</span>
                  <span className="text-xs text-ink/50">Announcement</span>
                </div>
                <h3 className="font-semibold text-ink text-lg mb-1">Annual General Meeting 2026 - Save the Date</h3>
                <p className="text-sm text-ink/70 mb-2">Dear Members, Please be informed that the WISTA Singapore AGM will be held on...</p>
                <p className="text-xs text-ink/50">Sent on: 15 Sep 2026, 09:00 AM • Open rate: 68%</p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <button className="px-3 py-1.5 text-sm border border-line text-ink rounded hover:bg-ivory">View Report</button>
              </div>
            </div>

            <div className="p-4 md:p-6 hover:bg-ivory/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-teal/10 text-teal rounded text-[10px] font-bold uppercase tracking-wider">Sent</span>
                  <span className="text-xs text-ink/50">Automated Email</span>
                </div>
                <h3 className="font-semibold text-ink text-lg mb-1">Membership Renewal Reminder (30 Days)</h3>
                <p className="text-sm text-ink/70 mb-2">Automated reminder sent to members whose subscription expires in 30 days.</p>
                <p className="text-xs text-ink/50">Last sent: 14 Sep 2026 • Sent to: 42 recipients</p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <button className="px-3 py-1.5 text-sm border border-line text-ink rounded hover:bg-ivory">Edit Template</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Communications;
