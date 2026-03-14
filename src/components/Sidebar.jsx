import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Calendar, Clock, History, Star,
  Users, Scissors, Settings, LogOut, Building2,
  ClipboardList, BarChart2, User
} from 'lucide-react';

const navByRole = {
  customer: [
    { path: '/customer', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customer/book', label: 'Book Appointment', icon: Calendar },
    { path: '/customer/appointments', label: 'My Appointments', icon: Clock },
    { path: '/customer/history', label: 'Booking History', icon: History },
  ],
  barber: [
    { path: '/barber', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/barber/schedule', label: 'Daily Schedule', icon: Calendar },
    { path: '/barber/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/appointments', label: 'Appointments', icon: ClipboardList },
    { path: '/admin/barbers', label: 'Barbers', icon: Users },
    { path: '/admin/services', label: 'Services', icon: Scissors },
    { path: '/admin/branches', label: 'Branches', icon: Building2 },
    { path: '/admin/timeslots', label: 'Time Slots', icon: Settings },
    { path: '/admin/reports', label: 'Reports', icon: BarChart2 },
    { path: '/admin/feedback', label: 'Feedback', icon: Star },
  ]
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = navByRole[user.role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">EzCut</div>
        <div className="sidebar-logo-sub">Barbershop System</div>
      </div>
      <div className="sidebar-user">
        <div className="sidebar-user-name">{user.fullname}</div>
        <div className="sidebar-user-role">{user.role}</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-secondary w-full" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
