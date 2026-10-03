import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { Calendar, Ticket } from 'lucide-react';

const Events = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
              <Calendar size={14} />
              <span>EVENTS & SESSIONS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Events</h1>
            <p className="text-sm text-slate-300">Event listings and registration services are not yet available in the member portal.</p>
          </div>
          <button
            type="button"
            disabled
            title="Event listings are not available yet"
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase rounded-md cursor-not-allowed"
          >
            Events Unavailable
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            aria-pressed={activeTab === 'upcoming'}
            className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
              activeTab === 'upcoming'
                ? 'border-[#e85d4a] text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upcoming Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            aria-pressed={activeTab === 'past'}
            className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
              activeTab === 'past'
                ? 'border-[#e85d4a] text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Honest empty state: this backend has no event catalog or member registration APIs. */}
        <div className="bg-[#0c243b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-64 flex items-center justify-center p-8">
          <div className="max-w-lg text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#5ee5e9]/10 border border-[#5ee5e9]/20 flex items-center justify-center">
              {activeTab === 'upcoming' ? <Calendar size={20} className="text-[#5ee5e9]" /> : <Ticket size={20} className="text-[#5ee5e9]" />}
            </div>
            <h2 className="font-[var(--serif)] text-2xl text-white font-normal">
              {activeTab === 'upcoming' ? 'Event listings are not available yet' : 'Registration history is not available yet'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeTab === 'upcoming'
                ? 'The member API does not currently provide an event catalog or event details. No sample events are being shown.'
                : 'The member API does not currently provide event registrations or attendance history.'}
            </p>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Events;
