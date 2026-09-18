import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const Events = () => {
  return (
    <MemberLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">My Events</h1>
          <p className="text-ink/70">Manage your event registrations and tickets.</p>
        </div>
        <button className="px-4 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors">
          Browse All Events
        </button>
      </div>

      {/* Tabs Placeholder */}
      <div className="flex border-b border-line mb-8">
        <button className="px-6 py-3 border-b-2 border-teal text-teal font-medium">Upcoming (2)</button>
        <button className="px-6 py-3 border-b-2 border-transparent text-ink/70 hover:text-ink">Past Events</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Card 1 */}
        <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden flex flex-col">
          <div className="h-32 bg-blue relative">
            {/* Placeholder for event banner */}
            <div className="absolute top-4 right-4 bg-white/90 text-teal px-3 py-1 rounded-full text-xs font-bold">
              CONFIRMED
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex gap-4 mb-4">
              <div className="w-14 h-14 bg-ivory border border-line rounded-md flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-coral uppercase">Oct</span>
                <span className="text-lg font-bold text-ink">15</span>
              </div>
              <div>
                <h3 className="text-lg font-serif text-ink mb-1">Annual Maritime Leadership Summit</h3>
                <p className="text-sm text-ink/70 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  09:00 AM - 05:00 PM
                </p>
                <p className="text-sm text-ink/70 flex items-center gap-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Marina Bay Sands Expo
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-line flex justify-between items-center">
              <span className="text-sm text-ink/70">Ticket: Standard Member (Free)</span>
              <button className="text-teal hover:underline text-sm font-medium">View E-Ticket</button>
            </div>
          </div>
        </div>

        {/* Event Card 2 */}
        <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden flex flex-col">
          <div className="h-32 bg-ink relative">
            <div className="absolute top-4 right-4 bg-white/90 text-teal px-3 py-1 rounded-full text-xs font-bold">
              CONFIRMED
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex gap-4 mb-4">
              <div className="w-14 h-14 bg-ivory border border-line rounded-md flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-coral uppercase">Nov</span>
                <span className="text-lg font-bold text-ink">05</span>
              </div>
              <div>
                <h3 className="text-lg font-serif text-ink mb-1">Networking Evening & Panel Discussion</h3>
                <p className="text-sm text-ink/70 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  06:30 PM - 09:30 PM
                </p>
                <p className="text-sm text-ink/70 flex items-center gap-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  The American Club Singapore
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-line flex justify-between items-center">
              <span className="text-sm text-ink/70">Ticket: VIP Entry (SGD 50.00)</span>
              <button className="text-teal hover:underline text-sm font-medium">View E-Ticket</button>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Events;
