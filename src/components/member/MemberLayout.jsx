import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, User, CreditCard, Calendar, Wallet, Users, IdCard, LogOut, Menu, X, ArrowLeft } from 'lucide-react';

const MemberLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="portal-layout flex h-screen bg-ivory overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-line w-full fixed top-0 z-20">
        <img src="/wista-logo.svg" alt="WISTA Singapore" className="h-8" />
        <button onClick={toggleMenu} className="p-2 text-ink">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`portal-sidebar fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-line transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full'} flex flex-col h-full`}>
        <div className="p-6 hidden md:block">
          <img src="/wista-logo.svg" alt="WISTA Singapore" className="h-10" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavLink to="/member/dashboard" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/member/profile" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>
          <NavLink to="/member/membership" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <CreditCard size={20} />
            <span>Membership</span>
          </NavLink>
          <NavLink to="/member/events" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>
          <NavLink to="/member/payments" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <Wallet size={20} />
            <span>Payments</span>
          </NavLink>
          <NavLink to="/member/directory" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <Users size={20} />
            <span>Directory</span>
          </NavLink>
          <NavLink to="/member/card" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-ink hover:bg-ivory'}`}>
            <IdCard size={20} />
            <span>Digital Card</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-line space-y-2 bg-white">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:text-blue transition-colors">
            <ArrowLeft size={16} />
            Back to Main Site
          </Link>
          <button className="flex items-center gap-3 px-4 py-2 w-full text-left text-coral hover:bg-red-50 hover:text-coral rounded-md transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="portal-content flex-1 ml-0 md:ml-64 pt-16 md:pt-0 h-full overflow-y-auto bg-ivory">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MemberLayout;
