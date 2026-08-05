import { useEffect, useState } from 'react';
import { AdminLayout, useDashboardStats, type AdminPage } from '@/components/admin/AdminLayout';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { CustomersPage } from '@/pages/admin/CustomersPage';
import { PlansPage } from '@/pages/admin/PlansPage';
import { MenuPage } from '@/pages/admin/MenuPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { PaymentsPage } from '@/pages/admin/PaymentsPage';
import { ExpensesPage } from '@/pages/admin/ExpensesPage';
import { ComplaintsPage } from '@/pages/admin/ComplaintsPage';
import { EmployeesPage } from '@/pages/admin/EmployeesPage';
import { AttendancePage } from '@/pages/admin/AttendancePage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';

export function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [stats, reloadStats] = useDashboardStats();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) navigate('/admin');
  }, [user, role, loading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-maroon-600">लोड हो रहा है...</div></div>;
  if (!user || role !== 'admin') return null;

  return (
    <AdminLayout page={page} onNavigate={(p) => { setPage(p); reloadStats(); }} stats={stats}>
      {page === 'dashboard' && <DashboardPage stats={stats} onNavigate={(p) => setPage(p as AdminPage)} />}
      {page === 'customers' && <CustomersPage />}
      {page === 'plans' && <PlansPage />}
      {page === 'menu' && <MenuPage />}
      {page === 'orders' && <OrdersPage />}
      {page === 'payments' && <PaymentsPage />}
      {page === 'expenses' && <ExpensesPage />}
      {page === 'complaints' && <ComplaintsPage />}
      {page === 'employees' && <EmployeesPage />}
      {page === 'attendance' && <AttendancePage />}
      {page === 'reports' && <ReportsPage />}
      {page === 'settings' && <SettingsPage />}
    </AdminLayout>
  );
}
