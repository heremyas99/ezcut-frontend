import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle, Clock, User } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export function BarberDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    api.barberAppointments(today).then(setAppointments).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Good day, {user.fullname.split(' ')[0]}</h1>
      <p className="page-subtitle">Today's schedule — {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>

      <div className="stats-grid">
        <div className="stat-card gold"><div className="stat-label">Total Today</div><div className="stat-value">{appointments.length}</div></div>
        <div className="stat-card orange"><div className="stat-label">Pending</div><div className="stat-value">{appointments.filter(a => a.status === 'Pending').length}</div></div>
        <div className="stat-card blue"><div className="stat-label">Approved</div><div className="stat-value">{appointments.filter(a => a.status === 'Approved').length}</div></div>
        <div className="stat-card green"><div className="stat-label">Completed</div><div className="stat-value">{appointments.filter(a => a.status === 'Completed').length}</div></div>
      </div>

      <h2 className="section-title">Today's Appointments</h2>
      {appointments.length === 0 ? (
        <div className="empty"><div className="empty-icon">✂️</div><p>No appointments assigned for today</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Customer</th><th>Service</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td><Clock size={13} style={{ marginRight: 4 }} />{a.appointment_time?.slice(0, 5)}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.customer_name}</div>
                    <div className="text-dim text-sm">{a.customer_email}</div>
                  </td>
                  <td>{a.service_name}</td>
                  <td>₱{parseFloat(a.price).toFixed(2)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {(a.status === 'Approved' || a.status === 'Pending') && (
                      <button className="btn btn-sm btn-success"
                        onClick={async () => {
                          try {
                            await api.completeAppointment(a.id);
                            toast.success('Marked as completed');
                            setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'Completed' } : x));
                          } catch (err) { toast.error(err.message); }
                        }}>
                        <CheckCircle size={13} /> Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BarberSchedule() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSchedule = async (d) => {
    setLoading(true);
    try { setAppointments(await api.barberAppointments(d)); }
    catch { setAppointments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSchedule(date); }, [date]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Schedule</h1>
          <p className="page-subtitle">View your assigned appointments by date</p>
        </div>
        <input type="date" className="form-input" style={{ width: 'auto' }}
          value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading ? <div className="spinner" /> : appointments.length === 0 ? (
        <div className="empty"><div className="empty-icon">📅</div><p>No appointments on this date</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map(a => (
            <div key={a.id} className="card" style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {a.appointment_time?.slice(0, 5)}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{a.customer_name}</div>
                <div className="text-dim text-sm">{a.customer_email}</div>
                <div style={{ marginTop: '0.25rem', color: 'var(--gold)', fontSize: '0.875rem' }}>{a.service_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={a.status} />
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>₱{parseFloat(a.price).toFixed(2)}</div>
                {(a.status === 'Approved' || a.status === 'Pending') && (
                  <button className="btn btn-sm btn-success" style={{ marginTop: '0.5rem' }}
                    onClick={async () => {
                      try {
                        await api.completeAppointment(a.id);
                        toast.success('Marked as completed');
                        setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'Completed' } : x));
                      } catch (err) { toast.error(err.message); }
                    }}>
                    <CheckCircle size={13} /> Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarberProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullname: user.fullname, phone: '', specialization: '' });
  const [loading, setLoading] = useState(false);

  // Load barber details
  useEffect(() => {
    api.getBarbers().then(barbers => {
      const me = barbers.find(b => b.id === user.id);
      if (me) setForm({ fullname: me.fullname, phone: me.phone || '', specialization: me.specialization || '' });
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.editBarber(user.id, form);
      setUser(p => ({ ...p, fullname: form.fullname }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-sm">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Update your barber profile information</p>
      <div className="card">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+63 912 345 6789" />
          </div>
          <div className="form-group">
            <label className="form-label">Specialization / Services</label>
            <textarea className="form-textarea" value={form.specialization}
              onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
              placeholder="e.g. Fade cuts, beard styling, hair coloring..." />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
