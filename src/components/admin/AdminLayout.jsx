import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Calendar, Wallet, MessageSquare, BarChart3, Shield, LogOut, Menu, X, ArrowLeft } from 'lucide-react';

const AdminLayout = ({ children }) => {
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
      <aside className={`portal-sidebar fixed inset-y-0 left-0 z-10 w-64 bg-ink transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full'} flex flex-col h-full`}>
        <div className="p-6 hidden md:block border-b border-white/10">
          <img src="/wista-logo.svg" alt="WISTA Singapore" className="h-10 brightness-0 invert" />
          <div className="mt-4 flex items-center gap-2">
            <Shield size={16} className="text-teal" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavLink to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/applications" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <FileText size={20} />
            <span>Applications</span>
          </NavLink>
          <NavLink to="/admin/members" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Users size={20} />
            <span>Members</span>
          </NavLink>
          <NavLink to="/admin/events" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>
          <NavLink to="/admin/payments" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Wallet size={20} />
            <span>Payments</span>
          </NavLink>
          <NavLink to="/admin/communications" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <MessageSquare size={20} />
            <span>Communications</span>
          </NavLink>
          <NavLink to="/admin/reports" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <BarChart3 size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/admin/users" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Shield size={20} />
            <span>Admin Users</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            View Public Site
          </Link>
          <button className="flex items-center gap-3 px-4 py-2 w-full text-left text-coral hover:bg-coral/10 rounded-md transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="portal-content flex-1 ml-0 md:ml-64 pt-16 md:pt-0 h-full overflow-y-auto bg-ivory">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
