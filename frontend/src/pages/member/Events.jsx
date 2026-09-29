import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { Calendar, MapPin, Clock, CheckCircle2, Ticket, ArrowUpRight } from 'lucide-react';
import eventCard1 from '@/assets/images/wista/events/event-card-1.jpg';
import eventCard2 from '@/assets/images/wista/events/event-card-2.jpg';
import eventCard3 from '@/assets/images/wista/events/event-card-3.jpg';

const Events = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingList = [
    {
      id: 1,
      title: 'WISTA SG AGM & Executive Session',
      date: '15 OCT 2026',
      time: '09:00 AM - 05:00 PM',
      location: 'Singapore Cricket Club',
      ticket: 'Standard Member (Free)',
      status: 'CONFIRMED',
      image: eventCard1,
      isRegistered: true,
    },
    {
      id: 2,
      title: 'WISTA Singapore Annual Gala Dinner',
      date: '20 NOV 2026',
      time: '06:30 PM - 10:00 PM',
      location: 'Marina Bay Sands Ballroom',
      ticket: 'VIP Member Ticket (SGD 50.00)',
      status: 'REGISTRATION OPEN',
      image: eventCard2,
      isRegistered: false,
    },
  ];

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
            <p className="text-sm text-slate-300">Manage your event registrations, invitations, and e-tickets.</p>
          </div>
          <button className="px-5 py-2.5 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-md transition cursor-pointer">
            Browse All Events
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
              activeTab === 'upcoming' 
                ? 'border-[#e85d4a] text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upcoming Events ({upcomingList.length})
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${
              activeTab === 'past' 
                ? 'border-[#e85d4a] text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {upcomingList.map((evt) => (
            <div 
              key={evt.id} 
              className="bg-[#0c243b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img src={evt.image} alt={evt.title} className="w-full h-full object-cover opacity-85 hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c243b] via-transparent to-black/30" />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-md ${
                    evt.isRegistered ? 'bg-[#59D781]/20 text-[#59D781] border-[#59D781]/40' : 'bg-[#5ee5e9]/20 text-[#5ee5e9] border-[#5ee5e9]/40'
                  }`}>
                    {evt.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs font-mono text-[#e85d4a]">
                    <span>{evt.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock size={12} />
                      {evt.time}
                    </span>
                  </div>
                  <h3 className="font-[var(--serif)] text-2xl text-white font-normal">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#5ee5e9]" />
                    {evt.location}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Ticket size={14} className="text-[#5ee5e9]" />
                    {evt.ticket}
                  </span>
                  <button className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-[#5ee5e9] hover:text-white uppercase transition cursor-pointer">
                    <span>E-Ticket</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberLayout>
  );
};

export default Events;
