import React, { useCallback, useEffect, useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { getMyMembershipApi } from '@/services/memberService';
import { IdCard, Printer, CheckCircle2, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-[#59D781]/15 text-[#59D781] border-[#59D781]/30',
  PENDING: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  APPROVED_PAYMENT_PENDING: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  RENEWAL_DUE: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  GRACE: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  EXPIRED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
  SUSPENDED: 'bg-red-400/15 text-red-300 border-red-300/30',
  CANCELLED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
  INACTIVE: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
};

const formatDate = (value) => {
  if (!value) return null;
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatStatus = (value) => value ? String(value).replaceAll('_', ' ') : 'Not available';

const Card = () => {
  const { user: authenticatedUser } = useAuth();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  const loadCard = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await getMyMembershipApi();
      if (!response?.success || !response.data) throw new Error('membership_unavailable');
      setMembershipData(response.data);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) setErrorState('unauthenticated');
      else if (status === 403) setErrorState('forbidden');
      else setErrorState('server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCard(); }, [loadCard]);

  const membership = membershipData?.membership;
  const member = membershipData?.user || authenticatedUser || {};
  const profiles = membershipData?.profiles || {};
  const individual = profiles.individual;
  const corporate = profiles.corporate;
  const representative = corporate?.representatives?.find((item) => String(item.user_id) === String(member.id))
    || corporate?.representatives?.find((item) => item.is_primary);
  const status = membershipData?.effective_status || membership?.status;
  const statusStyle = STATUS_STYLES[status] || 'bg-white/10 text-slate-200 border-white/20';
  const memberName = [member.first_name, member.last_name].filter(Boolean).join(' ');
  const membershipType = membership?.membership_type === 'CORPORATE'
    ? 'Corporate Member'
    : membership?.membership_type === 'INDIVIDUAL'
      ? 'Individual Member'
      : null;
  const company = membership?.membership_type === 'CORPORATE'
    ? corporate?.company_name
    : individual?.company;
  const designation = membership?.membership_type === 'CORPORATE'
    ? representative?.designation
    : individual?.designation;
  const profilePhoto = member.profile_photo || individual?.photo_url;
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();
  const startDate = formatDate(membership?.start_date);
  const endDate = formatDate(membership?.end_date);

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <IdCard size={14} />
            <span>MEMBER CREDENTIAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Digital Membership Card</h1>
          <p className="text-sm text-slate-300">View the membership information associated with your WISTA Singapore account.</p>
        </div>

        {loading && <div role="status" className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">Loading your membership card…</div>}

        {!loading && errorState && (
          <div role="alert" className="rounded-xl border border-red-300/30 bg-red-400/10 p-6 text-sm text-red-200">
            <p>{errorState === 'unauthenticated'
              ? 'Your session has expired or you are signed out. Please sign in again.'
              : errorState === 'forbidden'
                ? 'You do not have access to this membership information.'
                : 'We could not load your membership card. Please check your connection and try again.'}</p>
            {errorState !== 'unauthenticated' && <button type="button" onClick={loadCard} className="mt-3 font-semibold underline">Try again</button>}
          </div>
        )}

        {!loading && !errorState && !membership && (
          <div role="status" className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">
            No membership record is associated with your account, so a digital membership card is not available.
          </div>
        )}

        {!loading && !errorState && membership && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-gradient-to-br from-[#0c243b] via-[#163d5a] to-[#071626] border border-[#5ee5e9]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="bg-gradient-to-tr from-[#071626] via-[#0c243b] to-[#163d5a] border border-white/20 rounded-xl p-6 sm:p-7 shadow-2xl relative space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-xs font-bold tracking-[0.2em] text-[#5ee5e9] uppercase">WISTA SINGAPORE</h2>
                      <p className="text-xs font-medium text-slate-300 mt-0.5">{membershipType || 'Membership type unavailable'}</p>
                    </div>
                    <div aria-label="Profile photo" className="w-12 h-12 rounded-full shrink-0 overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center text-sm text-white">
                      {profilePhoto
                        ? <img src={profilePhoto} alt="Your profile" className="w-full h-full object-cover" />
                        : initials || <UserRound size={20} className="text-slate-300" />}
                    </div>
                  </div>

                  <div className="space-y-1 min-h-14">
                    <h3 className="font-[var(--serif)] text-2xl text-white font-normal">{memberName || 'Member name unavailable'}</h3>
                    {company && <p className="text-xs text-[#5ee5e9] font-medium">{company}</p>}
                    {designation && <p className="text-xs text-slate-300">{designation}</p>}
                  </div>

                  <div className="flex justify-between items-end gap-3 text-xs text-slate-300 border-t border-white/15 pt-3">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">MEMBER ID</span>
                      <span className="font-mono font-bold text-white text-sm break-all">{membership.membership_number || 'Not available'}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">VALID THRU</span>
                      <span className="font-serif font-bold text-sm text-white">{endDate || 'Not available'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs pt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border uppercase ${statusStyle}`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                    STATUS: {formatStatus(status)}
                  </span>
                  <span className="text-[10px] text-slate-400 text-right">For display only · Verification unavailable</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 w-full">
              <div className="bg-[#0c243b] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-4">
                <h3 className="text-xl font-[var(--serif)] font-normal text-white border-b border-white/10 pb-3">Card Actions & Verification</h3>

                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>Membership status:</strong> <span className={`font-bold ${status === 'ACTIVE' ? 'text-[#59D781]' : 'text-white'}`}>{formatStatus(status)}</span></p>
                  {startDate && <p><strong>Membership starts:</strong> <span className="text-white font-medium">{startDate}</span></p>}
                  <p><strong>Membership ends:</strong> <span className="text-white font-medium">{endDate || 'Not available'}</span></p>
                  <p><strong>Issuing Association:</strong> WISTA Singapore</p>
                  <p className="text-slate-400">This page does not have a backend member verification service. The card and its details are not independently verifiable by scanning.</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="member-card-print-action w-full py-3.5 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-lg transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>Print / Save Digital Card</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#0c243b] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-3">
                <h3 className="text-xl font-[var(--serif)] font-normal text-white">How to Use Your Digital Card</h3>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#59D781] shrink-0 mt-0.5" />
                    <span>Use the membership details shown here as a reference to your account record.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#59D781] shrink-0 mt-0.5" />
                    <span>Your status and dates reflect the latest membership information returned by WISTA Singapore.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#59D781] shrink-0 mt-0.5" />
                    <span>Printing opens your browser’s print dialog; no separate card download is generated.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default Card;
