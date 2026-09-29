import React, { useState, useEffect } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { getMyMembershipApi } from '@/services/memberService';
import { IdCard, Printer, Sparkles, QrCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Card = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const res = await getMyMembershipApi();
        if (res && res.success && res.data?.card) {
          setCardData(res.data.card);
        }
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, []);

  const memberFullName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'WISTA Singapore Member'
    : 'Sarah Tan';

  const card = cardData || {
    member_name: memberFullName,
    membership_number: 'WISTA-SG-000001',
    membership_type: 'Individual Member',
    company: 'Oceanic Shipping Pte Ltd',
    valid_thru: '05/2027',
    status: 'ACTIVE',
  };

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <IdCard size={14} />
            <span>MEMBER CREDENTIAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Digital Membership Card</h1>
          <p className="text-sm text-slate-300">Access your digital card for WISTA Singapore events, international conferences, and partner discounts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card Display Container */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-gradient-to-br from-[#0c243b] via-[#163d5a] to-[#071626] border border-[#5ee5e9]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              
              {/* Card Surface */}
              <div className="bg-gradient-to-tr from-[#071626] via-[#0c243b] to-[#163d5a] border border-white/20 rounded-xl p-6 sm:p-7 shadow-2xl relative space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xs font-bold tracking-[0.2em] text-[#5ee5e9] uppercase">WISTA SINGAPORE</h2>
                    <p className="text-xs font-medium text-slate-300 mt-0.5">{card.membership_type}</p>
                  </div>
                  <QrCode size={36} className="text-white/80" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-[var(--serif)] text-2xl text-white font-normal">{card.member_name}</h3>
                  <p className="text-xs text-[#5ee5e9] font-medium">{card.company}</p>
                </div>

                <div className="flex justify-between items-end text-xs text-slate-300 border-t border-white/15 pt-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">MEMBER ID</span>
                    <span className="font-mono font-bold text-white text-sm">{card.membership_number}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">VALID THRU</span>
                    <span className="font-serif font-bold text-[#59D781] text-sm">{card.valid_thru}</span>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#59D781]/15 text-[#59D781] border border-[#59D781]/30 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59D781] animate-pulse" />
                  STATUS: {card.status}
                </span>
                <span className="text-[10px] text-slate-400">Verified WISTA Credential</span>
              </div>

            </div>
          </div>

          {/* Action Details */}
          <div className="lg:col-span-6 space-y-6 w-full">
            <div className="bg-[#0c243b] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-4">
              <h3 className="text-xl font-[var(--serif)] font-normal text-white border-b border-white/10 pb-3">
                Card Actions & Verification
              </h3>

              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Effective Status:</strong> <span className="text-[#59D781] font-bold">{card.status}</span></p>
                <p><strong>Valid Until:</strong> <span className="text-white font-medium">{card.valid_thru}</span></p>
                <p><strong>Issuing Association:</strong> WISTA Singapore (National WISTA Association)</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button 
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
                  <span>Present this card at WISTA Singapore AGMs and Gala Dinners for fast-track entry.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[#59D781] shrink-0 mt-0.5" />
                  <span>Show your card at international WISTA events across 56 countries to claim member privileges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[#59D781] shrink-0 mt-0.5" />
                  <span>Your card remains active as long as your annual membership dues are current.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </MemberLayout>
  );
};

export default Card;
