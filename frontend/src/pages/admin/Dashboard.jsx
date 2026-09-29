import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Admin Dashboard</h1>
          <p className="text-ink/70">Overview of WISTA Singapore operations.</p>
        </div>
        <div className="text-sm text-ink/70">
          Last updated: Today, 09:41 AM
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-ink/70 font-medium">Total Members</p>
            <span className="text-teal text-xs font-bold">+12% yoy</span>
          </div>
          <p className="text-3xl font-bold text-ink">342</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-ink/70 font-medium">Active Members</p>
          </div>
          <p className="text-3xl font-bold text-blue">318</p>
          <div className="w-full bg-ivory h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue h-full" style={{ width: '93%' }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-ink/70 font-medium">Pending Applications</p>
            <span className="bg-coral/10 text-coral px-2 py-0.5 rounded text-xs font-bold">Action Needed</span>
          </div>
          <p className="text-3xl font-bold text-coral">15</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-ink/70 font-medium">Revenue This Month</p>
          </div>
          <p className="text-3xl font-bold text-teal">SGD 4,250</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Charts Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-serif text-ink mb-6">Membership Growth</h2>
            <div className="h-64 bg-ivory border border-line rounded flex items-center justify-center">
              <span className="text-ink/50">Chart Area: New vs Renewed Members</span>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-serif text-ink mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a href="/admin/events" className="flex flex-col items-center justify-center p-4 bg-ivory rounded hover:bg-blue hover:text-white transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 group-hover:bg-blue/80 text-blue group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <span className="text-sm font-medium">Create Event</span>
              </a>
              <a href="/admin/communications" className="flex flex-col items-center justify-center p-4 bg-ivory rounded hover:bg-blue hover:text-white transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 group-hover:bg-blue/80 text-blue group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span className="text-sm font-medium">Send Email</span>
              </a>
              <a href="/admin/reports" className="flex flex-col items-center justify-center p-4 bg-ivory rounded hover:bg-blue hover:text-white transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 group-hover:bg-blue/80 text-blue group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
                <span className="text-sm font-medium">Export Data</span>
              </a>
              <a href="/admin/applications" className="flex flex-col items-center justify-center p-4 bg-ivory rounded hover:bg-blue hover:text-white transition-colors group relative">
                <div className="absolute top-2 right-2 w-3 h-3 bg-coral rounded-full"></div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 group-hover:bg-blue/80 text-blue group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <span className="text-sm font-medium">Review Apps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif text-ink">Recent Activity</h2>
              <a href="#" className="text-sm text-blue hover:underline">View All</a>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal/10 text-teal flex flex-shrink-0 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1 0-2 1-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                </div>
                <div>
                  <p className="text-sm text-ink"><span className="font-semibold">New application</span> received from Jane Doe (Corporate).</p>
                  <p className="text-xs text-ink/50 mt-1">10 mins ago</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue/10 text-blue flex flex-shrink-0 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <p className="text-sm text-ink"><span className="font-semibold">Event registration</span> cap reached for "Maritime Tech 2026".</p>
                  <p className="text-xs text-ink/50 mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex flex-shrink-0 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div>
                  <p className="text-sm text-ink"><span className="font-semibold">Payment received</span>: SGD 200 from Sarah Tan for renewal.</p>
                  <p className="text-xs text-ink/50 mt-1">Yesterday, 14:30</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-coral/10 text-coral flex flex-shrink-0 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <p className="text-sm text-ink"><span className="font-semibold">System alert</span>: 45 members expiring in next 30 days.</p>
                  <p className="text-xs text-ink/50 mt-1">Yesterday, 09:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
