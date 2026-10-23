import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  CreditCard, 
  Calendar, 
  Wallet, 
  Users, 
  IdCard, 
  LogOut, 
  Menu, 
  X, 
  ArrowLeft,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyApplicationsApi } from '@/services/membershipService';
import { getMyPaymentsApi } from '@/services/paymentService';

const MemberLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState({ clarifications: 0, payments: 0 });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    const [applicationsResult, paymentsResult] = await Promise.allSettled([
      getMyApplicationsApi(),
      getMyPaymentsApi(),
    ]);
    setNotifications((current) => ({
      clarifications: applicationsResult.status === 'fulfilled'
        ? (applicationsResult.value?.data?.applications || []).filter((application) => application.status === 'CLARIFICATION_REQUIRED').length
        : current.clarifications,
      payments: paymentsResult.status === 'fulfilled'
        ? (paymentsResult.value?.data || []).filter((payment) => ['PENDING', 'REJECTED'].includes(payment.payment_status)).length
        : current.payments,
    }));
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60_000);
    window.addEventListener('focus', loadNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [loadNotifications]);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'WISTA Member';

  const userInitials = user && user.first_name
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase()
    : 'WM';

  // Navigation Items (Single consolidated 'Profile' entry for account & privacy settings)
  const navItems = [
    { to: '/member/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/member/profile', label: 'Profile', icon: User },
    { to: '/member/membership', label: 'Membership', icon: CreditCard, notificationKey: 'clarifications' },
    { to: '/member/events', label: 'Events', icon: Calendar },
    { to: '/member/payments', label: 'Payments', icon: Wallet, notificationKey: 'payments' },
    { to: '/member/directory', label: 'Directory', icon: Users },
    { to: '/member/card', label: 'Digital Card', icon: IdCard },
  ];

  const notificationItems = [
    ...(notifications.clarifications > 0 ? [{
      key: 'clarifications', to: '/member/membership', label: 'Clarification requested',
      count: notifications.clarifications, detail: 'Update and resubmit your application.',
    }] : []),
    ...(notifications.payments > 0 ? [{
      key: 'payments', to: '/member/payments', label: 'Payment action needed',
      count: notifications.payments, detail: 'Complete payment or resubmit payment details.',
    }] : []),
  ];
  const notificationCount = notificationItems.reduce((count, item) => count + item.count, 0);

  return (
    <div className="wista-member-portal flex flex-col h-screen w-screen bg-[#0b1f33] text-white overflow-hidden font-sans">
      
      {/* ==================================================
          1. GLOBAL TOP NAVBAR (Spans 100% Viewport Width)
         ================================================== */}
      <header className="w-full h-[76px] md:h-[88px] bg-[#08192b] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between z-50 shrink-0 shadow-md">
        {/* Left Side: Doubled WISTA Logo & Portal Context */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/wista-logo-singapore-white.svg" 
              alt="WISTA Singapore" 
              className="h-14 sm:h-18 w-auto max-h-20 py-1 object-contain" 
              onError={(e) => { e.target.src = '/wista-logo.svg'; }} 
            />
          </Link>
          
          <span className="h-10 w-[1px] bg-white/20 hidden sm:block" />

          <span className="hidden sm:inline-block text-base sm:text-lg lg:text-xl font-bold tracking-[0.2em] text-[#5ee5e9] uppercase">
            MEMBER PORTAL
          </span>
        </div>

        {/* Right Side: Notification, Status Badge, User Avatar */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Notification Icon */}
          <div className="relative">
          <button 
            type="button"
            className="relative p-2 text-slate-300 hover:text-white transition cursor-pointer"
            title={notificationCount > 0 ? `${notificationCount} notifications` : 'Notifications'}
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} items need attention` : 'Notifications'}
            aria-expanded={notificationOpen}
            aria-controls="member-notifications-panel"
            onClick={() => { setNotificationOpen((open) => !open); setUserDropdownOpen(false); }}
          >
            <Bell size={20} />
            {notificationCount > 0 && <span className="member-notification-count" aria-hidden="true">{notificationCount > 99 ? '99+' : notificationCount}</span>}
          </button>
          {notificationOpen && (
            <div id="member-notifications-panel" role="region" aria-label="Member notifications" className="absolute right-0 mt-2 w-72 rounded-lg border border-white/15 bg-[#0c243b] p-4 shadow-2xl z-50 text-xs">
              <p className="mb-3 font-semibold text-white">Notifications</p>
              {notificationItems.length ? <div className="space-y-2">{notificationItems.map((item) => <Link key={item.key} to={item.to} onClick={() => setNotificationOpen(false)} className="block rounded-md border border-white/10 p-3 hover:bg-white/5">
                <span className="flex items-center justify-between gap-3 font-semibold text-white"><span>{item.label}</span><span className="member-notification-pill">{item.count > 99 ? '99+' : item.count}</span></span>
                <span className="mt-1 block text-slate-400">{item.detail}</span>
              </Link>)}</div> : <p className="text-slate-400">You’re all caught up. We’ll show application and payment actions here.</p>}
            </div>
          )}
          </div>

          {/* Active Status Badge */}
          <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider bg-white/5 text-slate-200 border border-white/15 uppercase">
            <span className="w-2 h-2 rounded-full bg-[#5ee5e9]" />
            SIGNED IN
          </span>

          {/* User Profile Pill */}
          <div className="relative">
            <button 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-full bg-white/5 border border-white/10 hover:border-white/25 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#163d5a] to-[#1b9aaa] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] sm:max-w-[160px] truncate hidden xs:inline">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* User Quick Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#0c243b] border border-white/15 rounded-lg shadow-2xl py-2 z-50 animate-fade-in text-xs">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Email unavailable'}</p>
                </div>
                <Link 
                  to="/member/profile" 
                  onClick={() => setUserDropdownOpen(false)}
                  className="block px-4 py-2 text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  My Profile
                </Link>
                <Link 
                  to="/member/card" 
                  onClick={() => setUserDropdownOpen(false)}
                  className="block px-4 py-2 text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  Digital Membership Card
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[#e85d4a] hover:bg-white/10"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Toggle Button */}
          <button 
            onClick={toggleMenu} 
            className="md:hidden p-2 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ==================================================
          2. MAIN BODY AREA BELOW TOP NAVBAR
         ================================================== */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        
        {/* Mobile Drawer Overlay Backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-x-0 bottom-0 top-[76px] md:top-[88px] bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fade-in"
          />
        )}

        {/* Sidebar (Starts Below Global Top Navbar, Fixed Width 256px) */}
        <aside className={`fixed md:static top-[76px] bottom-0 left-0 z-40 w-64 bg-[#071626] border-r border-white/10 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col h-auto md:h-full shrink-0`}>
          
          {/* Sidebar Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[9px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">
              PORTAL NAVIGATION
            </p>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const count = item.notificationKey ? notifications[item.notificationKey] : 0;
              return (
                <NavLink 
                  key={item.label}
                  to={item.to} 
                  onClick={() => setMobileMenuOpen(false)} 
                  aria-label={count > 0 ? `${item.label}, ${count} notifications` : undefined}
                  className={({ isActive }) => 
                    `flex items-center gap-3.5 px-4 py-3 text-xs font-semibold tracking-wider transition-all duration-150 rounded-md group ${
                      isActive 
                        ? 'bg-white/10 text-white border-l-2 border-[#e85d4a] shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <IconComponent size={18} className="text-[#5ee5e9] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span>{item.label}</span>
                  {count > 0 && <span className="member-nav-notification" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#05111e]">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-[#5ee5e9] transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Back to Public Website</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-xs font-semibold text-[#e85d4a] hover:bg-[#e85d4a]/10 rounded-md transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Canvas (Adjacent to Sidebar, Expanding across available width) */}
        <main className="member-light-content flex-1 overflow-y-auto bg-[#eef1f2] p-6 sm:p-8 lg:p-10 w-full min-w-0">
          <div className="w-full max-w-[1600px] mx-auto">
            {children ? children : <Outlet />}
          </div>
        </main>

      </div>
    </div>
  );
};

export default MemberLayout;
