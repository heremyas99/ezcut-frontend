import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, User, Download } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

// ============ DASHBOARD ============
export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!stats) return null;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of barbershop operations — {format(new Date(), 'MMMM d, yyyy')}</p>

      <div className="stats-grid">
        <div className="stat-card gold"><div className="stat-label">Total Today</div><div className="stat-value">{stats.total_today}</div></div>
        <div className="stat-card orange"><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div>
        <div className="stat-card green"><div className="stat-label">Completed Today</div><div className="stat-value">{stats.completed_today}</div></div>
        <div className="stat-card red"><div className="stat-label">Cancelled Today</div><div className="stat-value">{stats.cancelled_today}</div></div>
        <div className="stat-card blue"><div className="stat-label">Sales Today</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₱{stats.sales_today.toFixed(2)}</div></div>
        <div className="stat-card gold"><div className="stat-label">Monthly Sales</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₱{stats.sales_month.toFixed(2)}</div></div>
        <div className="stat-card green"><div className="stat-label">Total Sales</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₱{stats.sales_total.toFixed(2)}</div></div>
      </div>

      <h2 className="section-title">Today's Appointments</h2>
      {stats.today_appointments.length === 0 ? (
        <div className="empty"><div className="empty-icon">📅</div><p>No appointments today</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Customer</th><th>Service</th><th>Barber</th><th>Status</th></tr></thead>
            <tbody>
              {stats.today_appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>{a.customer_name}</td>
                  <td>{a.service_name}</td>
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

// ============ APPOINTMENTS ============
export function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      setAppointments(await api.allAppointments(params));
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); api.getBarbers().then(setBarbers).catch(() => {}); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.updateAppointment(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success('Status updated');
    } catch (err) { toast.error(err.message); }
  };

  const assignBarber = async (id, barber_id) => {
    try {
      await api.updateAppointment(id, { barber_id: parseInt(barber_id) || null });
      const barber = barbers.find(b => b.id == barber_id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, barber_id, barber_name: barber?.fullname || null } : a));
      toast.success('Barber assigned');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="page">
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">Manage all customer bookings</p>

      <div className="filter-bar">
        <input className="form-input" type="date" value={filters.date}
          onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
        <select className="form-select" value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['Pending', 'Approved', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input className="form-input" placeholder="Search customer..." value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        <button className="btn btn-primary" onClick={load}>Search</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ date: '', status: '', search: '' }); setTimeout(load, 0); }}>Clear</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th>Branch</th><th>Assign Barber</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>{format(parseISO(a.appointment_date), 'MMM d, yyyy')}</td>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.customer_name}</div>
                    <div className="text-dim text-sm">{a.customer_email}</div>
                  </td>
                  <td>
                    <div>{a.service_name}</div>
                    <div className="text-gold text-sm">₱{parseFloat(a.price).toFixed(2)}</div>
                  </td>
                  <td>{a.branch_name}</td>
                  <td>
                    <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                      value={a.barber_id || ''}
                      onChange={e => assignBarber(a.id, e.target.value)}>
                      <option value="">Unassigned</option>
                      {barbers.map(b => <option key={b.id} value={b.id}>{b.fullname}</option>)}
                    </select>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {a.status === 'Pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(a.id, 'Approved')}>Approve</button>
                      )}
                      {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(a.id, 'Cancelled')}>Cancel</button>
                      )}
                      {a.status === 'Approved' && (
                        <button className="btn btn-sm" style={{ background: 'var(--blue)', color: 'white', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                          onClick={() => updateStatus(a.id, 'Completed')}>Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No appointments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ BARBERS ============
export function AdminBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | barber object
  const [form, setForm] = useState({ fullname: '', email: '', password: '', phone: '', branch_id: '', specialization: '' });

  useEffect(() => {
    api.getBarbers().then(setBarbers).catch(() => {});
    api.getBranches().then(setBranches).catch(() => {});
  }, []);

  const openAdd = () => { setForm({ fullname: '', email: '', password: '', phone: '', branch_id: '', specialization: '' }); setModal('add'); };
  const openEdit = (b) => { setForm({ fullname: b.fullname, email: b.email, password: '', phone: b.phone || '', branch_id: b.branch_id || '', specialization: b.specialization || '' }); setModal(b); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.addBarber(form);
        toast.success('Barber added');
      } else {
        await api.editBarber(modal.id, form);
        toast.success('Barber updated');
      }
      setModal(null);
      api.getBarbers().then(setBarbers);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this barber?')) return;
    try { await api.deleteBarber(id); setBarbers(prev => prev.filter(b => b.id !== id)); toast.success('Barber removed'); }
    catch (err) { toast.error(err.message); }
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Barbers</h1><p className="page-subtitle">Manage barber staff</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Barber</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Branch</th><th>Specialization</th><th>Actions</th></tr></thead>
          <tbody>
            {barbers.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 500 }}>{b.fullname}</td>
                <td className="text-dim">{b.email}</td>
                <td>{b.phone || '—'}</td>
                <td>{b.branch_name || '—'}</td>
                <td className="text-dim">{b.specialization || '—'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(b)}><Edit2 size={13} /></button>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(b.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {barbers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No barbers yet</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'add' ? 'Add Barber' : 'Edit Barber'}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.fullname} onChange={set('fullname')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={set('email')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{modal === 'add' ? 'Password' : 'New Password (leave blank)'}</label>
                  <input className="form-input" type="password" value={form.password} onChange={set('password')} required={modal === 'add'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select className="form-select" value={form.branch_id} onChange={set('branch_id')}>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <textarea className="form-textarea" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Fade cuts, beard styling..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SERVICES ============
export function AdminServices() {
  const [services, setServices] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: 30 });

  useEffect(() => { api.getServices().then(setServices).catch(() => {}); }, []);

  const openAdd = () => { setForm({ name: '', description: '', price: '', duration_minutes: 30 }); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes }); setModal(s); };
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') { await api.addService(form); toast.success('Service added'); }
      else { await api.editService(modal.id, form); toast.success('Service updated'); }
      setModal(null);
      api.getServices().then(setServices);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try { await api.deleteService(id); setServices(prev => prev.filter(s => s.id !== id)); toast.success('Service deleted'); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Services</h1><p className="page-subtitle">Manage barbershop services</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Service</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Service</th><th>Description</th><th>Price</th><th>Duration</th><th>Actions</th></tr></thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td className="text-dim">{s.description || '—'}</td>
                <td className="text-gold">₱{parseFloat(s.price).toFixed(2)}</td>
                <td>{s.duration_minutes} mins</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'add' ? 'Add Service' : 'Edit Service'}</div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Service Name</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={set('description')} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Price (₱)</label><input className="form-input" type="number" step="0.01" value={form.price} onChange={set('price')} required /></div>
                <div className="form-group"><label className="form-label">Duration (mins)</label><input className="form-input" type="number" value={form.duration_minutes} onChange={set('duration_minutes')} required /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ BRANCHES ============
export function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });

  useEffect(() => { api.getBranches().then(setBranches).catch(() => {}); }, []);

  const openAdd = () => { setForm({ name: '', address: '', phone: '', email: '' }); setModal('add'); };
  const openEdit = (b) => { setForm({ name: b.name, address: b.address, phone: b.phone || '', email: b.email || '' }); setModal(b); };
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') { await api.addBranch(form); toast.success('Branch added'); }
      else { await api.editBranch(modal.id, form); toast.success('Branch updated'); }
      setModal(null);
      api.getBranches().then(setBranches);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Branches</h1><p className="page-subtitle">Manage barbershop locations</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Branch</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {branches.map(b => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{b.name}</div>
              <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(b)}><Edit2 size={13} /></button>
            </div>
            <div className="text-dim text-sm">{b.address}</div>
            {b.phone && <div className="text-sm mt-1">📞 {b.phone}</div>}
            {b.email && <div className="text-sm">✉️ {b.email}</div>}
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'add' ? 'Add Branch' : 'Edit Branch'}</div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Branch Name</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={form.address} onChange={set('address')} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TIME SLOTS ============
export function AdminTimeSlots() {
  const [slots, setSlots] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ branch_id: '', day_of_week: 1, start_time: '09:00', end_time: '09:30', max_bookings: 2 });
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  useEffect(() => {
    api.getBranches().then(b => { setBranches(b); if (b.length) { setSelectedBranch(String(b[0].id)); setForm(p => ({ ...p, branch_id: b[0].id })); } });
  }, []);

  useEffect(() => {
    if (selectedBranch) api.getTimeSlots(selectedBranch).then(setSlots).catch(() => {});
  }, [selectedBranch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.addTimeSlot(form); toast.success('Time slot added'); setModal(false); api.getTimeSlots(selectedBranch).then(setSlots); }
    catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this time slot?')) return;
    try { await api.deleteTimeSlot(id); setSlots(prev => prev.filter(s => s.id !== id)); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const grouped = DAYS.reduce((acc, d, i) => { acc[i] = slots.filter(s => s.day_of_week === i); return acc; }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Slots</h1>
          <p className="page-subtitle">Set business hours and booking slots</p>
        </div>
        <div className="flex gap-2">
          <select className="form-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> Add Slot</button>
        </div>
      </div>

      {DAYS.map((day, i) => (
        grouped[i].length > 0 && (
          <div key={i} className="mb-2">
            <h3 className="section-title">{day}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {grouped[i].map(slot => (
                <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</span>
                  <span className="text-dim text-sm">({slot.max_bookings} max)</span>
                  <button className="btn btn-sm btn-danger btn-icon" style={{ padding: '0.2rem' }} onClick={() => handleDelete(slot.id)}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Time Slot</div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select className="form-select" value={form.branch_id} onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select className="form-select" value={form.day_of_week} onChange={e => setForm(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Start Time</label><input type="time" className="form-input" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">End Time</label><input type="time" className="form-input" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Max Bookings Per Slot</label><input type="number" className="form-input" min={1} max={20} value={form.max_bookings} onChange={e => setForm(p => ({ ...p, max_bookings: parseInt(e.target.value) }))} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ REPORTS ============
export function AdminReports() {
  const [type, setType] = useState('daily');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (type === 'daily') setData(await api.dailyReport(date));
      else setData(await api.monthlyReport(month));
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const printReport = () => window.print();

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">Generate daily and monthly barbershop reports</p>

      <div className="card mb-3">
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto' }} value={type} onChange={e => { setType(e.target.value); setData(null); }}>
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Summary</option>
          </select>
          {type === 'daily'
            ? <input type="date" className="form-input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
            : <input type="month" className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} />
          }
          <button className="btn btn-primary" onClick={loadReport}>Generate</button>
          {data && <button className="btn btn-secondary" onClick={printReport}><Download size={14} /> Print / PDF</button>}
        </div>
      </div>

      {loading && <div className="spinner" />}

      {data && type === 'daily' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card gold"><div className="stat-label">Total Appointments</div><div className="stat-value">{data.appointments.length}</div></div>
            <div className="stat-card green"><div className="stat-label">Total Sales</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₱{data.total_sales.toFixed(2)}</div></div>
            <div className="stat-card blue"><div className="stat-label">Completed</div><div className="stat-value">{data.appointments.filter(a => a.status === 'Completed').length}</div></div>
            <div className="stat-card red"><div className="stat-label">Cancelled</div><div className="stat-value">{data.appointments.filter(a => a.status === 'Cancelled').length}</div></div>
          </div>
          <h2 className="section-title">Appointment List — {format(parseISO(data.date), 'MMMM d, yyyy')}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Time</th><th>Customer</th><th>Service</th><th>Price</th><th>Barber</th><th>Status</th></tr></thead>
              <tbody>
                {data.appointments.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{a.appointment_time?.slice(0,5)}</td>
                    <td>{a.customer}</td>
                    <td>{a.service}</td>
                    <td>₱{parseFloat(a.price).toFixed(2)}</td>
                    <td>{a.barber || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && type === 'monthly' && (
        <div>
          <h2 className="section-title">Monthly Summary — {data.month}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Total Appointments</th><th>Completed</th><th>Cancelled</th><th>Sales</th></tr></thead>
              <tbody>
                {data.summary.map(row => (
                  <tr key={row.date}>
                    <td>{format(parseISO(row.date), 'MMM d, yyyy')}</td>
                    <td>{row.total}</td>
                    <td className="text-gold">{row.completed}</td>
                    <td style={{ color: 'var(--red)' }}>{row.cancelled}</td>
                    <td className="text-gold">₱{parseFloat(row.sales).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(201,168,76,0.05)', fontWeight: 600 }}>
                  <td>TOTAL</td>
                  <td>{data.summary.reduce((s, r) => s + parseInt(r.total), 0)}</td>
                  <td>{data.summary.reduce((s, r) => s + parseInt(r.completed), 0)}</td>
                  <td>{data.summary.reduce((s, r) => s + parseInt(r.cancelled), 0)}</td>
                  <td className="text-gold">₱{data.summary.reduce((s, r) => s + parseFloat(r.sales), 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ FEEDBACK ============
export function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getFeedback().then(setFeedback).catch(() => {}).finally(() => setLoading(false)); }, []);

  const avg = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '—';

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Customer Feedback</h1><p className="page-subtitle">Ratings and reviews from customers</p></div>
        <div className="stat-card gold" style={{ minWidth: 120, padding: '1rem 1.5rem' }}>
          <div className="stat-label">Avg Rating</div>
          <div className="stat-value">{avg} ⭐</div>
        </div>
      </div>

      {feedback.length === 0 ? (
        <div className="empty"><div className="empty-icon">⭐</div><p>No feedback yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedback.map(f => (
            <div key={f.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 600 }}>{f.customer_name}</div>
                  <div className="text-dim text-sm">{f.service_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                  {[1,2,3,4,5].map(n => <span key={n} style={{ color: f.rating >= n ? 'var(--gold)' : 'var(--text-dimmer)', fontSize: '1.1rem' }}>★</span>)}
                </div>
              </div>
              {f.comment && <p style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>"{f.comment}"</p>}
              <div className="text-dim text-sm mt-1">{format(parseISO(f.created_at), 'MMM d, yyyy')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
