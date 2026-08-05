import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Power, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Plan } from '@/types';

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('plans').select('*').order('sort_order');
    if (data) setPlans(data as Plan[]);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: Partial<Plan>) => {
    if (editing) {
      const { error } = await supabase.from('plans').update(data).eq('id', editing.id);
      if (error) { toast('error', 'अपडेट विफल'); return; }
      toast('success', 'योजना अपडेट हुई');
    } else {
      const { error } = await supabase.from('plans').insert(data);
      if (error) { toast('error', error.message); return; }
      toast('success', 'नई योजना बनी');
    }
    setModalOpen(false); setEditing(null); load();
  };

  const toggleActive = async (p: Plan) => {
    const { error } = await supabase.from('plans').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) { toast('error', 'विफल'); return; }
    toast('success', p.is_active ? 'निष्क्रिय' : 'सक्रिय');
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('plans').delete().eq('id', deleteId);
    if (error) { toast('error', 'हटाना विफल'); return; }
    toast('success', 'योजना हटाई गई');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-maroon-600 text-sm">{plans.length} योजनाएँ</p>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={18} /> नई योजना</button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={<Plus size={48} />} title="कोई योजना नहीं" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-maroon-800">{p.name}</h3>
                <span className={p.is_active ? 'badge-green' : 'badge-gray'}>{p.is_active ? 'सक्रिय' : 'निष्क्रिय'}</span>
              </div>
              <p className="text-sm text-maroon-500 mb-3">{p.duration}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.breakfast && <span className="badge-maroon">ब्रेकफ़ास्ट</span>}
                {p.lunch && <span className="badge-maroon">लंच</span>}
                {p.dinner && <span className="badge-maroon">डिनर</span>}
                {p.veg && <span className="badge-green">शाकाहारी</span>}
                {p.non_veg && <span className="badge-red">मांसाहारी</span>}
                {p.is_student_plan && <span className="badge-blue">छात्र</span>}
              </div>
              <p className="text-lg font-bold text-maroon-700 mb-3">{formatCurrency(p.monthly_subscription_charge + p.monthly_delivery_charge)}<span className="text-sm font-normal text-maroon-500">/माह</span></p>
              <p className="text-sm text-maroon-600 mb-4 line-clamp-2">{p.description}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(p); setModalOpen(true); }} className="btn-outline text-sm flex-1"><Edit2 size={14} /> संपादित</button>
                <button onClick={() => toggleActive(p)} className="btn-ghost text-sm"><Power size={14} /></button>
                <button onClick={() => setDeleteId(p.id)} className="btn-ghost text-sm text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} plan={editing} onSave={handleSave} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="योजना हटाएँ" message="क्या आप वाकई यह योजना हटाना चाहते हैं?" confirmText="हटाएँ" danger />
    </div>
  );
}

function PlanModal({ open, onClose, plan, onSave }: { open: boolean; onClose: () => void; plan: Plan | null; onSave: (d: Partial<Plan>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Plan>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) setForm(plan);
    else setForm({ name: '', duration: 'Monthly', breakfast: true, lunch: true, dinner: true, veg: true, non_veg: false, is_student_plan: false, is_custom: false, monthly_subscription_charge: 0, monthly_delivery_charge: 300, description: '', benefits: '', is_active: true, sort_order: 0 });
  }, [plan, open]);

  const update = (k: keyof Plan, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? 'योजना संपादित करें' : 'नई योजना'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">योजना नाम *</label><input className="input" value={form.name || ''} onChange={e => update('name', e.target.value)} required /></div>
          <div><label className="label">अवधि</label><input className="input" value={form.duration || ''} onChange={e => update('duration', e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">मासिक सदस्यता शुल्क</label><input type="number" className="input" value={form.monthly_subscription_charge || 0} onChange={e => update('monthly_subscription_charge', Number(e.target.value))} /></div>
          <div><label className="label">मासिक डिलीवरी शुल्क</label><input type="number" className="input" value={form.monthly_delivery_charge || 0} onChange={e => update('monthly_delivery_charge', Number(e.target.value))} /></div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.breakfast || false} onChange={e => update('breakfast', e.target.checked)} /> ब्रेकफ़ास्ट</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lunch || false} onChange={e => update('lunch', e.target.checked)} /> लंच</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dinner || false} onChange={e => update('dinner', e.target.checked)} /> डिनर</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.veg || false} onChange={e => update('veg', e.target.checked)} /> शाकाहारी</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.non_veg || false} onChange={e => update('non_veg', e.target.checked)} /> मांसाहारी</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_student_plan || false} onChange={e => update('is_student_plan', e.target.checked)} /> छात्र योजना</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_custom || false} onChange={e => update('is_custom', e.target.checked)} /> कस्टम</label>
        </div>
        <div><label className="label">विवरण</label><textarea className="input" value={form.description || ''} onChange={e => update('description', e.target.value)} /></div>
        <div><label className="label">लाभ (हर लाइन एक)</label><textarea className="input" value={form.benefits || ''} onChange={e => update('benefits', e.target.value)} placeholder="रोज़ 3 वक़्त भोजन&#10;घर जैसा स्वाद" /></div>
        <div className="flex gap-3 justify-end pt-4 border-t border-cream-100">
          <button type="button" onClick={onClose} className="btn-secondary">रद्द करें</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? <Loader2 size={18} className="animate-spin" /> : null} सहेजें</button>
        </div>
      </form>
    </Modal>
  );
}
