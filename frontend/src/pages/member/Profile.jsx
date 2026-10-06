import React, { useCallback, useEffect, useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { User, Camera, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyMembershipApi, updateMyProfileApi } from '@/services/memberService';

const Profile = () => {
  const { checkAuth } = useAuth();

  const [formData, setFormData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [memberType, setMemberType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getMyMembershipApi();
      if (!response?.success || !response.data) throw new Error('profile_unavailable');

      const { data } = response;
      const currentUser = data.user || {};
      const individual = data.profiles?.individual;
      const corporate = data.profiles?.corporate;
      const representative = corporate?.representatives?.find((item) => String(item.user_id) === String(currentUser.id))
        || corporate?.representatives?.find((item) => item.is_primary);
      const privacy = data.privacySettings;

      setFormData({
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        company: individual?.company || corporate?.company_name || '',
        designation: individual?.designation || representative?.designation || '',
        biography: individual?.biography || corporate?.company_description || '',
        linkedin: individual?.linkedin_url || corporate?.website || '',
        showEmail: privacy?.show_email ?? true,
        showPhone: privacy?.show_phone ?? false,
        showCompany: privacy?.show_company ?? true,
        showDesignation: privacy?.show_designation ?? true,
        showBio: privacy?.show_bio ?? true,
        showLinkedin: privacy?.show_linkedin ?? true,
        showPhoto: privacy?.show_photo ?? true,
      });
      setProfilePhoto(currentUser.profile_photo || individual?.photo_url || null);
      setMemberType(data.membership?.membership_type || (individual ? 'INDIVIDUAL' : corporate ? 'CORPORATE' : null));
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) setLoadError('Your session has expired. Please sign in again.');
      else if (status === 403) setLoadError('You are not authorized to view this profile.');
      else if (status === 404) setLoadError('Your member profile could not be found.');
      else setLoadError('We could not load your profile. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSavedSuccess(false);
    try {
      const response = await updateMyProfileApi({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        privacy: {
          show_email: formData.showEmail,
          show_phone: formData.showPhone,
          show_company: formData.showCompany,
          show_designation: formData.showDesignation,
          show_bio: formData.showBio,
          show_linkedin: formData.showLinkedin,
          show_photo: formData.showPhoto,
        },
      });
      if (!response?.success) throw new Error('save_failed');
      await loadProfile();
      await checkAuth();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) setSaveError('Your session has expired. Please sign in again.');
      else if (status === 403) setSaveError('You are not authorized to update this account.');
      else if (status === 400 || status === 409) setSaveError(error.response?.data?.message || 'Please check the information and try again.');
      else setSaveError('We could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${formData?.firstName?.[0] || ''}${formData?.lastName?.[0] || ''}`.toUpperCase() || 'WM';
  const privacyControls = [
    { name: 'showEmail', label: 'Show email address in directory' },
    { name: 'showPhone', label: 'Show mobile phone number in directory' },
    { name: 'showCompany', label: 'Show company in directory' },
    { name: 'showDesignation', label: 'Show designation in directory' },
    { name: 'showBio', label: 'Show biography in directory' },
    { name: 'showLinkedin', label: 'Show LinkedIn profile in directory' },
    { name: 'showPhoto', label: 'Show profile photo in directory' },
  ];

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

        {loading && <div role="status" className="rounded-lg border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">Loading your profile…</div>}
        {!loading && loadError && (
          <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            <p>{loadError}</p>
            <button type="button" onClick={loadProfile} className="mt-3 font-semibold underline">Try again</button>
          </div>
        )}
        {!loading && !loadError && formData && <>

        {savedSuccess && (
          <div className="p-4 bg-[#59D781]/15 border border-[#59D781]/40 rounded-lg text-[#59D781] text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            <span>Profile information updated successfully!</span>
          </div>
        )}
        {saveError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{saveError}</div>}

        {/* Profile Card Container */}
        <div className="bg-[#0c243b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-[#071626] to-[#163d5a] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center border-b border-white/10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#163d5a] to-[#1b9aaa] text-white flex items-center justify-center text-3xl font-[var(--serif)] font-normal border-2 border-[#5ee5e9]/40 shadow-xl">
                {profilePhoto ? <img src={profilePhoto} alt="Your profile" className="h-full w-full rounded-full object-cover" /> : initials}
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 bg-[#e85d4a] hover:bg-[#f27663] text-white p-2 rounded-full border border-white/20 shadow-md cursor-pointer transition"
                title="Profile photo upload is not available yet"
                disabled
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-[var(--serif)] font-normal text-white">
                {[formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Member'}
              </h2>
              <p className="text-sm text-slate-300">
                {[formData.designation, formData.company].filter(Boolean).join(' at ') || 'Professional details not available'}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#59D781]/15 text-[#59D781] border border-[#59D781]/30 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59D781] animate-pulse" />
                  {memberType ? `${memberType} MEMBER` : 'MEMBER'}
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
                    readOnly
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
                    readOnly
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Designation</label>
                  <input 
                    type="text" 
                    name="designation" 
                    value={formData.designation} 
                    readOnly
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">LinkedIn Profile URL</label>
                  <input 
                    type="url" 
                    name="linkedin" 
                    value={formData.linkedin} 
                    readOnly
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-2">Executive Biography</label>
                  <textarea 
                    name="biography" 
                    value={formData.biography} 
                    readOnly
                    rows={4} 
                    className="w-full px-4 py-3 bg-[#071626] border border-white/20 rounded-md text-white focus:border-[#5ee5e9] focus:outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Professional details are read-only here and come from your membership application.</p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#5ee5e9] border-b border-white/10 pb-3 flex items-center gap-2">
                <Shield size={14} />
                <span>03. Directory Privacy Settings</span>
              </h3>
              <p className="text-xs text-slate-300">Choose which profile fields may be shown in the member directory. These preferences are saved to your account.</p>
              <div className="space-y-3 pt-2">
                {privacyControls.map((control) => (
                  <label key={control.name} className="flex items-center gap-3 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      name={control.name}
                      checked={formData[control.name]}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#e85d4a] rounded"
                    />
                    <span>{control.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
              <button 
                type="button" 
                onClick={loadProfile}
                disabled={saving}
                className="px-6 py-3 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold tracking-widest uppercase rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-3 bg-[#e85d4a] hover:bg-[#f27663] disabled:opacity-60 text-white text-xs font-bold tracking-widest uppercase rounded-md transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Save size={16} />
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
        </>}
      </div>
    </MemberLayout>
  );
};

export default Profile;
