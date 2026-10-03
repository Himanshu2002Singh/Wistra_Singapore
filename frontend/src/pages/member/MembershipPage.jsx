import React, { useCallback, useEffect, useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { CreditCard, CheckCircle2, History } from 'lucide-react';
import { getMyMembershipApi } from '@/services/memberService';
import { getMyApplicationsApi } from '@/services/membershipService';
import { getMyPaymentsApi } from '@/services/paymentService';

const STATUS_STYLES = {
  ACTIVE: 'bg-[#59D781]/15 text-[#59D781] border-[#59D781]/30',
  PENDING: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  APPROVED_PAYMENT_PENDING: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  RENEWAL_DUE: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  GRACE: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  EXPIRED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
  SUSPENDED: 'bg-red-400/15 text-red-300 border-red-300/30',
  CANCELLED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatStatus = (value) => value ? value.replaceAll('_', ' ') : 'Not available';

const MembershipPage = () => {
  const [membershipData, setMembershipData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [relatedDataUnavailable, setRelatedDataUnavailable] = useState(false);

  const loadMembership = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    setRelatedDataUnavailable(false);
    try {
      const response = await getMyMembershipApi();
      if (!response?.success || !response.data) throw new Error('membership_unavailable');
      setMembershipData(response.data);

      const [applicationsResult, paymentsResult] = await Promise.allSettled([
        getMyApplicationsApi(),
        getMyPaymentsApi(),
      ]);
      if (applicationsResult.status === 'fulfilled' && applicationsResult.value?.success) {
        setApplications(applicationsResult.value.data?.applications || []);
      } else {
        setApplications([]);
        setRelatedDataUnavailable(true);
      }
      if (paymentsResult.status === 'fulfilled' && paymentsResult.value?.success) {
        setPayments(paymentsResult.value.data || []);
      } else {
        setPayments([]);
        setRelatedDataUnavailable(true);
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) setErrorState('unauthenticated');
      else if (status === 403) setErrorState('forbidden');
      else if (status === 404) {
        setMembershipData({ membership: null, has_membership: false });
        setApplications([]);
        setPayments([]);
      } else setErrorState('server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembership(); }, [loadMembership]);

  const membership = membershipData?.membership;
  const membershipStatus = membership ? (membershipData.effective_status || membership.status) : null;
  const application = applications.find((item) => String(item.id) === String(membership?.application_id)) || applications[0];
  const payment = payments.find((item) => membership?.application_id && String(item.application_id) === String(membership.application_id)) || payments[0];
  const invoice = payment?.invoice;
  const statusClass = STATUS_STYLES[membershipStatus] || 'bg-white/10 text-slate-200 border-white/20';

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <CreditCard size={14} />
            <span>MEMBER CREDENTIALS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Membership</h1>
          <p className="text-sm text-slate-300">View your membership status and details.</p>
        </div>

        {loading && <div role="status" className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">Loading your membership…</div>}

        {!loading && errorState && (
          <div role="alert" className="rounded-xl border border-red-300/30 bg-red-400/10 p-6 text-sm text-red-200">
            <p>{errorState === 'unauthenticated'
              ? 'Your session has expired or you are signed out. Please sign in again.'
              : errorState === 'forbidden'
                ? 'You do not have access to this membership information.'
                : 'We could not load your membership information. Please try again.'}</p>
            {errorState !== 'unauthenticated' && <button type="button" onClick={loadMembership} className="mt-3 font-semibold underline">Try again</button>}
          </div>
        )}

        {!loading && !errorState && <>
          {relatedDataUnavailable && <div role="status" className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-xs text-amber-100">Some application or payment information could not be loaded. Membership details are shown when available.</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Current Status Card */}
              <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#e85d4a] uppercase">WISTA SINGAPORE CHAPTER</p>
                    <h2 className="text-2xl font-[var(--serif)] font-normal text-white">Current Membership</h2>
                  </div>
                  {membership ? (
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-xs font-bold tracking-wider uppercase ${statusClass}`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {formatStatus(membershipStatus)}
                    </span>
                  ) : <span className="text-xs text-slate-300">No membership record</span>}
                </div>

                {membership ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Membership Category</p>
                        <p className="text-base font-semibold text-white">{membership.membership_type || 'Not available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Membership ID</p>
                        <p className="text-base font-mono font-bold text-white">{membership.membership_number || 'Not available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Start Date</p>
                        <p className="text-base font-semibold text-white">{formatDate(membership.start_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">End Date</p>
                        <p className="text-base font-serif text-[#5ee5e9]">{formatDate(membership.end_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Activation Date</p>
                        <p className="text-base font-semibold text-white">{formatDate(membership.activated_at)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Application Status</p>
                        <p className="text-base font-semibold text-white">{formatStatus(application?.status)}</p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Payment Status</p>
                        <p className="text-base font-semibold text-white">{formatStatus(payment?.payment_status)}</p>
                      </div>
                    </div>

                    <div className="bg-[#071626] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white text-xs">Membership record</p>
                        <p className="text-xs text-slate-300">Status and dates reflect the latest record returned by WISTA Singapore.</p>
                      </div>
                      <button type="button" disabled title="Renewal invoice requests are not available yet" className="px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase rounded-md cursor-not-allowed whitespace-nowrap">
                        Renewal Invoice Unavailable
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#071626] p-5 text-sm text-slate-300">
                    <p>No membership record was found for your account.</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <p>Application status: <span className="font-semibold text-white">{formatStatus(application?.status)}</span></p>
                      <p>Payment status: <span className="font-semibold text-white">{formatStatus(payment?.payment_status)}</span></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Membership History */}
              <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <History size={18} className="text-[#5ee5e9]" />
                  <h2 className="text-xl font-[var(--serif)] font-normal text-white">Membership History</h2>
                </div>

                {membership ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider bg-[#071626]">
                          <th className="p-3.5 font-bold">Period</th>
                          <th className="p-3.5 font-bold">Category</th>
                          <th className="p-3.5 font-bold">Status</th>
                          <th className="p-3.5 font-bold text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-200">
                        <tr className="hover:bg-white/5 transition">
                          <td className="p-3.5">{formatDate(membership.start_date)} – {formatDate(membership.end_date)}</td>
                          <td className="p-3.5 font-medium">{membership.membership_type || 'Not available'}</td>
                          <td className="p-3.5"><span className="font-bold">{formatStatus(membershipStatus)}</span></td>
                          <td className="p-3.5 text-right">
                            {invoice?.invoice_number ? <span className="text-slate-200 font-medium">{invoice.invoice_number}</span> : <span className="text-slate-400">Not available</span>}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-300">Membership history is not available for this account.</p>}
              </div>

            </div>

            {/* Benefits Sidebar */}
            <div className="bg-gradient-to-br from-[#0c243b] via-[#163d5a] to-[#071626] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-white">
              <h2 className="text-2xl font-[var(--serif)] font-normal text-white border-b border-white/15 pb-4">
                Member Benefits
              </h2>
              <div className="flex gap-3 items-start text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-[#5ee5e9] shrink-0 mt-0.5" />
                <span>Benefit details are not included in the membership data available to this page.</span>
              </div>
            </div>
          </div>
        </>}
      </div>
    </MemberLayout>
  );
};

export default MembershipPage;
