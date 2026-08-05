import { useEffect, useState } from 'react';
import {
  Utensils, User, Calendar, Wallet, MessageSquare, ShoppingBag, LogOut,
  Clock, MapPin, Phone, ChevronRight, Plus, Download, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import type { Order, Payment, Complaint, WeeklyMenu, ExtraOrder } from '@/types';

type Tab = 'profile' | 'subscription' | 'menu' | 'orders' | 'payments' | 'complaints' | 'extra';

export function CustomerPanel() {
  const { user, customer, signOut, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [menu, setMenu] = useState<WeeklyMenu[]>([]);
  const [extraOrders, setExtraOrders] = useState<ExtraOrder[]>([]);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (!customer) return;
    const cid = customer.id;
    (async () => {
      const [{ data: o }, { data: p }, { data: c }, { data: m }, { data: eo }] = await Promise.all([
        supabase.from('orders').select('*').eq('customer_id', cid).order('order_date', { ascending: false }).limit(50),
        supabase.from('payments').select('*').eq('customer_id', cid).order('payment_date', { ascending: false }),
        supabase.from('complaints').select('*').eq('customer_id', cid).order('created_at', { ascending: false }),
        supabase.from('weekly_menu').select('*').order('sort_order'),
        supabase.from('extra_orders').select('*').eq('customer_id', cid).order('created_at', { ascending: false }),
      ]);
      if (o) setOrders(o as Order[]);
      if (p) setPayments(p as Payment[]);
      if (c) setComplaints(c as Complaint[]);
      if (m) setMenu(m as WeeklyMenu[]);
      if (eo) setExtraOrders(eo as ExtraOrder[]);
    })();
  }, [user, customer]);

  if (loading) return <PageLoader />;
  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <p className="text-maroon-700 mb-4">आपका ग्राहक प्रोफ़ाइल नहीं मिला। कृपया प्रबंधक से संपर्क करें।</p>
          <button onClick={() => signOut()} className="btn-primary">लॉग आउट</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'प्रोफ़ाइल', icon: User },
    { id: 'subscription', label: 'सदस्यता', icon: Calendar },
    { id: 'menu', label: 'मेनू', icon: Utensils },
    { id: 'orders', label: 'ऑर्डर', icon: ShoppingBag },
    { id: 'payments', label: 'भुगतान', icon: Wallet },
    { id: 'complaints', label: 'शिकायतें', icon: MessageSquare },
    { id: 'extra', label: 'अतिरिक्त ऑर्डर', icon: Plus },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Pending: 'badge-yellow', Delivered: 'badge-green', Skipped: 'badge-gray', Cancelled: 'badge-red',
      Open: 'badge-yellow', 'In Progress': 'badge-blue', Resolved: 'badge-green', Closed: 'badge-gray',
      Approved: 'badge-green', Rejected: 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-maroon-800 text-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cream-400 flex items-center justify-center text-maroon-900">
              <Utensils size={20} />
            </div>
            <div>
              <h1 className="font-display font-bold">माा की रसोई</h1>
              <p className="text-xs text-cream-300">ग्राहक पैनल</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-cream-200">{customer.full_name}</span>
            <button onClick={() => signOut()} className="btn bg-maroon-700 hover:bg-maroon-900 text-white text-sm">
              <LogOut size={16} /> लॉग आउट
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-maroon-700 text-white' : 'bg-white text-maroon-700 hover:bg-maroon-50 border border-cream-200'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {tab === 'profile' && <ProfileTab customer={customer} />}
          {tab === 'subscription' && <SubscriptionTab customer={customer} />}
          {tab === 'menu' && <MenuTab menu={menu} />}
          {tab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-maroon-800 mb-4">ऑर्डर इतिहास</h2>
              {orders.length === 0 ? (
                <EmptyState icon={<ShoppingBag size={48} />} title="कोई ऑर्डर नहीं" description="अभी तक कोई ऑर्डर नहीं मिला।" />
              ) : (
                <div className="card overflow-hidden">
                  <table className="table-base">
                    <thead><tr><th>दिनांक</th><th>भोजन</th><th>योजना</th><th>स्थिति</th></tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td>{formatDate(o.order_date)}</td>
                          <td>{o.meal}</td>
                          <td>{o.plan_name || '-'}</td>
                          <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-maroon-800">भुगतान इतिहास</h2>
                <div className="text-right">
                  <p className="text-sm text-maroon-500">कुल भुगतान</p>
                  <p className="text-xl font-bold text-maroon-700">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</p>
                </div>
              </div>
              {payments.length === 0 ? (
                <EmptyState icon={<Wallet size={48} />} title="कोई भुगतान नहीं" />
              ) : (
                <div className="card overflow-hidden">
                  <table className="table-base">
                    <thead><tr><th>रसीद संख्या</th><th>दिनांक</th><th>राशि</th><th>माध्यम</th><th>माह</th><th></th></tr></thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs">{p.receipt_number || '-'}</td>
                          <td>{formatDate(p.payment_date)}</td>
                          <td className="font-semibold">{formatCurrency(p.amount)}</td>
                          <td>{p.payment_mode}</td>
                          <td>{p.month || '-'}</td>
                          <td>
                            <button onClick={() => downloadReceipt(p, customer.full_name)} className="btn-ghost text-xs py-1 px-2">
                              <Download size={14} /> रसीद
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'complaints' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-maroon-800">मेरी शिकायतें</h2>
                <button onClick={() => setComplaintOpen(true)} className="btn-primary text-sm">
                  <Plus size={16} /> नई शिकायत
                </button>
              </div>
              {complaints.length === 0 ? (
                <EmptyState icon={<MessageSquare size={48} />} title="कोई शिकायत नहीं" description="अभी तक कोई शिकायत दर्ज नहीं है।" />
              ) : (
                <div className="space-y-3">
                  {complaints.map(c => (
                    <div key={c.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-maroon-800">{c.subject}</h3>
                        <span className={statusBadge(c.status)}>{c.status}</span>
                      </div>
                      <p className="text-sm text-maroon-600 mb-2">{c.description}</p>
                      {c.admin_response && (
                        <div className="mt-2 pt-2 border-t border-cream-100">
                          <p className="text-xs font-semibold text-maroon-500">प्रबंधक का उत्तर:</p>
                          <p className="text-sm text-maroon-700">{c.admin_response}</p>
                        </div>
                      )}
                      <p className="text-xs text-maroon-400 mt-2">{formatDate(c.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'extra' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-maroon-800">अतिरिक्त ऑर्डर</h2>
                <button onClick={() => setExtraOpen(true)} className="btn-primary text-sm">
                  <Plus size={16} /> नया अनुरोध
                </button>
              </div>
              {extraOrders.length === 0 ? (
                <EmptyState icon={<Plus size={48} />} title="कोई अतिरिक्त ऑर्डर नहीं" description="अतिरिक्त भोजन के लिए अनुरोध भेजें।" />
              ) : (
                <div className="space-y-3">
                  {extraOrders.map(eo => (
                    <div key={eo.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-maroon-800">{eo.meal_type}</h3>
                          <p className="text-sm text-maroon-500">{formatDate(eo.request_date)}</p>
                        </div>
                        <span className={statusBadge(eo.status)}>{eo.status}</span>
                      </div>
                      {eo.notes && <p className="text-sm text-maroon-600">{eo.notes}</p>}
                      {eo.admin_notes && <p className="text-sm text-maroon-500 mt-1">प्रबंधक: {eo.admin_notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ComplaintModal open={complaintOpen} onClose={() => setComplaintOpen(false)} customerId={customer.id} customerName={customer.full_name} onCreated={() => { setComplaintOpen(false); refreshComplaints(customer.id, setComplaints); }} />
      <ExtraOrderModal open={extraOpen} onClose={() => setExtraOpen(false)} customerId={customer.id} customerName={customer.full_name} onCreated={() => { setExtraOpen(false); refreshExtraOrders(customer.id, setExtraOrders); }} />
    </div>
  );
}

function ProfileTab({ customer }: { customer: NonNullable<ReturnType<typeof useAuth>['customer']> }) {
  const fields = [
    { label: 'ग्राहक आईडी', value: customer.customer_id },
    { label: 'पूरा नाम', value: customer.full_name },
    { label: 'पिता का नाम', value: customer.father_name },
    { label: 'मोबाइल', value: customer.mobile },
    { label: 'वैकल्पिक मोबाइल', value: customer.alternate_mobile },
    { label: 'ईमेल', value: customer.email },
    { label: 'जन्म तिथि', value: customer.dob },
    { label: 'व्यवसाय', value: customer.occupation },
    { label: 'कॉलेज', value: customer.college },
    { label: 'कंपनी', value: customer.company },
    { label: 'कमरा', value: customer.room_number },
    { label: 'आपातकालीन संपर्क', value: customer.emergency_contact },
    { label: 'पता', value: customer.address },
    { label: 'डिलीवरी पता', value: customer.delivery_address },
    { label: 'जुड़ने की तिथि', value: formatDate(customer.joining_date) },
    { label: 'नवीनीकरण तिथि', value: formatDate(customer.renewal_date) },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold text-maroon-800 mb-4">मेरी प्रोफ़ाइल</h2>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cream-100">
          <div className="w-16 h-16 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 text-2xl font-bold">
            {customer.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-maroon-800">{customer.full_name}</h3>
            <p className="text-sm text-maroon-500">{customer.occupation || 'ग्राहक'}</p>
            <span className={`mt-1 inline-block ${customer.status === 'Active' ? 'badge-green' : customer.status === 'Paused' ? 'badge-yellow' : 'badge-red'}`}>
              {customer.status === 'Active' ? 'सक्रिय' : customer.status === 'Paused' ? 'रुकी हुई' : 'निष्क्रिय'}
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex justify-between py-2 border-b border-cream-50">
              <span className="text-sm text-maroon-500">{f.label}</span>
              <span className="text-sm font-medium text-maroon-800 text-right">{f.value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab({ customer }: { customer: NonNullable<ReturnType<typeof useAuth>['customer']> }) {
  const meals = [customer.breakfast && 'ब्रेकफ़ास्ट', customer.lunch && 'लंच', customer.dinner && 'डिनर'].filter(Boolean);
  return (
    <div>
      <h2 className="text-xl font-bold text-maroon-800 mb-4">मेरी सदस्यता</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-maroon-800 mb-3">योजना विवरण</h3>
          <div className="space-y-2 text-sm">
            <Row label="भोजन प्रकार" value={customer.meal_type} />
            <Row label="भोजन समय" value={meals.join(', ') || '-'} />
            <Row label="नवीनीकरण तिथि" value={formatDate(customer.renewal_date)} />
            <Row label="स्थिति" value={customer.status === 'Active' ? 'सक्रिय' : customer.status === 'Paused' ? 'रुकी हुई' : 'निष्क्रिय'} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-maroon-800 mb-3">भुगतान विवरण</h3>
          <div className="space-y-2 text-sm">
            <Row label="मासिक सदस्यता शुल्क" value={formatCurrency(customer.monthly_subscription_charge)} />
            <Row label="मासिक डिलीवरी शुल्क" value={formatCurrency(customer.monthly_delivery_charge)} />
            <Row label="छूट" value={formatCurrency(customer.discount)} />
            <div className="pt-2 mt-2 border-t border-cream-100">
              <Row label="कुल देय" value={formatCurrency(customer.final_payable_amount)} bold />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-maroon-500">{label}</span>
      <span className={bold ? 'font-bold text-maroon-800' : 'font-medium text-maroon-800'}>{value}</span>
    </div>
  );
}

function MenuTab({ menu }: { menu: WeeklyMenu[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-maroon-800 mb-4">साप्ताहिक मेनू</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.map(day => (
          <div key={day.id} className="card p-5">
            <h3 className="font-bold text-maroon-800 mb-3">{day.day_of_week}</h3>
            <div className="space-y-2 text-sm">
              <div><p className="text-xs font-semibold text-cream-700 uppercase">ब्रेकफ़ास्ट</p><p className="text-maroon-700">{day.breakfast || '-'}</p></div>
              <div><p className="text-xs font-semibold text-cream-700 uppercase">लंच</p><p className="text-maroon-700">{day.lunch || '-'}</p></div>
              <div><p className="text-xs font-semibold text-cream-700 uppercase">डिनर</p><p className="text-maroon-700">{day.dinner || '-'}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintModal({ open, onClose, customerId, customerName, onCreated }: { open: boolean; onClose: () => void; customerId: string; customerName: string; onCreated: () => void }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setLoading(true);
    const { error } = await supabase.from('complaints').insert({
      customer_id: customerId, customer_name: customerName, subject, description, status: 'Open',
    });
    setLoading(false);
    if (error) { toast('error', 'शिकायत दर्ज नहीं हुई'); return; }
    toast('success', 'शिकायत दर्ज हो गई');
    setSubject(''); setDescription('');
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="नई शिकायत दर्ज करें" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">विषय</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="input" required placeholder="शिकायत का विषय" />
        </div>
        <div>
          <label className="label">विवरण</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[120px]" required placeholder="विस्तार से बताएँ..." />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">शिकायत भेजें</button>
      </form>
    </Modal>
  );
}

function ExtraOrderModal({ open, onClose, customerId, customerName, onCreated }: { open: boolean; onClose: () => void; customerId: string; customerName: string; onCreated: () => void }) {
  const [mealType, setMealType] = useState('Extra Lunch');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('extra_orders').insert({
      customer_id: customerId, customer_name: customerName, meal_type: mealType, request_date: todayISO(), notes, status: 'Pending',
    });
    setLoading(false);
    if (error) { toast('error', 'अनुरोध नहीं भेजा गया'); return; }
    toast('success', 'अनुरोध भेज दिया गया - प्रबंधक इसे स्वीकार करेंगे');
    setMealType('Extra Lunch'); setNotes('');
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="अतिरिक्त ऑर्डर अनुरोध" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">भोजन प्रकार</label>
          <select value={mealType} onChange={e => setMealType(e.target.value)} className="input">
            <option>Extra Lunch</option>
            <option>Extra Dinner</option>
            <option>Special Thali</option>
            <option>Custom Meal</option>
            <option>Extra Breakfast</option>
          </select>
        </div>
        <div>
          <label className="label">टिप्पणी</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[100px]" placeholder="कोई विशेष निर्देश..." />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">अनुरोध भेजें</button>
      </form>
    </Modal>
  );
}

async function refreshComplaints(customerId: string, setComplaints: (c: Complaint[]) => void) {
  const { data } = await supabase.from('complaints').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
  if (data) setComplaints(data as Complaint[]);
}

async function refreshExtraOrders(customerId: string, setExtraOrders: (e: ExtraOrder[]) => void) {
  const { data } = await supabase.from('extra_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
  if (data) setExtraOrders(data as ExtraOrder[]);
}

function downloadReceipt(payment: Payment, customerName: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>रसीद ${payment.receipt_number || ''}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; }
      h1 { color: #7B1E1E; text-align: center; }
      .header { text-align: center; border-bottom: 2px solid #7B1E1E; padding-bottom: 10px; margin-bottom: 20px; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .total { font-weight: bold; font-size: 1.2em; color: #7B1E1E; }
      .footer { text-align: center; margin-top: 30px; color: #666; }
    </style></head><body>
      <div class="header">
        <h1>Maa Ki Rasoi</h1>
        <p>गोपालगंज, सागर (मध्य प्रदेश)</p>
      </div>
      <h2 style="text-align:center">भुगतान रसीद</h2>
      <div class="row"><span>रसीद संख्या:</span><span>${payment.receipt_number || '-'}</span></div>
      <div class="row"><span>ग्राहक:</span><span>${customerName}</span></div>
      <div class="row"><span>दिनांक:</span><span>${formatDate(payment.payment_date)}</span></div>
      <div class="row"><span>माह:</span><span>${payment.month || '-'}</span></div>
      <div class="row"><span>माध्यम:</span><span>${payment.payment_mode}</span></div>
      <div class="row total"><span>राशि:</span><span>${formatCurrency(payment.amount)}</span></div>
      ${payment.notes ? `<div class="row"><span>टिप्पणी:</span><span>${payment.notes}</span></div>` : ''}
      <div class="footer"><p>धन्यवाद! - माा की रसोई</p></div>
    </body></html>
  `);
  win.document.close();
  win.print();
}
