import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '@/components/member/MemberLayout';
import { getMyMembershipApi } from '@/services/memberService';
import { getMyApplicationsApi } from '@/services/membershipService';
import { getMyPaymentsApi } from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar, 
  User, 
  CreditCard, 
  Wallet, 
  Users, 
  IdCard, 
  ShieldCheck, 
  Globe, 
  Sparkles,
  ArrowRight,
  QrCode
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [membershipData, setMembershipData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setLoadError(false);
    const results = await Promise.allSettled([
      getMyMembershipApi(),
      getMyApplicationsApi(),
      getMyPaymentsApi(),
    ]);
    let loaded = false;
    if (results[0].status === 'fulfilled' && results[0].value?.success) {
      setMembershipData(results[0].value.data);
      loaded = true;
    }
    if (results[1].status === 'fulfilled' && results[1].value?.success) {
      setApplications(results[1].value.data?.applications || []);
      loaded = true;
    }
    if (results[2].status === 'fulfilled' && results[2].value?.success) {
      setPayments(results[2].value.data || []);
      loaded = true;
    }
    setLoadError(!loaded);
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  const dash = membershipData?.dashboard || {};
  const member = membershipData?.user || user || {};
  const memberFirstName = member.first_name || '';
  const memberFullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || '—';
  const profile = membershipData?.profiles?.individual || membershipData?.profiles?.corporate;
  const company = dash.company && dash.company !== 'N/A' ? dash.company : (profile?.company || profile?.company_name || '—');
  const latestApplication = applications[0];
  const latestPayment = payments[0];
  const card = membershipData?.card;
  const membershipStatus = membershipData?.membership ? (dash.status || membershipData.effective_status) : (latestApplication?.status || 'NOT AVAILABLE');
  const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
  const paymentAmount = latestPayment?.invoice?.total ?? latestPayment?.amount;
  const paymentCurrency = latestPayment?.invoice?.currency || latestPayment?.currency || 'SGD';

  return (
    <MemberLayout>
      <div className="w-full text-white pb-20">
        <div className="w-full max-w-[1600px] mx-auto space-y-10">
          {loadError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">We could not load your member information. <button onClick={fetchDashboard} className="underline font-semibold">Try again</button></div>}
          {loading && <div role="status" className="text-sm text-slate-300">Loading your member information…</div>}

          {/* ==================================================
              SECTION 1: EDITORIAL HERO / WELCOME AREA
             ================================================== */}
          <section className="relative overflow-hidden bg-[#071626] border border-white/10 rounded-2xl p-6 sm:p-10 md:p-12 shadow-2xl">
            {/* Background Parallax Wave Grid Accent */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#5ee5e9_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Typography */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-[#e85d4a] text-xs font-bold tracking-[0.2em] uppercase">
                  <span className="w-6 h-[1.5px] bg-[#e85d4a]" />
                  <span>MEMBER PORTAL / 01</span>
                </div>

                <h1 className="font-[var(--serif)] text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.05] tracking-tight text-white">
                  Welcome, <br />
                  <em className="italic text-[#5ee5e9] font-serif">{memberFirstName || 'Member'}.</em>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  Welcome to your WISTA Singapore member portal. Your account and membership information is shown below.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold tracking-wider uppercase">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#163d5a] border border-[#5ee5e9]/30 text-[#5ee5e9]">
                    <ShieldCheck size={14} className="text-[#59D781]" />
                    <span>{membershipData?.membership ? membershipStatus : (latestApplication ? `APPLICATION ${latestApplication.status}` : 'MEMBER ACCOUNT')}</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ID: {dash.membership_number || 'Not available'}
                  </span>
                </div>
              </div>

              {/* Right Column: Maritime Connectivity Vector */}
              <div className="lg:col-span-4 hidden lg:flex justify-center relative">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  {/* Outer Pulsing Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#1b9aaa]/70 animate-ping opacity-70" />
                  <div className="absolute inset-4 rounded-full border-2 border-[#0d6472]/75 animate-spin [animation-duration:20s]" />
                  <div className="absolute inset-10 rounded-full border-2 border-dashed border-[#e85d4a]/65" />

                  {/* Central Maritime Badge */}
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#163d5a] to-[#071626] border border-[#5ee5e9]/50 flex flex-col items-center justify-center text-center p-2 shadow-2xl z-10">
                    <Globe size={28} className="text-[#5ee5e9] mb-1 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-widest text-white uppercase">WISTA</span>
                    <span className="text-[8px] text-slate-300 font-mono">SINGAPORE</span>
                  </div>

                  {/* Orbiting Nodes */}
                  <div className="absolute top-2 left-10 w-3 h-3 rounded-full bg-[#59D781] shadow-[0_0_10px_#59D781]" />
                  <div className="absolute bottom-6 right-8 w-2.5 h-2.5 rounded-full bg-[#e85d4a] shadow-[0_0_8px_#e85d4a]" />
                  <div className="absolute top-1/2 right-1 w-2 h-2 rounded-full bg-[#5ee5e9]" />
                </div>
              </div>
            </div>
          </section>


          {/* ==================================================
              SECTION 2: MEMBERSHIP STATUS — HIGH-IMPACT HERO FEATURE
             ================================================== */}
          <section className="relative bg-gradient-to-r from-[#0c243b] via-[#102e4c] to-[#0c243b] border border-[#5ee5e9]/30 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
            {/* WISTA Watermark */}
            <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-white font-[var(--serif)] text-[160px] leading-none select-none">
              WISTA
            </div>

            <div className="relative z-10 space-y-8">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/15 pb-6">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#e85d4a] mb-1">
                    MEMBERSHIP STATUS & CREDENTIALS
                  </p>
                  <h2 className="font-[var(--serif)] text-3xl sm:text-4xl text-white font-normal">
                    {membershipData?.membership ? 'Membership Profile' : 'Membership Information'}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest bg-white/10 text-slate-200 border border-white/20 uppercase shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    STATUS: {membershipStatus}
                  </span>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">MEMBER NAME</span>
                  <p className="text-xl font-serif text-white font-medium">{memberFullName}</p>
                  <p className="text-xs text-[#5ee5e9] font-medium">{company}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">MEMBERSHIP NUMBER</span>
                  <p className="text-lg font-mono text-white font-bold tracking-wider">{dash.membership_number || 'Not available'}</p>
                  <p className="text-xs text-slate-400">WISTA Singapore Chapter</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">MEMBERSHIP CATEGORY</span>
                  <p className="text-lg font-semibold text-white">
                    {dash.membership_type ? (dash.membership_type === 'CORPORATE' ? 'Corporate Member' : 'Individual Member') : 'Not available'}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">Application: {latestApplication?.status || 'Not available'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">VALIDITY & RENEWAL</span>
                  <p className="text-lg font-serif text-white">
                    {formatDate(dash.expiry_date)}
                  </p>
                  {dash.days_remaining !== undefined && membershipData?.membership && <span className="inline-block text-[11px] font-medium text-[#5ee5e9] bg-[#5ee5e9]/10 px-2.5 py-0.5 rounded border border-[#5ee5e9]/20">{dash.days_remaining} Days Remaining</span>}
                </div>
              </div>

              {/* Quick Card Action Footer */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/10">
                <p className="text-xs text-slate-300">
                  {card ? `Membership card status: ${card.status || 'Not available'}.` : 'Digital membership card details are not available yet.'}
                </p>
                <Link 
                  to="/member/card"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-md transition shadow-md cursor-pointer shrink-0"
                >
                  <IdCard size={16} />
                  <span>View Digital Card</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </section>


          {/* ==================================================
              SECTION 3: COMPACT MEMBER ACTIVITY / OVERVIEW STRIP
             ================================================== */}
          <section className="bg-[#071626] border border-white/10 rounded-xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Strip Item 1 */}
              <div className="space-y-1.5 pb-4 md:pb-0 md:pr-6">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#5ee5e9]">
                  <CheckCircle2 size={13} className="text-[#59D781]" />
                  <span>01. MEMBERSHIP STATUS</span>
                </div>
                <p className="font-serif text-lg text-white font-medium">{membershipStatus}</p>
                <p className="text-xs text-slate-400">{membershipData?.membership ? `Valid through ${formatDate(dash.expiry_date)}` : (latestApplication ? `Application status: ${latestApplication.status}` : 'Membership status not available')}</p>
              </div>

              {/* Strip Item 2 */}
              <div className="space-y-1.5 pt-4 md:pt-0 md:px-6">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#5ee5e9]">
                  <Calendar size={13} className="text-[#5ee5e9]" />
                  <span>02. NEXT UPCOMING EVENT</span>
                </div>
                <p className="font-serif text-lg text-white font-medium">Not available</p>
                <p className="text-xs text-slate-400">Member event information is not connected to the backend yet.</p>
              </div>

              {/* Strip Item 3 */}
              <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#5ee5e9]">
                  <Wallet size={13} className="text-[#59D781]" />
                  <span>03. FINANCIAL STATUS</span>
                </div>
                <p className="font-serif text-lg text-white font-medium">{latestPayment ? `${paymentCurrency} ${Number(paymentAmount || 0).toFixed(2)} • ${latestPayment.payment_status}` : 'No payment record available'}</p>
                <p className="text-xs text-slate-400 font-medium">Latest payment record</p>
              </div>

            </div>
          </section>


          {/* ==================================================
              SECTION 4: EDITORIAL QUICK ACTIONS
             ================================================== */}
          <section className="member-dashboard-section space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#5ee5e9]">
                PORTAL ACTIONS & SERVICES
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Select an operation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'View Membership', to: '/member/membership', icon: CreditCard },
                { label: 'Update Profile', to: '/member/profile', icon: User },
                { label: 'Browse Events', to: '/member/events', icon: Calendar },
                { label: 'Digital Card', to: '/member/card', icon: IdCard },
                { label: 'View Payments', to: '/member/payments', icon: Wallet },
                { label: 'Member Directory', to: '/member/directory', icon: Users },
              ].map((action) => {
                const IconComp = action.icon;
                return (
                  <Link 
                    key={action.label}
                    to={action.to}
                    className="group bg-[#0c243b] hover:bg-[#163d5a] border border-white/10 hover:border-[#5ee5e9]/40 p-4 rounded-xl transition duration-200 flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#5ee5e9]/20 text-[#5ee5e9] transition">
                        <IconComp size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white tracking-wide mt-3">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>


          {/* ==================================================
              SECTION 5: UPCOMING EVENTS (EDITORIAL COMPOSITION)
             ================================================== */}
          <section className="member-dashboard-section space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-white/15 pb-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#e85d4a] mb-1">
                  CALENDAR & SESSIONS
                </p>
                <h2 className="font-[var(--serif)] text-3xl text-white font-normal">
                  Upcoming Member Events
                </h2>
              </div>
              <Link 
                to="/member/events"
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-[#5ee5e9] hover:text-white transition"
              >
                <span>View Full Event Calendar</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">
              No member event feed is available from the backend yet. Use the event calendar to view available events.
            </div>
          </section>


          {/* ==================================================
              SECTION 6: MEMBER NETWORK & DIGITAL CARD PREVIEW (2-COLUMN GRID)
             ================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

            {/* Left Box: WISTA Network */}
            <div className="bg-gradient-to-br from-[#0c243b] to-[#071626] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#5ee5e9]">
                  <Globe size={14} />
                  <span>MARITIME ECOSYSTEM</span>
                </div>
                
                <h3 className="font-[var(--serif)] text-3xl text-white font-normal">
                  Your WISTA Network
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  Browse the member directory to find member profiles that are available to your account.
                </p>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/10">
                  <div>
                    <span className="font-[var(--serif)] text-3xl text-[#5ee5e9]">—</span>
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Singapore Members</p>
                  </div>
                  <div>
                    <span className="font-[var(--serif)] text-3xl text-[#e85d4a]">—</span>
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Global Countries</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10">
                <Link 
                  to="/member/directory"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition"
                >
                  <Users size={16} />
                  <span>Explore Member Directory</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Box: Digital Card Preview */}
            <div className="bg-gradient-to-br from-[#0a1e33] via-[#163d5a] to-[#071626] border border-[#5ee5e9]/40 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#59D781]">
                    <Sparkles size={14} />
                    <span>DIGITAL CREDENTIAL</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#5ee5e9] bg-[#5ee5e9]/10 px-2 py-0.5 rounded border border-[#5ee5e9]/30">
                    {card?.status || 'NOT AVAILABLE'}
                  </span>
                </div>

                {/* Card Preview Component Container */}
                <div className="bg-gradient-to-tr from-[#071626] via-[#0c243b] to-[#163d5a] border border-white/20 rounded-xl p-5 shadow-2xl relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#5ee5e9] uppercase">WISTA SINGAPORE</p>
                      <p className="text-xs font-medium text-slate-300">{card?.membership_type || 'Membership card unavailable'}</p>
                    </div>
                    <QrCode size={28} className="text-white/70" />
                  </div>

                  <div>
                    <p className="font-[var(--serif)] text-xl text-white font-normal">{card?.member_name || memberFullName}</p>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">{card?.membership_number || 'Not available'}</p>
                  </div>

                  <div className="flex justify-between items-end text-[10px] text-slate-400 border-t border-white/10 pt-2">
                    <span>COMPANY: <strong className="text-white">{card?.company || 'Not available'}</strong></span>
                    <span>VALID THRU: <strong className="text-[#59D781]">{card?.valid_thru || 'Not available'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10">
                <Link 
                  to="/member/card"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-lg transition shadow-lg cursor-pointer"
                >
                  <IdCard size={16} />
                  <span>Open Full Digital Card</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

          </section>


          {/* ==================================================
              SECTION 7: UNDERSTATED PORTAL FOOTER
             ================================================== */}
          <footer className="mt-16 pt-8 border-t border-white/10 text-center space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-300">
              WISTA SINGAPORE • MEMBER PORTAL
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Women's International Shipping & Trading Association — Empowering female leaders across the maritime ecosystem.
            </p>
            <div className="flex justify-center gap-6 text-[11px] text-slate-400 pt-2">
              <Link to="/member/profile" className="hover:text-white transition">Member Support</Link>
              <span>•</span>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('WISTA Privacy Policy is active.'); }} className="hover:text-white transition">Privacy Policy</a>
              <span>•</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('WISTA Terms of Membership apply.'); }} className="hover:text-white transition">Terms of Use</a>
            </div>
            <p className="text-[10px] text-slate-400 pt-2">
              © {new Date().getFullYear()} WISTA Singapore. All rights reserved.
            </p>
          </footer>

        </div>
      </div>
    </MemberLayout>
  );
}
