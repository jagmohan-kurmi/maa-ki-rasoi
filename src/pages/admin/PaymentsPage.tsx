import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, generateReceiptNumber, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Payment, PaymentMode, Customer } from '@/types';

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('customers').select('id, full_name, final_payable_amount').order('full_name'),
    ]);
    if (p) setPayments(p as Payment[]);
    if (c) setCustomers(c as Customer[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter(p => !search || p.customer_name.toLowerCase().includes(search.toLowerCase()) || (p.receipt_number || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data: Partial<Payment>) => {
    if (editing) {
      const { error } = await supabase.from('payments').update(data).eq('id', editing.id);
      if (error) { toast('error', 'अपडेट विफल'); return; }
      toast('success', 'भुगतान अपडेट हुआ');
    } else {
      if (!data.receipt_number) data.receipt_number = generateReceiptNumber();
      const { error } = await supabase.from('payments').insert(data);
      if (error) { toast('error', error.message); return; }
      toast('success', 'भुगतान जोड़ा गया');
    }
    setModalOpen(false); setEditing(null); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('payments').delete().eq('id', deleteId);
    if (error) { toast('error', 'हटाना विफल'); return; }
    toast('success', 'भुगतान हटाया गया');
    load();
  };

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="ग्राहक या रसीद खोजें..." />
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={18} /> भुगतान जोड़ें</button>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <span className="text-maroon-600">कुल भुगतान: <strong className="text-maroon-800 text-lg">{formatCurrency(totalAmount)}</strong></span>
        <span className="text-sm text-maroon-500">{filtered.length} रिकॉर्ड</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Plus size={48} />} title="कोई भुगतान नहीं" />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>रसीद सं.</th><th>ग्राहक</th><th>राशि</th><th>माध्यम</th><th>दिनांक</th><th>माह</th><th>क्रियाएँ</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.receipt_number || '-'}</td>
                  <td className="font-semibold">{p.customer_name}</td>
                  <td className="font-semibold">{formatCurrency(p.amount)}</td>
                  <td><span className="badge-maroon">{p.payment_mode}</span></td>
                  <td>{formatDate(p.payment_date)}</td>
                  <td>{p.month || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => downloadReceipt(p)} className="p-1.5 rounded-lg hover:bg-maroon-50 text-maroon-600" title="रसीद"><Download size={16} /></button>
                      <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-maroon-50 text-maroon-600"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaymentModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} payment={editing} customers={customers} onSave={handleSave} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="भुगतान हटाएँ" message="क्या आप वाकई यह भुगता�न हटाना चाहते हैं?" confirmText="हटाएँ" danger />
    </div>
  );
}

function PaymentModal({ open, onClose, payment, customers, onSave }: { open: boolean; onClose: () => void; payment: Payment | null; customers: Customer[]; onSave: (d: Partial<Payment>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Payment>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) setForm(payment);
    else setForm({ amount: 0, payment_mode: 'Cash', payment_date: todayISO(), receipt_number: generateReceiptNumber(), month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) });
  }, [payment, open]);

  const update = (k: keyof Payment, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cust = customers.find(c => c.id === form.customer_id);
    if (cust) form.customer_name = cust.full_name;
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'भुगतान संपादित करें' : 'नया भुगतान'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">ग्राहक *</label>
          <select className="input" value={form.customer_id || ''} onChange={e => update('customer_id', e.target.value)} required>
            <option value="">चुनें</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({formatCurrency(c.final_payable_amount)})</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">राशि *</label><input type="number" step="0.01" className="input" value={form.amount || 0} onChange={e => update('amount', Number(e.target.value))} required /></div>
          <div><label className="label">माध्यम</label>
            <select className="input" value={form.payment_mode || 'Cash'} onChange={e => update('payment_mode', e.target.value as PaymentMode)}>
              <option>Cash</option><option>UPI</option><option>Bank</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">दिनांक</label><input type="date" className="input" value={form.payment_date || ''} onChange={e => update('payment_date', e.target.value)} /></div>
          <div><label className="label">माह</label><input className="input" value={form.month || ''} onChange={e => update('month', e.target.value)} placeholder="अगस्त 2026" /></div>
        </div>
        <div><label className="label">रसीद संख्या</label><input className="input font-mono" value={form.receipt_number || ''} onChange={e => update('receipt_number', e.target.value)} /></div>
        <div><label className="label">टिप्पणी</label><input className="input" value={form.notes || ''} onChange={e => update('notes', e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} सहेजें</button>
      </form>
    </Modal>
  );
}

function downloadReceipt(p: Payment) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>रसीद ${p.receipt_number || ''}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; }
      h1 { color: #7B1E1E; text-align: center; }
      .header { text-align: center; border-bottom: 2px solid #7B1E1E; padding-bottom: 10px; margin-bottom: 20px; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .total { font-weight: bold; font-size: 1.2em; color: #7B1E1E; }
      .footer { text-align: center; margin-top: 30px; color: #666; }
    </style></head><body>
      <div class="header"><h1>Maa Ki Rasoi</h1><p>गोपालगंज, सागर (मध्य प्रदेश)</p></div>
      <h2 style="text-align:center">भुगतान रसीद</h2>
      <div class="row"><span>रसीद संख्या:</span><span>${p.receipt_number || '-'}</span></div>
      <div class="row"><span>ग्राहक:</span><span>${p.customer_name}</span></div>
      <div class="row"><span>दिनांक:</span><span>${formatDate(p.payment_date)}</span></div>
      <div class="row"><span>माह:</span><span>${p.month || '-'}</span></div>
      <div class="row"><span>माध्यम:</span><span>${p.payment_mode}</span></div>
      <div class="row total"><span>राशि:</span><span>${formatCurrency(p.amount)}</span></div>
      ${p.notes ? `<div class="row"><span>टिप्पणी:</span><span>${p.notes}</span></div>` : ''}
      <div class="footer"><p>धन्यवाद! - माा की रसोई</p></div>
    </body></html>
  `);
  win.document.close();
  win.print();
}
