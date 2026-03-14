import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { Scissors } from 'lucide-react';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.role);
      toast.success(`Welcome back, ${user.fullname}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'barber') navigate('/barber');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-text">EzCut</div>
          <div className="auth-logo-sub">Barbershop System</div>
        </div>
        <div className="auth-title">Sign In</div>
        <div className="auth-subtitle">Enter your credentials to continue</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Login As</label>
            <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="barber">Barber</option>
              <option value="admin">Admin / Owner</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required placeholder="you@email.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
        <div className="auth-divider"><span>Admin default: admin@ezcut.com / password</span></div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ fullname: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.register({ fullname: form.fullname, email: form.email, password: form.password });
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-text">EzCut</div>
          <div className="auth-logo-sub">Barbershop System</div>
        </div>
        <div className="auth-title">Create Account</div>
        <div className="auth-subtitle">Register as a customer to book appointments</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required placeholder="Juan dela Cruz"
              value={form.fullname} onChange={set('fullname')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required placeholder="you@email.com"
              value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" required placeholder="Repeat password"
              value={form.confirm} onChange={set('confirm')} />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
