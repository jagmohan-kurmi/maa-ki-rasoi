import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, generateEmployeeId } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Employee, EmployeeRole, EmployeeStatus } from '@/types';

const ROLES: EmployeeRole[] = ['Cook', 'Helper', 'Delivery Staff', 'Cleaner', 'Manager', 'Other'];
const ROLE_LABELS: Record<EmployeeRole, string> = { Cook: 'रसोइया', Helper: 'सहायक', 'Delivery Staff': 'डिलीवरी', Cleaner: 'सफाई', Manager: 'प्रबंधक', Other: 'अन्य' };

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (data) setEmployees(data as Employee[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search) || (e.employee_id || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data: Partial<Employee>) => {
    if (editing) {
      const { error } = await supabase.from('employees').update(data).eq('id', editing.id);
      if (error) { toast('error', 'अपडेट विफल'); return; }
      toast('success', 'कर्मचारी अपडेट हुआ');
    } else {
      const { error } = await supabase.from('employees').insert(data);
      if (error) { toast('error', error.message); return; }
      toast('success', 'कर्मचारी जोड़ा गया');
    }
    setModalOpen(false); setEditing(null); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('employees').delete().eq('id', deleteId);
    if (error) { toast('error', 'हटाना विफल'); return; }
    toast('success', 'कर्मचारी हटाया गया');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="खोजें..." />
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={18} /> कर्मचारी जोड़ें</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Plus size={48} />} title="कोई कर्मचारी नहीं" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(e => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 font-bold text-lg">
                    {e.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-maroon-800">{e.name}</h3>
                    <p className="text-xs text-maroon-500">{e.employee_id || '-'}</p>
                  </div>
                </div>
                <span className={e.status === 'Active' ? 'badge-green' : 'badge-gray'}>{e.status === 'Active' ? 'सक्रिय' : 'निष्क्रिय'}</span>
              </div>
              <div className="space-y-1 text-sm text-maroon-600">
                <p><span className="badge-maroon">{ROLE_LABELS[e.role]}</span></p>
                <p>फ़ोन: {e.phone || '-'}</p>
                <p>वेतन: {formatCurrency(e.salary)}</p>
                <p>जुड़ने की तिथि: {formatDate(e.joining_date)}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing(e); setModalOpen(true); }} className="btn-outline text-sm flex-1"><Edit2 size={14} /> संपादित</button>
                <button onClick={() => setDeleteId(e.id)} className="btn-ghost text-sm text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EmployeeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} employee={editing} onSave={handleSave} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="कर्मचारी हटाएँ" message="क्या आप वाकई इस कर्मचारी को हटाना चाहते हैं?" confirmText="हटाएँ" danger />
    </div>
  );
}

function EmployeeModal({ open, onClose, employee, onSave }: { open: boolean; onClose: () => void; employee: Employee | null; onSave: (d: Partial<Employee>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) setForm(employee);
    else setForm({ employee_id: generateEmployeeId(), name: '', phone: '', role: 'Cook', salary: 0, status: 'Active', joining_date: new Date().toISOString().split('T')[0], address: '' });
  }, [employee, open]);

  const update = (k: keyof Employee, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={employee ? 'कर्मचारी संपादित करें' : 'नया कर्मचारी'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">कर्मचारी आईडी</label><input className="input" value={form.employee_id || ''} onChange={e => update('employee_id', e.target.value)} /></div>
          <div><label className="label">नाम *</label><input className="input" value={form.name || ''} onChange={e => update('name', e.target.value)} required /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">फ़ोन</label><input className="input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
          <div><label className="label">भूमिका</label>
            <select className="input" value={form.role || 'Cook'} onChange={e => update('role', e.target.value as EmployeeRole)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">वेतन</label><input type="number" className="input" value={form.salary || 0} onChange={e => update('salary', Number(e.target.value))} /></div>
          <div><label className="label">जुड़ने की तिथि</label><input type="date" className="input" value={form.joining_date || ''} onChange={e => update('joining_date', e.target.value)} /></div>
        </div>
        <div><label className="label">पता</label><textarea className="input" value={form.address || ''} onChange={e => update('address', e.target.value)} /></div>
        <div><label className="label">स्थिति</label>
          <select className="input" value={form.status || 'Active'} onChange={e => update('status', e.target.value as EmployeeStatus)}>
            <option value="Active">सक्रिय</option><option value="Inactive">निष्क्रिय</option>
          </select>
        </div>
        <div><label className="label">फ़ोटो URL</label><input className="input" value={form.photo_url || ''} onChange={e => update('photo_url', e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} सहेजें</button>
      </form>
    </Modal>
  );
}
