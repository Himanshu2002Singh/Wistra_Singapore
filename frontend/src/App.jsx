import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import CustomCursor from '@/components/ui/CustomCursor'
import BackToTop from '@/components/ui/BackToTop'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Public pages
const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const Membership = lazy(() => import('@/pages/Membership'))
const Events = lazy(() => import('@/pages/Events'))
const News = lazy(() => import('@/pages/News'))
const Committees = lazy(() => import('@/pages/Committees'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Network = lazy(() => import('@/pages/Network'))
const Contact = lazy(() => import('@/pages/Contact'))

// Auth & Registration Flow
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const RegisterIndividual = lazy(() => import('@/pages/RegisterIndividual'))
const RegisterCorporate = lazy(() => import('@/pages/RegisterCorporate'))

// Member portal
const MemberDashboard = lazy(() => import('@/pages/member/Dashboard'))
const MemberProfile = lazy(() => import('@/pages/member/Profile'))
const MemberMembership = lazy(() => import('@/pages/member/MembershipPage'))
const MemberEvents = lazy(() => import('@/pages/member/Events'))
const MemberPayments = lazy(() => import('@/pages/member/Payments'))
const MemberDirectory = lazy(() => import('@/pages/member/Directory'))
const MemberCard = lazy(() => import('@/pages/member/Card'))

// Admin portal
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminApplications = lazy(() => import('@/pages/admin/Applications'))
const AdminMembers = lazy(() => import('@/pages/admin/Members'))
const AdminEvents = lazy(() => import('@/pages/admin/Events'))
const AdminPayments = lazy(() => import('@/pages/admin/Payments'))
const AdminCommunications = lazy(() => import('@/pages/admin/Communications'))
const AdminReports = lazy(() => import('@/pages/admin/Reports'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminAuditLogs = lazy(() => import('@/pages/admin/AuditLogs'))

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontFamily: 'var(--serif)',
      fontSize: '24px',
      letterSpacing: '-.02em',
    }}>
      WISTA Singapore
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CustomCursor />
      <BackToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public website */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/events" element={<Events />} />
          <Route path="/news" element={<News />} />
          <Route path="/committees" element={<Committees />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/network" element={<Network />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth & Registration */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/individual" element={<RegisterIndividual />} />
          <Route path="/register/corporate" element={<RegisterCorporate />} />

          <Route element={<ProtectedRoute allowedRoles={['MEMBER']} allowSuperAdmin={false} />}>
            <Route path="/member" element={<MemberDashboard />} />
            <Route path="/member/dashboard" element={<MemberDashboard />} />
            <Route path="/member/profile" element={<MemberProfile />} />
            <Route path="/member/membership" element={<MemberMembership />} />
            <Route path="/member/events" element={<MemberEvents />} />
            <Route path="/member/payments" element={<MemberPayments />} />
            <Route path="/member/directory" element={<MemberDirectory />} />
            <Route path="/member/card" element={<MemberCard />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute requiredPermissions={['applications.view', 'applications.read', 'applications.manage']}><AdminApplications /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute requiredPermissions={['members.view', 'members.read', 'members.manage']}><AdminMembers /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute requiredPermissions={['events.view', 'events.read', 'events.manage']}><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute requiredPermissions={['payments.view', 'payments.read', 'payments.manage']}><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/communications" element={<ProtectedRoute requiredPermissions={['communications.view', 'communications.read', 'communications.manage']}><AdminCommunications /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requiredPermissions={['reports.view', 'reports.read']}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredPermissions={['users.view', 'users.read', 'users.manage']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute requiredPermissions={['audit_logs.view', 'audit_logs.read']}><AdminAuditLogs /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'MEMBERSHIP_ADMIN', 'FINANCE_ADMIN', 'EVENTS_ADMIN', 'COMMUNICATIONS_ADMIN']
