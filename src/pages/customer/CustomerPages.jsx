import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Scissors, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.myAppointments().then(setAppointments).catch(() => {});
  }, []);

  const today = appointments.filter(a => a.appointment_date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user.fullname.split(' ')[0]}</h1>
          <p className="page-subtitle">Manage your appointments and bookings</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/customer/book')}>
          <Scissors size={15} /> Book Appointment
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value">{appointments.length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Today</div>
          <div className="stat-value">{today.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{appointments.filter(a => a.status === 'Approved').length}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{appointments.filter(a => a.status === 'Pending').length}</div>
        </div>
      </div>

      <h2 className="section-title">Today's Appointments</h2>
      {today.length === 0 ? (
        <div className="card text-center" style={{ padding: '2rem', color: 'var(--text-dim)' }}>
          No appointments today. <button className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/customer/book')}>Book Now</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Service</th><th>Branch</th><th>Barber</th><th>Status</th></tr></thead>
            <tbody>
              {today.map(a => (
                <tr key={a.id}>
                  <td><Clock size={13} style={{ marginRight: 4 }} />{a.appointment_time?.slice(0, 5)}</td>
                  <td>{a.service_name}</td>
                  <td>{a.branch_name}</td>
                  <td>{a.barber_name || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section-title mt-3">Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <div className="empty"><div className="empty-icon">📅</div><p>No upcoming appointments</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Price</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td>{format(parseISO(a.appointment_date), 'MMM d, yyyy')}</td>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>{a.service_name}</td>
                  <td>₱{parseFloat(a.price).toFixed(2)}</td>
                  <td>{a.branch_name}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BookAppointment() {
  const [step, setStep] = useState(1); // 1: Branch/Service, 2: Date/Time, 3: Confirm
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ branch_id: '', service_id: '', date: '', time: '', notes: '' });
  const [selected, setSelected] = useState({ branch: null, service: null });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getBranches().then(setBranches);
    api.getServices().then(setServices);
  }, []);

  useEffect(() => {
    if (form.branch_id && form.date) {
      api.getSlots(form.branch_id, form.date).then(setSlots).catch(() => setSlots([]));
    }
  }, [form.branch_id, form.date]);

  const set = (k) => (v) => {
    setForm(p => ({ ...p, [k]: v }));
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      await api.book(form);
      toast.success('Appointment booked! Check your email for confirmation.');
      navigate('/customer/appointments');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="page-sm" style={{ maxWidth: 700 }}>
      <h1 className="page-title">Book an Appointment</h1>
      <p className="page-subtitle">Follow the steps to schedule your visit</p>

      <div className="steps">
        {['Branch & Service', 'Date & Time', 'Confirm'].map((s, i) => (
          <div key={i} className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="form-group">
            <label className="form-label">Select Branch</label>
            <select className="form-select" value={form.branch_id}
              onChange={e => { set('branch_id')(e.target.value); setSelected(p => ({ ...p, branch: branches.find(b => b.id == e.target.value) })); }}>
              <option value="">Choose a branch...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
            </select>
          </div>

          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Select Service</label>
          <div className="service-grid">
            {services.map(s => (
              <div key={s.id}
                className={`service-card ${form.service_id == s.id ? 'selected' : ''}`}
                onClick={() => { set('service_id')(String(s.id)); setSelected(p => ({ ...p, service: s })); }}>
                <div className="service-name">{s.name}</div>
                <div className="service-price">₱{parseFloat(s.price).toFixed(2)}</div>
                <div className="service-duration">{s.duration_minutes} mins</div>
                {s.description && <div className="text-dim text-sm mt-1">{s.description}</div>}
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between">
            <div />
            <button className="btn btn-primary" disabled={!form.branch_id || !form.service_id}
              onClick={() => setStep(2)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <input className="form-input" type="date" min={today}
                value={form.date} onChange={e => set('date')(e.target.value)} />
            </div>
          </div>

          {form.date && (
            <>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                Available Time Slots {slots.length === 0 ? '— No slots for this day' : ''}
              </label>
              <div className="slot-grid">
                {slots.map(slot => (
                  <button key={slot.id}
                    className={`slot-btn ${form.time === slot.start_time ? 'selected' : ''}`}
                    disabled={slot.available <= 0}
                    onClick={() => set('time')(slot.start_time)}>
                    {slot.start_time.slice(0, 5)}
                    {slot.available <= 0 && <div style={{ fontSize: '0.65rem', color: 'var(--red)' }}>Full</div>}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="form-group mt-2">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" placeholder="Any special requests or notes..."
              value={form.notes} onChange={e => set('notes')(e.target.value)} />
          </div>

          <div className="flex justify-between mt-2">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" disabled={!form.date || !form.time}
              onClick={() => setStep(3)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="section-title">Confirm Your Booking</h2>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['Branch', selected.branch?.name],
                ['Service', selected.service?.name],
                ['Price', `₱${parseFloat(selected.service?.price || 0).toFixed(2)}`],
                ['Duration', `${selected.service?.duration_minutes} mins`],
                ['Date', form.date ? format(parseISO(form.date), 'MMMM d, yyyy') : ''],
                ['Time', form.time?.slice(0, 5)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="form-label" style={{ marginBottom: 0 }}>{k}</div>
                  <div style={{ fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {form.notes && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div className="form-label" style={{ marginBottom: 0 }}>Notes</div>
                <div>{form.notes}</div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={handleBook} disabled={loading}>
              {loading ? <span className="spinner" /> : <><CheckCircle size={15} /> Confirm Booking</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);

  useEffect(() => {
    api.myAppointments().then(setAppointments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page-title">My Appointments</h1>
      <p className="page-subtitle">Your upcoming scheduled visits</p>

      {appointments.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <p>No upcoming appointments</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Price</th><th>Branch</th><th>Barber</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>{format(parseISO(a.appointment_date), 'MMM d, yyyy')}</td>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>{a.service_name}</td>
                  <td>₱{parseFloat(a.price).toFixed(2)}</td>
                  <td>{a.branch_name}</td>
                  <td>{a.barber_name || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BookingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    api.myHistory().then(setHistory).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submitFeedback = async () => {
    try {
      await api.submitFeedback({ appointment_id: feedbackModal.id, ...feedback });
      toast.success('Feedback submitted!');
      setFeedbackModal(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Booking History</h1>
      <p className="page-subtitle">Past appointments after 1 day</p>

      {history.length === 0 ? (
        <div className="empty"><div className="empty-icon">📋</div><p>No past appointments yet</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Price</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {history.map(a => (
                <tr key={a.id}>
                  <td>{format(parseISO(a.appointment_date), 'MMM d, yyyy')}</td>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>{a.service_name}</td>
                  <td>₱{parseFloat(a.price).toFixed(2)}</td>
                  <td>{a.branch_name}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {a.status === 'Completed' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => setFeedbackModal(a)}>
                        ⭐ Rate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Leave Feedback</div>
            <p className="text-dim text-sm mb-2">For: {feedbackModal.service_name} on {format(parseISO(feedbackModal.appointment_date), 'MMM d, yyyy')}</p>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="stars">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`star ${feedback.rating >= n ? 'active' : ''}`}
                    onClick={() => setFeedback(p => ({ ...p, rating: n }))}>★</span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comment</label>
              <textarea className="form-textarea" placeholder="Share your experience..."
                value={feedback.comment} onChange={e => setFeedback(p => ({ ...p, comment: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setFeedbackModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitFeedback}>Submit Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
