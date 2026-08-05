import { useEffect, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Pause, Play, Key, UserPlus, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FUNCTIONS_URL } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDate, generateCustomerId, generatePassword } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Customer, Plan, CustomerStatus, MealType } from '@/types';

export function CustomersPage() {
  const { session } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [credentialsFor, setCredentialsFor] = useState<Customer | null>(null);

  const load = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('plans').select('*').order('sort_order'),
    ]);
    if (c) setCustomers(c as Customer[]);
    if (p) setPlans(p as Plan[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      (c.customer_id || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data: Partial<Customer>) => {
    if (editing) {
      const { error } = await supabase.from('customers').update(data).eq('id', editing.id);
      if (error) { toast('error', 'अपडेट विफल'); return; }
      toast('success', 'ग्राहक अपडेट हुआ');
    } else {
      const { error } = await supabase.from('customers').insert(data);
      if (error) { toast('error', error.message); return; }
      toast('success', 'नया ग्राहक जोड़ा गया');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const cust = customers.find(c => c.id === deleteId);
    if (cust?.user_id) {
      try {
        await fetch(`${FUNCTIONS_URL}/admin-ops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ action: 'delete_customer_user', user_id: cust.user_id }),
        });
      } catch { /* non-critical */ }
    }
    const { error } = await supabase.from('customers').delete().eq('id', deleteId);
    if (error) { toast('error', 'हटाना विफल'); return; }
    toast('success', 'ग्राहक हटाया गया');
    load();
  };

  const toggleStatus = async (c: Customer) => {
    const newStatus: CustomerStatus = c.status === 'Active' ? 'Paused' : 'Active';
    const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', c.id);
    if (error) { toast('error', 'स्थिति बदलना विफल'); return; }
    toast('success', newStatus === 'Active' ? 'सदस्यता फिर से शुरू' : 'सदस्यता रोकी गई');
    load();
  };

  const renew = async (c: Customer) => {
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + 1);
    const { error } = await supabase.from('customers').update({ renewal_date: newDate.toISOString().split('T')[0], status: 'Active' }).eq('id', c.id);
    if (error) { toast('error', 'रिन्यूअल विफल'); return; }
    toast('success', 'सदस्यता रिन्यूअल हुई');
    load();
  };

  const statusBadge = (s: CustomerStatus) => s === 'Active' ? 'badge-green' : s === 'Paused' ? 'badge-yellow' : 'badge-red';
  const statusLabel = (s: CustomerStatus) => s === 'Active' ? 'सक्रिय' : s === 'Paused' ? 'रुकी' : 'निष्क्रिय';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="नाम, मोबाइल, यूज़रनेम खोजें..."
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
          <option value="all">सभी स्थिति</option>
          <option value="Active">सक्रिय</option>
          <option value="Paused">रुकी</option>
          <option value="Inactive">निष्क्रिय</option>
        </select>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <UserPlus size={18} /> नया ग्राहक
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<UserPlus size={48} />} title="कोई ग्राहक नहीं" description="नया ग्राहक जोड़ें" action={<button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={18} /> ग्राहक जोड़ें</button>} />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>आईडी</th><th>नाम</th><th>मोबाइल</th><th>योजना</th><th>राशि</th><th>रिन्यूअल</th><th>स्थिति</th><th>क्रियाएँ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.customer_id || '-'}</td>
                  <td className="font-semibold">{c.full_name}</td>
                  <td>{c.mobile}</td>
                  <td>{plans.find(p => p.id === c.plan_id)?.name || '-'}</td>
                  <td>{formatCurrency(c.final_payable_amount)}</td>
                  <td>{formatDate(c.renewal_date)}</td>
                  <td><span className={statusBadge(c.status)}>{statusLabel(c.status)}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-maroon-50 text-maroon-600" title="संपादित करें"><Edit2 size={16} /></button>
                      <button onClick={() => toggleStatus(c)} className="p-1.5 rounded-lg hover:bg-maroon-50 text-amber-600" title={c.status === 'Active' ? 'रोकें' : 'फिर शुरू'}>{c.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}</button>
                      <button onClick={() => renew(c)} className="p-1.5 rounded-lg hover:bg-maroon-50 text-blue-600" title="रिन्यूअल"><Key size={16} /></button>
                      <button onClick={() => setCredentialsFor(c)} className="p-1.5 rounded-lg hover:bg-maroon-50 text-green-600" title="लॉगिन बनाएँ"><Key size={16} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="हटाएँ"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        customer={editing}
        plans={plans}
        onSave={handleSave}
      />

      <CredentialsModal
        customer={credentialsFor}
        onClose={() => setCredentialsFor(null)}
        onCreated={load}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ग्राहक हटाएँ"
        message="क्या आप वाकई इस ग्राहक को हटाना चाहते हैं? यह क्रिया वापस नहीं हो सकती।"
        confirmText="हटाएँ"
        danger
      />
    </div>
  );
}

function CustomerModal({ open, onClose, customer, plans, onSave }: { open: boolean; onClose: () => void; customer: Customer | null; plans: Plan[]; onSave: (data: Partial<Customer>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm(customer);
    } else {
      setForm({
        customer_id: generateCustomerId(),
        username: '',
        full_name: '',
        mobile: '',
        meal_type: 'Veg',
        breakfast: true, lunch: true, dinner: true,
        status: 'Active',
        joining_date: new Date().toISOString().split('T')[0],
        monthly_subscription_charge: 0,
        monthly_delivery_charge: 300,
        discount: 0,
        final_payable_amount: 300,
      });
    }
  }, [customer, open]);

  const update = (key: keyof Customer, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'plan_id') {
        const plan = plans.find(p => p.id === value);
        if (plan) {
          next.monthly_subscription_charge = plan.monthly_subscription_charge;
          next.monthly_delivery_charge = plan.monthly_delivery_charge;
        }
      }
      if (['monthly_subscription_charge', 'monthly_delivery_charge', 'discount'].includes(key as string)) {
        const sub = Number(next.monthly_subscription_charge) || 0;
        const del = Number(next.monthly_delivery_charge) || 0;
        const disc = Number(next.discount) || 0;
        next.final_payable_amount = sub + del - disc;
      }
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'ग्राहक संपादित करें' : 'नया ग्राहक जोड़ें'} size="xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="ग्राहक आईडी"><input className="input" value={form.customer_id || ''} onChange={e => update('customer_id', e.target.value)} /></Field>
          <Field label="यूज़रनेम *"><input className="input" value={form.username || ''} onChange={e => update('username', e.target.value)} required /></Field>
          <Field label="पूरा नाम *"><input className="input" value={form.full_name || ''} onChange={e => update('full_name', e.target.value)} required /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="पिता का नाम"><input className="input" value={form.father_name || ''} onChange={e => update('father_name', e.target.value)} /></Field>
          <Field label="मोबाइल *"><input className="input" value={form.mobile || ''} onChange={e => update('mobile', e.target.value)} required /></Field>
          <Field label="वैकल्पिक मोबाइल"><input className="input" value={form.alternate_mobile || ''} onChange={e => update('alternate_mobile', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="ईमेल"><input type="email" className="input" value={form.email || ''} onChange={e => update('email', e.target.value)} /></Field>
          <Field label="आधार"><input className="input" value={form.aadhaar || ''} onChange={e => update('aadhaar', e.target.value)} /></Field>
          <Field label="जन्म तिथि"><input type="date" className="input" value={form.dob || ''} onChange={e => update('dob', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="व्यवसाय"><input className="input" value={form.occupation || ''} onChange={e => update('occupation', e.target.value)} /></Field>
          <Field label="कॉलेज"><input className="input" value={form.college || ''} onChange={e => update('college', e.target.value)} /></Field>
          <Field label="कंपनी"><input className="input" value={form.company || ''} onChange={e => update('company', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="कमरा"><input className="input" value={form.room_number || ''} onChange={e => update('room_number', e.target.value)} /></Field>
          <Field label="आपातकालीन संपर्क"><input className="input" value={form.emergency_contact || ''} onChange={e => update('emergency_contact', e.target.value)} /></Field>
          <Field label="जुड़ने की तिथि"><input type="date" className="input" value={form.joining_date || ''} onChange={e => update('joining_date', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="पता"><textarea className="input" value={form.address || ''} onChange={e => update('address', e.target.value)} /></Field>
          <Field label="डिलीवरी पता"><textarea className="input" value={form.delivery_address || ''} onChange={e => update('delivery_address', e.target.value)} /></Field>
        </div>

        <div className="border-t border-cream-100 pt-4">
          <h4 className="font-semibold text-maroon-800 mb-3">सदस्यता विवरण</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="भोजन प्रकार">
              <select className="input" value={form.meal_type || 'Veg'} onChange={e => update('meal_type', e.target.value as MealType)}>
                <option value="Veg">शाकाहारी</option>
                <option value="Non Veg">मांसाहारी</option>
                <option value="Both">दोनों</option>
              </select>
            </Field>
            <Field label="योजना">
              <select className="input" value={form.plan_id || ''} onChange={e => update('plan_id', e.target.value)}>
                <option value="">कोई नहीं</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="नवीनीकरण तिथि"><input type="date" className="input" value={form.renewal_date || ''} onChange={e => update('renewal_date', e.target.value)} /></Field>
          </div>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.breakfast || false} onChange={e => update('breakfast', e.target.checked)} /> ब्रेकफ़ास्ट</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lunch || false} onChange={e => update('lunch', e.target.checked)} /> लंच</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dinner || false} onChange={e => update('dinner', e.target.checked)} /> डिनर</label>
          </div>
          <div className="grid sm:grid-cols-4 gap-4 mt-3">
            <Field label="सदस्यता शुल्क"><input type="number" className="input" value={form.monthly_subscription_charge || 0} onChange={e => update('monthly_subscription_charge', Number(e.target.value))} /></Field>
            <Field label="डिलीवरी शुल्क"><input type="number" className="input" value={form.monthly_delivery_charge || 0} onChange={e => update('monthly_delivery_charge', Number(e.target.value))} /></Field>
            <Field label="छूट"><input type="number" className="input" value={form.discount || 0} onChange={e => update('discount', Number(e.target.value))} /></Field>
            <Field label="कुल देय"><input type="number" className="input bg-cream-50 font-bold" value={form.final_payable_amount || 0} readOnly /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <Field label="स्थिति">
              <select className="input" value={form.status || 'Active'} onChange={e => update('status', e.target.value as CustomerStatus)}>
                <option value="Active">सक्रिय</option>
                <option value="Paused">रुकी</option>
                <option value="Inactive">निष्क्रिय</option>
              </select>
            </Field>
            <Field label="फ़ोटो URL"><input className="input" value={form.photo_url || ''} onChange={e => update('photo_url', e.target.value)} /></Field>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-cream-100">
          <button type="button" onClick={onClose} className="btn-secondary">रद्द करें</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? <Loader2 size={18} className="animate-spin" /> : null} सहेजें</button>
        </div>
      </form>
    </Modal>
  );
}

function CredentialsModal({ customer, onClose, onCreated }: { customer: Customer | null; onClose: () => void; onCreated: () => void }) {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setEmail(customer.email || `${customer.username}@maakirasoi.in`);
      setPassword(generatePassword());
    }
  }, [customer]);

  if (!customer) return null;

  const createLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/admin-ops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          action: 'create_customer_user',
          email, password,
          customer_id: customer.id,
          username: customer.username,
          full_name: customer.full_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast('success', 'लॉगिन क्रेडेंशियल बनाए गए');
      onCreated();
      onClose();
    } catch (err) {
      toast('error', (err as Error).message);
    }
    setLoading(false);
  };

  return (
    <Modal open={!!customer} onClose={onClose} title="लॉगिन क्रेडेंशियल बनाएँ" size="sm">
      <div className="space-y-4">
        <div className="bg-cream-50 rounded-xl p-3 text-sm text-maroon-600">
          ग्राहक: <strong>{customer.full_name}</strong>
        </div>
        <Field label="ईमेल"><input className="input" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="पासवर्ड"><input className="input font-mono" value={password} onChange={e => setPassword(e.target.value)} /></Field>
        <button onClick={createLogin} disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />} क्रेडेंशियल बनाएँ
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
