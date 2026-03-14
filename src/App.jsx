import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CustomerDashboard, BookAppointment, MyAppointments, BookingHistory } from './pages/customer/CustomerPages';
import { BarberDashboard, BarberSchedule, BarberProfile } from './pages/barber/BarberPages';
import {
  AdminDashboard, AdminAppointments, AdminBarbers,
  AdminServices, AdminBranches, AdminTimeSlots,
  AdminReports, AdminFeedback
} from './pages/admin/AdminPages';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--black)' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'barber') return <Navigate to="/barber" replace />;
  return <Navigate to="/customer" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#181818',
              color: '#f0ece4',
              border: '1px solid #2a2a2a',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#c9a84c', secondary: '#181818' } },
            error: { iconTheme: { primary: '#c0392b', secondary: '#181818' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Customer */}
          <Route path="/customer" element={
            <ProtectedRoute role="customer">
              <AppLayout><CustomerDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/book" element={
            <ProtectedRoute role="customer">
              <AppLayout><BookAppointment /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/appointments" element={
            <ProtectedRoute role="customer">
              <AppLayout><MyAppointments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/history" element={
            <ProtectedRoute role="customer">
              <AppLayout><BookingHistory /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Barber */}
          <Route path="/barber" element={
            <ProtectedRoute role="barber">
              <AppLayout><BarberDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/barber/schedule" element={
            <ProtectedRoute role="barber">
              <AppLayout><BarberSchedule /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/barber/profile" element={
            <ProtectedRoute role="barber">
              <AppLayout><BarberProfile /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/appointments" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminAppointments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/barbers" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminBarbers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminServices /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/branches" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminBranches /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/timeslots" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminTimeSlots /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminReports /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/feedback" element={
            <ProtectedRoute role="admin">
              <AppLayout><AdminFeedback /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
