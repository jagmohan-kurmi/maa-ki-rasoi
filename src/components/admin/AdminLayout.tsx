import { type ReactNode } from 'react';
import {
  LayoutDashboard, Users, Calendar, Utensils, ShoppingBag, Wallet,
  Receipt, MessageSquare, UserCog, ClipboardCheck, FileText, Settings, LogOut,
  UtensilsCrossed, Bell, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type AdminPage =
  | 'dashboard' | 'customers' | 'plans' | 'menu' | 'orders'
  | 'payments' | 'expenses' | 'complaints' | 'employees' | 'attendance'
  | 'reports' | 'settings';

interface NavItem {
  id: AdminPage;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'डैशबोर्ड', icon: LayoutDashboard },
  { id: 'customers', label: 'ग्राहक', icon: Users },
  { id: 'plans', label: 'सदस्यता योजनाएँ', icon: Calendar },
  { id: 'menu', label: 'साप्ताहिक मेनू', icon: Utensils },
  { id: 'orders', label: 'ऑर्डर एवं डिलीवरी', icon: ShoppingBag },
  { id: 'payments', label: 'भुगतान', icon: Wallet },
  { id: 'expenses', label: 'खर्च', icon: Receipt },
  { id: 'complaints', label: 'शिकायतें', icon: MessageSquare },
  { id: 'employees', label: 'कर्मचारी', icon: UserCog },
  { id: 'attendance', label: 'उपस्थिति', icon: ClipboardCheck },
  { id: 'reports', label: 'रिपोर्ट', icon: FileText },
  { id: 'settings', label: 'सेटिंग्स', icon: Settings },
];

export interface DashboardStats {
  todayOrders: number;
  todayDeliveries: number;
  totalCustomers: number;
  activeCustomers: number;
  pausedSubs: number;
  todayIncome: number;
  monthlyIncome: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  todayComplaints: number;
  upcomingRenewals: number;
  pendingExtraOrders: number;
}

export function AdminLayout({ page, onNavigate, children, stats }: { page: AdminPage; onNavigate: (p: AdminPage) => void; children: ReactNode; stats: DashboardStats | null }) {
  const { signOut, settings } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifCount = stats ? (stats.pendingExtraOrders + stats.todayComplaints + stats.pendingPayments) : 0;

  const handleNav = (p: AdminPage) => {
    onNavigate(p);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-maroon-900 text-cream-100 z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-maroon-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cream-400 flex items-center justify-center text-maroon-900">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">माा की रसोई</h1>
              <p className="text-xs text-cream-400">प्रबंधन प्रणाली</p>
            </div>
          </div>
        </div>
        <nav className="p-3 overflow-y-auto h-[calc(100vh-140px)]">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                page === item.id ? 'bg-maroon-700 text-white' : 'text-cream-200 hover:bg-maroon-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-maroon-800">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-cream-200 hover:bg-maroon-800 transition-colors">
            <LogOut size={18} /> लॉग आउट
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-0 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-cream-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-maroon-50 text-maroon-700">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2 className="font-bold text-maroon-800 text-lg">{NAV.find(n => n.id === page)?.label}</h2>
          </div>
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-maroon-50 text-maroon-700">
              <Bell size={22} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            {notifOpen && stats && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 card p-4 z-40 animate-fade-in">
                  <h3 className="font-bold text-maroon-800 mb-3 text-sm">सूचनाएँ</h3>
                  <div className="space-y-2 text-sm">
                    <NotifItem icon={ShoppingBag} count={stats.pendingExtraOrders} label="नए अतिरिक्त ऑर्डर" onClick={() => { onNavigate('orders'); setNotifOpen(false); }} />
                    <NotifItem icon={MessageSquare} count={stats.todayComplaints} label="आज की शिकायतें" onClick={() => { onNavigate('complaints'); setNotifOpen(false); }} />
                    <NotifItem icon={Wallet} count={stats.pendingPayments} label="बकाया भुगतान" onClick={() => { onNavigate('payments'); setNotifOpen(false); }} />
                    <NotifItem icon={Calendar} count={stats.upcomingRenewals} label="आगामी रिन्यूअल" onClick={() => { onNavigate('customers'); setNotifOpen(false); }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NotifItem({ icon: Icon, count, label, onClick }: { icon: typeof Bell; count: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cream-50 transition-colors">
      <span className="flex items-center gap-2 text-maroon-700">
        <Icon size={16} /> {label}
      </span>
      {count > 0 && <span className="badge-red">{count}</span>}
    </button>
  );
}

export function useDashboardStats(): [DashboardStats | null, () => Promise<void>] {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const load = async () => {
    const today = todayISO();
    const monthStart = new Date();
    monthStart.setDate(1);
    const ms = monthStart.toISOString().split('T')[0];

    const [{ data: todayOrders }, { data: customers }, { data: todayPayments }, { data: monthPayments }, { data: expenses }, { data: complaints }, { data: extraOrders }, { data: renewals }] = await Promise.all([
      supabase.from('orders').select('status').eq('order_date', today),
      supabase.from('customers').select('id, status, renewal_date, final_payable_amount'),
      supabase.from('payments').select('amount').eq('payment_date', today),
      supabase.from('payments').select('amount').gte('payment_date', ms),
      supabase.from('expenses').select('amount').gte('expense_date', ms),
      supabase.from('complaints').select('created_at').gte('created_at', today),
      supabase.from('extra_orders').select('status').eq('status', 'Pending'),
      supabase.from('customers').select('renewal_date, final_payable_amount').eq('status', 'Active').not('renewal_date', 'is', null),
    ]);

    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter(c => c.status === 'Active').length || 0;
    const pausedSubs = customers?.filter(c => c.status === 'Paused').length || 0;
    const todayIncome = todayPayments?.reduce((s, p) => s + p.amount, 0) || 0;
    const monthlyIncome = monthPayments?.reduce((s, p) => s + p.amount, 0) || 0;
    const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) || 0;

    // Pending payments: customers with final_payable_amount > total paid this month
    const { data: allPayments } = await supabase.from('payments').select('customer_id, amount').gte('payment_date', ms);
    const paidByCustomer: Record<string, number> = {};
    allPayments?.forEach(p => { paidByCustomer[p.customer_id] = (paidByCustomer[p.customer_id] || 0) + p.amount; });
    const pendingPayments = customers?.filter(c => (c.final_payable_amount || 0) > (paidByCustomer[c.id] || 0)).length || 0;

    const upcomingRenewals = renewals?.filter(r => {
      if (!r.renewal_date) return false;
      const days = Math.round((new Date(r.renewal_date).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 7;
    }).length || 0;

    setStats({
      todayOrders: todayOrders?.length || 0,
      todayDeliveries: todayOrders?.filter(o => o.status === 'Delivered').length || 0,
      totalCustomers,
      activeCustomers,
      pausedSubs,
      todayIncome,
      monthlyIncome,
      totalExpenses,
      netProfit: monthlyIncome - totalExpenses,
      pendingPayments,
      todayComplaints: complaints?.length || 0,
      upcomingRenewals,
      pendingExtraOrders: extraOrders?.length || 0,
    });
  };

  useEffect(() => { load(); }, []);
  return [stats, load];
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
