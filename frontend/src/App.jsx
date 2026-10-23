import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CustomCursor from '@/components/ui/CustomCursor'
import BackToTop from '@/components/ui/BackToTop'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ADMIN_GATE_PERMISSIONS, ADMIN_ROLES } from '@/config/adminAccess'

// Public pages
const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const Membership = lazy(() => import('@/pages/Membership'))
const Events = lazy(() => import('@/pages/Events'))
const News = lazy(() => import('@/pages/News'))
const NewsArticle = lazy(() => import('@/pages/NewsArticle'))
const Committees = lazy(() => import('@/pages/Committees'))
const OurPresidents = lazy(() => import('@/pages/OurPresidents'))
const Network = lazy(() => import('@/pages/Network'))
const Contact = lazy(() => import('@/pages/Contact'))

// Auth & Registration Flow
const Login = lazy(() => import('@/pages/Login'))
const PasswordReset = lazy(() => import('@/pages/PasswordReset'))
const AdminGateway = lazy(() => import('@/pages/AdminGateway'))
const Register = lazy(() => import('@/pages/Register'))
const RegisterIndividual = lazy(() => import('@/pages/RegisterIndividual'))
const RegisterCorporate = lazy(() => import('@/pages/RegisterCorporate'))
const RegisterStudent = lazy(() => import('@/pages/RegisterStudent'))

// Member portal
const MemberDashboard = lazy(() => import('@/pages/member/Dashboard'))
const MemberClarificationResponse = lazy(() => import('@/pages/member/ClarificationResponse'))
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

function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual'

    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, search, hash])

  return null
}

function FormValidationFeedback({ children }) {
  const location = useLocation()
  const [invalidFields, setInvalidFields] = useState([])
  const [, refreshPositions] = useState(0)

  const getValidationMessage = (field) => {
    const { validity } = field
    if (validity.valueMissing) return 'This field is required.'
    if (validity.typeMismatch && field.type === 'email') return 'Enter a valid email address.'
    if (validity.typeMismatch && field.type === 'url') return 'Enter a valid URL.'
    if (validity.tooShort) return `Enter at least ${field.minLength} characters.`
    if (validity.tooLong) return `Use no more than ${field.maxLength} characters.`
    if (validity.patternMismatch) return field.title || 'Use the required format.'
    if (validity.rangeUnderflow) return `Enter a value on or after ${field.min}.`
    if (validity.rangeOverflow) return `Enter a value on or before ${field.max}.`
    if (validity.stepMismatch) return 'Enter a valid value.'
    if (validity.badInput) return 'Enter a valid value.'
    return field.validationMessage || 'Check this value.'
  }

  const handleInvalid = (event) => {
    const field = event.target
    if (!(field instanceof HTMLElement) || !('validity' in field) || field.validity.valid) return

    setInvalidFields((current) => current.some((entry) => entry.field === field)
      ? current.map((entry) => entry.field === field ? { field, message: getValidationMessage(field) } : entry)
      : [...current, { field, message: getValidationMessage(field) }])
  }

  const validateField = (event) => {
    const field = event.target
    if (!(field instanceof HTMLElement) || !('validity' in field)) return

    setInvalidFields((current) => {
      if (field.validity.valid) return current.filter((entry) => entry.field !== field)
      const message = getValidationMessage(field)
      return current.some((entry) => entry.field === field)
        ? current.map((entry) => entry.field === field ? { field, message } : entry)
        : current
    })
  }

  useEffect(() => {
    setInvalidFields([])
  }, [location.key])

  useEffect(() => {
    if (!invalidFields.length) return undefined

    const refresh = () => refreshPositions((version) => version + 1)
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
    }
  }, [invalidFields.length])

  const inlineErrors = invalidFields.filter(({ field }) => field.isConnected).map(({ field, message }, index) => {
    const bounds = field.getBoundingClientRect()
    const width = Math.max(0, Math.min(320, window.innerWidth - 32))
    const left = Math.max(16, Math.min(bounds.left, window.innerWidth - width - 16))
    const top = bounds.bottom + 20 > window.innerHeight
      ? Math.max(8, bounds.top - 20)
      : bounds.bottom + 2

    return createPortal(
      <span
        role="alert"
        className="pointer-events-none fixed z-[1000] text-[11px] font-semibold leading-4 text-[#a53c31]"
        style={{ left, top }}
      >
        {message}
      </span>,
      document.body,
      `required-${field.id || field.name || 'field'}-${index}`,
    )
  })

  return (
    <div
      onInvalidCapture={handleInvalid}
      onInputCapture={validateField}
      onChangeCapture={validateField}
      onSubmitCapture={() => setInvalidFields([])}
    >
      {children}
      {inlineErrors}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <FormValidationFeedback>
        <ScrollToTop />
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
          <Route path="/news/:id" element={<NewsArticle />} />
          <Route path="/committees" element={<Committees />} />
          <Route path="/our-presidents" element={<OurPresidents />} />
          <Route path="/gallery" element={<Navigate to="/" replace />} />
          <Route path="/network" element={<Network />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth & Registration */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<PasswordReset />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/individual" element={<RegisterIndividual />} />
          <Route path="/register/corporate" element={<RegisterCorporate />} />
          <Route path="/register/student" element={<RegisterStudent />} />

          <Route element={<ProtectedRoute allowedRoles={['MEMBER']} allowSuperAdmin={false} />}>
            <Route path="/member" element={<MemberDashboard />} />
            <Route path="/member/dashboard" element={<MemberDashboard />} />
            <Route path="/member/applications/:id/clarification" element={<MemberClarificationResponse />} />
            <Route path="/member/profile" element={<MemberProfile />} />
            <Route path="/member/membership" element={<MemberMembership />} />
            <Route path="/member/events" element={<MemberEvents />} />
            <Route path="/member/payments" element={<MemberPayments />} />
            <Route path="/member/directory" element={<MemberDirectory />} />
            <Route path="/member/card" element={<MemberCard />} />
          </Route>

          <Route path="/admin" element={<AdminGateway />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={ADMIN_GATE_PERMISSIONS} requireBackendAuth unauthenticatedPath="/admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['applications.view', 'applications.read', 'applications.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminApplications /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['members.view', 'members.read', 'members.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminMembers /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['events.view', 'events.read', 'events.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['payments.view', 'payments.read', 'payments.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['news.view', 'news.read', 'news.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminCommunications /></ProtectedRoute>} />
          <Route path="/admin/communications" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['news.view', 'news.read', 'news.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminCommunications /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['users.view', 'users.read', 'users.manage']} requireBackendAuth unauthenticatedPath="/admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={ADMIN_ROLES} requiredPermissions={['audit_logs.view', 'audit_logs.read']} requireBackendAuth unauthenticatedPath="/admin"><AdminAuditLogs /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </FormValidationFeedback>
    </AuthProvider>
  )
}
