import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const mockEvents = [
  { id: 1, title: 'Annual Maritime Leadership Summit', date: '2026-10-15', location: 'Marina Bay Sands Expo', registrations: 120, capacity: 150, status: 'Published' },
  { id: 2, title: 'Networking Evening & Panel Discussion', date: '2026-11-05', location: 'The American Club Singapore', registrations: 85, capacity: 100, status: 'Published' },
  { id: 3, title: 'End of Year Gala Dinner', date: '2026-12-10', location: 'Fullerton Hotel', registrations: 45, capacity: 200, status: 'Draft' },
  { id: 4, title: 'Port Tour & Operations Briefing', date: '2026-08-20', location: 'Tuas Mega Port', registrations: 40, capacity: 40, status: 'Completed' }
];

const Events = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Event Management</h1>
          <p className="text-ink/70">Create and manage WISTA Singapore events.</p>
        </div>
        <button className="px-6 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors flex items-center gap-2 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Event
        </button>
      </div>

      {/* Tabs Placeholder */}
      <div className="flex border-b border-line mb-8">
        <button className="px-6 py-3 border-b-2 border-blue text-blue font-medium">All Events (4)</button>
        <button className="px-6 py-3 border-b-2 border-transparent text-ink/70 hover:text-ink">Upcoming</button>
        <button className="px-6 py-3 border-b-2 border-transparent text-ink/70 hover:text-ink">Drafts</button>
        <button className="px-6 py-3 border-b-2 border-transparent text-ink/70 hover:text-ink">Completed</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-ivory border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70">Event Details</th>
                <th className="p-4 font-medium text-ink/70">Date & Location</th>
                <th className="p-4 font-medium text-ink/70">Registrations</th>
                <th className="p-4 font-medium text-ink/70">Status</th>
                <th className="p-4 font-medium text-ink/70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockEvents.map(event => (
                <tr key={event.id} className="hover:bg-ivory/50">
                  <td className="p-4">
                    <p className="font-semibold text-ink">{event.title}</p>
                    <p className="text-xs text-ink/50 mt-1">ID: EVT-{202600 + event.id}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink">{new Date(event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-ink/70 mt-1">{event.location}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{event.registrations} / {event.capacity}</span>
                      <div className="w-16 h-2 bg-ivory rounded-full overflow-hidden">
                        <div className={`h-full ${event.registrations >= event.capacity ? 'bg-coral' : 'bg-teal'}`} style={{ width: `${(event.registrations / event.capacity) * 100}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'Published' ? 'bg-teal/10 text-teal' :
                      event.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="text-ink/50 hover:text-blue transition-colors" title="Manage Attendees">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5c-1 0-2 1-2 2v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </button>
                      <button className="text-ink/50 hover:text-blue transition-colors" title="Edit Event">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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

export default Events;
