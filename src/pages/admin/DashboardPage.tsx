import { useEffect, useState } from 'react';
import {
  ShoppingBag, CheckCircle2, Users, UserCheck, Pause, Wallet,
  TrendingUp, Receipt, TrendingDown, AlertCircle, Calendar, Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { BarChart, LineChart } from '@/components/admin/Charts';
import type { DashboardStats } from '@/components/admin/AdminLayout';

export function DashboardPage({ stats, onNavigate }: { stats: DashboardStats | null; onNavigate: (p: string) => void }) {
  const [revenueData, setRevenueData] = useState<{ label: string; value: number }[]>([]);
  const [expenseData, setExpenseData] = useState<{ label: string; value: number }[]>([]);
  const [profitData, setProfitData] = useState<{ label: string; value: number }[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<{ label: string; value: number }[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const months: { label: string; ms: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleDateString('en-IN', { month: 'short' }),
          ms: d.toISOString().split('T')[0],
        });
      }
      const monthEnd = (ms: string) => {
        const d = new Date(ms);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      };

      const [revRes, expRes, custRes] = await Promise.all([
        Promise.all(months.map(async m => {
          const { data } = await supabase.from('payments').select('amount').gte('payment_date', m.ms).lte('payment_date', monthEnd(m.ms));
          return { label: m.label, value: data?.reduce((s, p) => s + p.amount, 0) || 0 };
        })),
        Promise.all(months.map(async m => {
          const { data } = await supabase.from('expenses').select('amount').gte('expense_date', m.ms).lte('expense_date', monthEnd(m.ms));
          return { label: m.label, value: data?.reduce((s, e) => s + e.amount, 0) || 0 };
        })),
        Promise.all(months.map(async m => {
          const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).lte('created_at', monthEnd(m.ms) + 'T23:59:59');
          return { label: m.label, value: count || 0 };
        })),
      ]);

      setRevenueData(revRes);
      setExpenseData(expRes);
      setProfitData(revRes.map((r, i) => ({ label: r.label, value: r.value - (expRes[i]?.value || 0) })));
      setCustomerGrowth(custRes);
    })();
  }, []);

  const generateOrders = async () => {
    setGenerating(true);
    try {
      const today = todayISO();
      const { data: existing } = await supabase.from('orders').select('id').eq('order_date', today).limit(1);
      if (existing && existing.length > 0) {
        toast('info', 'आज के ऑर्डर पहले से बने हुए हैं');
        setGenerating(false);
        return;
      }

      const { data: customers } = await supabase.from('customers').select('*').eq('status', 'Active');
      if (!customers || customers.length === 0) {
        toast('error', 'कोई सक्रिय ग्राहक नहीं');
        setGenerating(false);
        return;
      }

      const { data: plans } = await supabase.from('plans').select('name, id');
      const planMap: Record<string, string> = {};
      plans?.forEach(p => { planMap[p.id] = p.name; });

      const orders = customers.flatMap(c => {
        const planName = c.plan_id ? (planMap[c.plan_id] || '') : '';
        const list = [];
        if (c.breakfast) list.push({ customer_id: c.id, customer_name: c.full_name, meal: 'Breakfast', order_date: today, plan_name: planName, status: 'Pending', is_extra: false });
        if (c.lunch) list.push({ customer_id: c.id, customer_name: c.full_name, meal: 'Lunch', order_date: today, plan_name: planName, status: 'Pending', is_extra: false });
        if (c.dinner) list.push({ customer_id: c.id, customer_name: c.full_name, meal: 'Dinner', order_date: today, plan_name: planName, status: 'Pending', is_extra: false });
        return list;
      });

      if (orders.length > 0) {
        const { error } = await supabase.from('orders').insert(orders);
        if (error) throw error;
        toast('success', `${orders.length} ऑर्डर बनाए गए`);
      } else {
        toast('info', 'कोई ऑर्डर नहीं बना - कोई भोजन चयनित नहीं');
      }
    } catch {
      toast('error', 'ऑर्डर बनाने में त्रुटि');
    }
    setGenerating(false);
  };

  if (!stats) return <div className="py-12 text-center text-maroon-500">लोड हो रहा है...</div>;

  const cards = [
    { label: 'आज के ऑर्डर', value: stats.todayOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'आज की डिलीवरी', value: stats.todayDeliveries, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'कुल ग्राहक', value: stats.totalCustomers, icon: Users, color: 'text-maroon-600 bg-maroon-50' },
    { label: 'सक्रिय ग्राहक', value: stats.activeCustomers, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'रुकी सदस्यताएँ', value: stats.pausedSubs, icon: Pause, color: 'text-amber-600 bg-amber-50' },
    { label: 'आज की आय', value: formatCurrency(stats.todayIncome), icon: Wallet, color: 'text-green-600 bg-green-50' },
    { label: 'मासिक आय', value: formatCurrency(stats.monthlyIncome), icon: TrendingUp, color: 'text-maroon-600 bg-maroon-50' },
    { label: 'कुल खर्च', value: formatCurrency(stats.totalExpenses), icon: Receipt, color: 'text-red-600 bg-red-50' },
    { label: 'शुद्ध लाभ', value: formatCurrency(stats.netProfit), icon: TrendingDown, color: stats.netProfit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
    { label: 'बकाया भुगतान', value: stats.pendingPayments, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'आज की शिकायतें', value: stats.todayComplaints, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    { label: 'आगामी रिन्यूअल', value: stats.upcomingRenewals, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Generate Orders */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-maroon-800">आज के ऑर्डर बनाएँ</h3>
          <p className="text-sm text-maroon-500">सभी सक्रिय सदस्यताओं के लिए ऑर्डर स्वतः बनाएँ</p>
        </div>
        <button onClick={generateOrders} disabled={generating} className="btn-primary">
          <Plus size={18} /> {generating ? 'बन रहे हैं...' : 'ऑर्डर जनरेट करें'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-maroon-800">{c.value}</p>
            <p className="text-sm text-maroon-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-maroon-800 mb-4">मासिक आय</h3>
          <BarChart data={revenueData} formatValue={(v) => formatCurrency(v)} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-maroon-800 mb-4">मासिक खर्च</h3>
          <BarChart data={expenseData} color="#C26A6A" formatValue={(v) => formatCurrency(v)} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-maroon-800 mb-4">शुद्ध लाभ</h3>
          <LineChart data={profitData} color="#2E7D32" />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-maroon-800 mb-4">ग्राहक वृद्धि</h3>
          <LineChart data={customerGrowth} color="#7B1E1E" />
        </div>
      </div>
    </div>
  );
}
