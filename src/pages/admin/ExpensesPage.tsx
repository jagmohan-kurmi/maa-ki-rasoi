import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Expense, ExpenseCategory } from '@/types';

const CATEGORIES: ExpenseCategory[] = ['Vegetables', 'Milk', 'Gas', 'Rent', 'Salary', 'Fuel', 'Electricity', 'Kitchen Items', 'Maintenance', 'Miscellaneous'];
const CAT_LABELS: Record<string, string> = {
  Vegetables: 'सब्ज़ियाँ', Milk: 'दूध', Gas: 'गैस', Rent: 'किराया', Salary: 'वेतन',
  Fuel: 'ईंधन', Electricity: 'बिजली', 'Kitchen Items': 'रसोई सामान', Maintenance: 'रखरखाव', Miscellaneous: 'अन्य',
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const handleSave = async (data: Partial<Expense>) => {
    if (editing) {
      const { error } = await supabase.from('expenses').update(data).eq('id', editing.id);
      if (error) { toast('error', 'अपडेट विफल'); return; }
      toast('success', 'खर्च अपडेट हुआ');
    } else {
      const { error } = await supabase.from('expenses').insert(data);
      if (error) { toast('error', error.message); return; }
      toast('success', 'खर्च जोड़ा गया');
    }
    setModalOpen(false); setEditing(null); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
    if (error) { toast('error', 'हटाना विफल'); return; }
    toast('success', 'खर्च हटाया गया');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="खोजें..." />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input sm:w-44">
          <option value="all">सभी श्रेणियाँ</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={18} /> खर्च जोड़ें</button>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <span className="text-maroon-600">कुल खर्च: <strong className="text-maroon-800 text-lg">{formatCurrency(totalAmount)}</strong></span>
        <span className="text-sm text-maroon-500">{filtered.length} रिकॉर्ड</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Plus size={48} />} title="कोई खर्च नहीं" />
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>श्रेणी</th><th>विवरण</th><th>राशि</th><th>दिनांक</th><th>क्रियाएँ</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td><span className="badge-maroon">{CAT_LABELS[e.category] || e.category}</span></td>
                  <td>{e.description || '-'}</td>
                  <td className="font-semibold">{formatCurrency(e.amount)}</td>
                  <td>{formatDate(e.expense_date)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(e); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-maroon-50 text-maroon-600"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} expense={editing} onSave={handleSave} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="खर्च हटाएँ" message="क्या आप वाकई यह खर्च हटाना चाहते हैं?" confirmText="हटाएँ" danger />
    </div>
  );
}

function ExpenseModal({ open, onClose, expense, onSave }: { open: boolean; onClose: () => void; expense: Expense | null; onSave: (d: Partial<Expense>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Expense>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) setForm(expense);
    else setForm({ category: 'Vegetables', amount: 0, expense_date: todayISO(), description: '' });
  }, [expense, open]);

  const update = (k: keyof Expense, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'खर्च संपादित करें' : 'नया खर्च'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">श्रेणी</label>
          <select className="input" value={form.category || 'Vegetables'} onChange={e => update('category', e.target.value as ExpenseCategory)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div><label className="label">विवरण</label><input className="input" value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="किस से संबंधित" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">राशि *</label><input type="number" step="0.01" className="input" value={form.amount || 0} onChange={e => update('amount', Number(e.target.value))} required /></div>
          <div><label className="label">दिनांक</label><input type="date" className="input" value={form.expense_date || ''} onChange={e => update('expense_date', e.target.value)} /></div>
        </div>
        <div><label className="label">टिप्पणी</label><input className="input" value={form.notes || ''} onChange={e => update('notes', e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} सहेजें</button>
      </form>
    </Modal>
  );
}
