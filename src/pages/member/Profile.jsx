import React, { useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';

const Profile = () => {
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Tan',
    email: 'sarah.tan@example.com',
    phone: '+65 9123 4567',
    company: 'Oceanic Shipping Pte Ltd',
    designation: 'Operations Director',
    biography: 'Experienced maritime professional with over 15 years in vessel operations and fleet management.',
    linkedin: 'https://linkedin.com/in/sarahtan',
    showEmail: true,
    showPhone: false,
    showCompany: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save
    alert('Profile updated successfully!');
  };

  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">My Profile</h1>
        <p className="text-ink/70">Manage your personal information and privacy settings.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        {/* Profile Header */}
        <div className="bg-ivory p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center border-b border-line">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue text-white flex items-center justify-center text-3xl font-serif overflow-hidden">
              ST
            </div>
            <button className="absolute bottom-0 right-0 bg-white border border-line p-1.5 rounded-full text-ink hover:text-teal shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </button>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-serif text-ink">{formData.firstName} {formData.lastName}</h2>
            <p className="text-ink/70 mb-2">{formData.designation} at {formData.company}</p>
            <span className="inline-block bg-teal/10 text-teal px-3 py-1 rounded-full text-xs font-medium">Individual Member</span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-ink mb-4 border-b border-line pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" required />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" required />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" required />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-ink mb-4 border-b border-line pb-2">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-ink mb-1">Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">LinkedIn Profile URL</label>
                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Biography</label>
                <textarea name="biography" value={formData.biography} onChange={handleChange} rows="4" className="w-full p-2 border border-line rounded-md focus:outline-none focus:border-teal"></textarea>
                <p className="text-xs text-ink/50 mt-1">Brief summary of your professional background.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-ink mb-4 border-b border-line pb-2">Directory Privacy Settings</h3>
            <p className="text-sm text-ink/70 mb-4">Control what information is visible to other members in the Member Directory.</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" name="showEmail" checked={formData.showEmail} onChange={handleChange} className="w-4 h-4 text-teal border-line rounded" />
                <span className="text-sm text-ink">Show email address</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" name="showPhone" checked={formData.showPhone} onChange={handleChange} className="w-4 h-4 text-teal border-line rounded" />
                <span className="text-sm text-ink">Show phone number</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" name="showCompany" checked={formData.showCompany} onChange={handleChange} className="w-4 h-4 text-teal border-line rounded" />
                <span className="text-sm text-ink">Show company and designation</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-line pt-6">
            <button type="button" className="px-6 py-2 border border-line text-ink rounded-md hover:bg-ivory transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </MemberLayout>
  );
};

export default Profile;
