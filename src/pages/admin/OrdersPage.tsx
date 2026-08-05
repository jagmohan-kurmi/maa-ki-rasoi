import { useEffect, useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock, SkipForward, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { todayISO, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Order, OrderStatus, ExtraOrder, Customer } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Delivered', 'Skipped', 'Cancelled'];
const STATUS_LABELS: Record<OrderStatus, string> = { Pending: 'लंबित', Delivered: 'डिलीवर हुआ', Skipped: 'छोड़ा', Cancelled: 'रद्द' };

export function OrdersPage() {
  const [date, setDate] = useState(todayISO());
  const [orders, setOrders] = useState<Order[]>([]);
  const [extraOrders, setExtraOrders] = useState<ExtraOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [manualOpen, setManualOpen] = useState(false);
  const [extraTab, setExtraTab] = useState(false);

  const load = async () => {
    const [{ data: o }, { data: eo }, { data: c }] = await Promise.all([
      supabase.from('orders').select('*').eq('order_date', date).order('created_at', { ascending: false }),
      supabase.from('extra_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name').eq('status', 'Active'),
    ]);
    if (o) setOrders(o as Order[]);
    if (eo) setExtraOrders(eo as ExtraOrder[]);
    if (c) setCustomers(c as Customer[]);
  };

  useEffect(() => { load(); }, [date]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (error) { toast('error', 'अपडेट विफल'); return; }
    toast('success', `ऑर्डर ${STATUS_LABELS[status]}`);
    load();
  };

  const approveExtra = async (eo: ExtraOrder, approve: boolean) => {
    const status = approve ? 'Approved' : 'Rejected';
    const { error } = await supabase.from('extra_orders').update({ status }).eq('id', eo.id);
    if (error) { toast('error', 'विफल'); return; }
    if (approve) {
      const mealMap: Record<string, string> = { 'Extra Breakfast': 'Breakfast', 'Extra Lunch': 'Lunch', 'Extra Dinner': 'Dinner' };
      const meal = mealMap[eo.meal_type] || 'Lunch';
      await supabase.from('orders').insert({
        customer_id: eo.customer_id, customer_name: eo.customer_name, meal: meal as Order['meal'],
        order_date: todayISO(), plan_name: eo.meal_type, status: 'Pending', is_extra: true, notes: eo.notes,
      });
    }
    toast('success', approve ? 'अनुरोध स्वीकृत' : 'अनुरोध अस्वीकृत');
    load();
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingExtra = extraOrders.filter(e => e.status === 'Pending');

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Pending: 'badge-yellow', Delivered: 'badge-green', Skipped: 'badge-gray', Cancelled: 'badge-red', Approved: 'badge-green', Rejected: 'badge-red' };
    return map[s] || 'badge-gray';
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setExtraTab(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${!extraTab ? 'bg-maroon-700 text-white' : 'bg-white text-maroon-700 border border-cream-200'}`}>आज के ऑर्डर</button>
        <button onClick={() => setExtraTab(true)} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${extraTab ? 'bg-maroon-700 text-white' : 'bg-white text-maroon-700 border border-cream-200'}`}>
          अतिरिक्त अनुरोध
          {pendingExtra.length > 0 && <span className="badge-red">{pendingExtra.length}</span>}
        </button>
      </div>

      {!extraTab ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input sm:w-44" />
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="ग्राहक खोजें..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
              <option value="all">सभी</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={() => setManualOpen(true)} className="btn-primary"><Plus size={18} /> ऑर्डर</button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Clock size={48} />} title="कोई ऑर्डर नहीं" description={`इस दिन के लिए कोई ऑर्डर नहीं: ${formatDate(date)}`} />
          ) : (
            <div className="table-wrap">
              <table className="table-base">
                <thead><tr><th>ग्राहक</th><th>भोजन</th><th>योजना</th><th>स्थिति</th><th>क्रियाएँ</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td className="font-semibold">{o.customer_name} {o.is_extra && <span className="badge-blue ml-1">अतिरिक्त</span>}</td>
                      <td>{o.meal}</td>
                      <td>{o.plan_name || '-'}</td>
                      <td><span className={statusBadge(o.status)}>{STATUS_LABELS[o.status]}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(o, 'Delivered')} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="डिलीवर"><CheckCircle2 size={16} /></button>
                          <button onClick={() => updateStatus(o, 'Skipped')} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="छोड़ा"><SkipForward size={16} /></button>
                          <button onClick={() => updateStatus(o, 'Cancelled')} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="रद्द"><XCircle size={16} /></button>
                          <button onClick={() => updateStatus(o, 'Pending')} className="p-1.5 rounded-lg hover:bg-maroon-50 text-maroon-600" title="लंबित"><Clock size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {pendingExtra.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={48} />} title="कोई लंबित अनुरोध नहीं" />
          ) : (
            pendingExtra.map(eo => (
              <div key={eo.id} className="card p-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-maroon-800">{eo.customer_name} - {eo.meal_type}</h3>
                  <p className="text-sm text-maroon-500">{formatDate(eo.request_date)}</p>
                  {eo.notes && <p className="text-sm text-maroon-600 mt-1">{eo.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveExtra(eo, true)} className="btn-primary text-sm py-1.5"><CheckCircle2 size={16} /> स्वीकृत</button>
                  <button onClick={() => approveExtra(eo, false)} className="btn-danger text-sm py-1.5"><XCircle size={16} /> अस्वीकृत</button>
                </div>
              </div>
            ))
          )}
          {extraOrders.filter(e => e.status !== 'Pending').length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-maroon-800 mb-3">पिछले अनुरोध</h3>
              <div className="space-y-2">
                {extraOrders.filter(e => e.status !== 'Pending').slice(0, 10).map(eo => (
                  <div key={eo.id} className="card p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-maroon-800">{eo.customer_name}</span> - {eo.meal_type}
                      <span className="text-sm text-maroon-500 ml-2">{formatDate(eo.request_date)}</span>
                    </div>
                    <span className={statusBadge(eo.status)}>{eo.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ManualOrderModal open={manualOpen} onClose={() => setManualOpen(false)} customers={customers} date={date} onCreated={load} />
    </div>
  );
}

function ManualOrderModal({ open, onClose, customers, date, onCreated }: { open: boolean; onClose: () => void; customers: Customer[]; date: string; onCreated: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const [meal, setMeal] = useState('Lunch');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    const cust = customers.find(c => c.id === customerId);
    const { error } = await supabase.from('orders').insert({
      customer_id: customerId, customer_name: cust?.full_name || '', meal, order_date: date, plan_name: 'Manual', status: 'Pending', is_extra: false, notes,
    });
    setLoading(false);
    if (error) { toast('error', 'ऑर्डर नहीं बना'); return; }
    toast('success', 'ऑर्डर जोड़ा गया');
    setCustomerId(''); setNotes('');
    onCreated(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="मैन्युअल ऑर्डर" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">ग्राहक</label>
          <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
            <option value="">चुनें</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div><label className="label">भोजन</label>
          <select className="input" value={meal} onChange={e => setMeal(e.target.value)}>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
          </select>
        </div>
        <div><label className="label">टिप्पणी</label><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} ऑर्डर जोड़ें</button>
      </form>
    </Modal>
  );
}
