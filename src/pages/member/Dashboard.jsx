import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { dashboardStats, recentActivity } from '@/data/dashboard';
import { upcomingEvents } from '@/data/events';

const Dashboard = () => {
  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">Welcome back, Sarah</h1>
        <p className="text-ink/70">Here's what's happening with your WISTA Singapore membership.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Membership Status</p>
          <p className="text-2xl font-bold text-teal flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal inline-block"></span>
            Active
          </p>
        </div>
        <div className="stat-card bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Expiry Date</p>
          <p className="text-2xl font-bold text-ink">31 Dec 2026</p>
          <p className="text-xs text-ink/50 mt-1">150 days remaining</p>
        </div>
        <div className="stat-card bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Upcoming Events</p>
          <p className="text-2xl font-bold text-ink">2</p>
          <p className="text-xs text-ink/50 mt-1">Registered events</p>
        </div>
        <div className="stat-card bg-white p-6 rounded-lg shadow-sm border border-line">
          <p className="text-sm text-ink/70 mb-1">Outstanding Payments</p>
          <p className="text-2xl font-bold text-coral">SGD 0.00</p>
          <p className="text-xs text-ink/50 mt-1">All dues clear</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Events */}
          <div className="portal-card bg-white p-6 rounded-lg shadow-sm border border-line">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif text-ink">Upcoming Events</h2>
              <a href="/member/events" className="text-sm text-teal hover:underline">View All</a>
            </div>
            <div className="space-y-4">
              {upcomingEvents?.slice(0, 2).map((event, i) => (
                <div key={i} className="flex gap-4 p-4 border border-line rounded-md hover:bg-ivory/50 transition-colors">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue text-white rounded-md flex flex-col items-center justify-center">
                    <span className="text-xs font-medium uppercase">{new Date(event.date).toLocaleDateString('en-SG', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{new Date(event.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">{event.title}</h3>
                    <p className="text-sm text-ink/70">{event.location}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="badge-primary px-2 py-1 bg-teal/10 text-teal text-xs rounded-full">Registered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="portal-card bg-white p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-serif text-ink mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <a href="/member/profile" className="p-4 bg-ivory rounded-md hover:bg-blue hover:text-white transition-colors group">
                <div className="w-10 h-10 mx-auto bg-white group-hover:bg-blue group-hover:text-white text-blue rounded-full flex items-center justify-center mb-2">P</div>
                <span className="text-sm font-medium">Update Profile</span>
              </a>
              <a href="/member/card" className="p-4 bg-ivory rounded-md hover:bg-blue hover:text-white transition-colors group">
                <div className="w-10 h-10 mx-auto bg-white group-hover:bg-blue group-hover:text-white text-blue rounded-full flex items-center justify-center mb-2">C</div>
                <span className="text-sm font-medium">Digital Card</span>
              </a>
              <a href="/member/directory" className="p-4 bg-ivory rounded-md hover:bg-blue hover:text-white transition-colors group">
                <div className="w-10 h-10 mx-auto bg-white group-hover:bg-blue group-hover:text-white text-blue rounded-full flex items-center justify-center mb-2">D</div>
                <span className="text-sm font-medium">Directory</span>
              </a>
              <a href="/member/events" className="p-4 bg-ivory rounded-md hover:bg-blue hover:text-white transition-colors group">
                <div className="w-10 h-10 mx-auto bg-white group-hover:bg-blue group-hover:text-white text-blue rounded-full flex items-center justify-center mb-2">E</div>
                <span className="text-sm font-medium">Browse Events</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Renewal Reminder (Conditional) */}
          <div className="portal-card bg-blue p-6 rounded-lg shadow-sm text-white">
            <h2 className="text-lg font-serif mb-2">Membership Active</h2>
            <p className="text-sm text-white/80 mb-4">Your membership is valid until December 31, 2026. Renewal will open 60 days before expiry.</p>
            <button className="btn-primary w-full bg-teal hover:bg-teal/90 text-white py-2 rounded-md transition-colors" disabled>
              Renew Membership
            </button>
          </div>

          {/* Recent Activity */}
          <div className="portal-card bg-white p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-serif text-ink mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-teal flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-ink">Registered for <span className="font-semibold">Annual Maritime Gala 2026</span></p>
                  <p className="text-xs text-ink/50 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-teal flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-ink">Updated profile information</p>
                  <p className="text-xs text-ink/50 mt-1">1 week ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-teal flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-ink">Membership renewed for 2026</p>
                  <p className="text-xs text-ink/50 mt-1">1 month ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Dashboard;
