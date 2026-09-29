import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { User, Camera, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.first_name || 'Sarah',
    lastName: user?.last_name || 'Tan',
    email: user?.email || 'sarah.tan@example.com',
    phone: user?.phone || '+65 9123 4567',
    company: 'Oceanic Shipping Pte Ltd',
    designation: 'Operations Director',
    biography: 'Experienced maritime professional with over 15 years in vessel operations and fleet management.',
    linkedin: 'https://linkedin.com/in/sarahtan',
    showEmail: true,
    showPhone: false,
    showCompany: true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const initials = `${formData.firstName?.[0] || 'S'}${formData.lastName?.[0] || 'T'}`.toUpperCase();

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <User size={14} />
            <span>MEMBER ACCOUNT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Profile</h1>
          <p className="text-sm text-slate-300">Manage your personal information, professional details, and directory privacy settings.</p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-[#59D781]/15 border border-[#59D781]/40 rounded-lg text-[#59D781] text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        {/* Profile Card Container */}
        <div className="bg-[#0c243b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-[#071626] to-[#163d5a] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center border-b border-white/10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#163d5a] to-[#1b9aaa] text-white flex items-center justify-center text-3xl font-[var(--serif)] font-normal border-2 border-[#5ee5e9]/40 shadow-xl">
                {initials}
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 bg-[#e85d4a] hover:bg-[#f27663] text-white p-2 rounded-full border border-white/20 shadow-md cursor-pointer transition"
                title="Change Avatar"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-[var(--serif)] font-normal text-white">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-sm text-slate-300">
                {formData.designation} at <span className="text-[#5ee5e9] font-medium">{formData.company}</span>
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#59D781]/15 text-[#59D781] border border-[#59D781]/30 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59D781] animate-pulse" />
                  INDIVIDUAL MEMBER
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
            {/* Section 1 */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#5ee5e9] border-b border-white/10 pb-3 flex items-center gap-2">
                <span>01. Personal Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#5ee5e9] border-b border-white/10 pb-3">
                02. Professional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Company Name</label>
                  <input 
                    type="text" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Designation</label>
                  <input 
                    type="text" 
                    name="designation" 
                    value={formData.designation} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">LinkedIn Profile URL</label>
                  <input 
                    type="url" 
                    name="linkedin" 
                    value={formData.linkedin} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Executive Biography</label>
                  <textarea 
                    name="biography" 
                    value={formData.biography} 
                    onChange={handleChange} 
                    rows={4} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Brief summary of your professional background in maritime, shipping, or trading.</p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#5ee5e9] border-b border-white/10 pb-3 flex items-center gap-2">
                <Shield size={14} />
                <span>03. Directory Privacy Settings</span>
              </h3>
              <p className="text-xs text-slate-300">Control what information is visible to other members in the WISTA Member Directory.</p>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-200">
                  <input 
                    type="checkbox" 
                    name="showEmail" 
                    checked={formData.showEmail} 
                    onChange={handleChange} 
                    className="w-4 h-4 accent-[#e85d4a] rounded" 
                  />
                  <span>Show email address in directory</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-200">
                  <input 
                    type="checkbox" 
                    name="showPhone" 
                    checked={formData.showPhone} 
                    onChange={handleChange} 
                    className="w-4 h-4 accent-[#e85d4a] rounded" 
                  />
                  <span>Show mobile phone number in directory</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-200">
                  <input 
                    type="checkbox" 
                    name="showCompany" 
                    checked={formData.showCompany} 
                    onChange={handleChange} 
                    className="w-4 h-4 accent-[#e85d4a] rounded" 
                  />
                  <span>Show company and designation details</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
              <button 
                type="button" 
                className="px-6 py-3 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold tracking-widest uppercase rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 bg-[#e85d4a] hover:bg-[#f27663] text-white text-xs font-bold tracking-widest uppercase rounded-md transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Profile;
