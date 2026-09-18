import React from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const Card = () => {
  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">Digital Membership Card</h1>
        <p className="text-ink/70">Access your digital card for WISTA Singapore events and partner discounts.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Card Display */}
        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="membership-card bg-gradient-to-br from-blue to-ink rounded-xl shadow-xl overflow-hidden text-white relative aspect-[1.58/1]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="p-6 sm:p-8 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-auto">
                <div>
                  <h2 className="text-2xl font-serif tracking-wider mb-1 text-white">WISTA</h2>
                  <p className="text-xs tracking-[0.2em] text-white/70 uppercase">Singapore</p>
                </div>
                <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200"></div> {/* QR Placeholder */}
                </div>
              </div>

              <div>
                <p className="text-sm text-teal font-medium tracking-widest uppercase mb-1">Individual Member</p>
                <h3 className="text-2xl font-semibold mb-1 text-white">Sarah Tan</h3>
                <p className="text-sm text-white/80 mb-4">Oceanic Shipping Pte Ltd</p>
                
                <div className="flex justify-between items-end border-t border-white/20 pt-4 mt-2">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Member ID</p>
                    <p className="font-mono text-sm">SG-2024-089</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Valid Thru</p>
                    <p className="font-mono text-sm">12/26</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Info */}
        <div className="flex-1 space-y-6 w-full">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
            <h3 className="text-lg font-serif text-ink mb-4">Card Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 bg-teal text-white py-3 rounded-md hover:bg-teal/90 transition-colors font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-ivory text-ink py-3 border border-line rounded-md hover:bg-line/50 transition-colors font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Share Card Details
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.172 13.928H8.828c-1.103 0-2-.897-2-2V10.07c0-1.103.897-2 2-2h6.344c1.103 0 2 .897 2 2v3.858c0 1.103-.897 2-2 2z"/></svg>
                Add to Apple Wallet
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-line">
            <h3 className="text-lg font-serif text-ink mb-2">How to use</h3>
            <ul className="list-disc pl-5 text-sm text-ink/70 space-y-2">
              <li>Present the QR code at registration desks during WISTA events for quick check-in.</li>
              <li>Show this card at partner venues to claim exclusive WISTA Singapore member discounts.</li>
              <li>Your card is valid as long as your membership status is Active.</li>
            </ul>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Card;
