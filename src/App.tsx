import { AuthProvider, useAuth } from '@/lib/auth';
import { useRoute, navigate } from '@/lib/router';
import { ToastContainer } from '@/components/ui/Toast';
import { HomePage } from '@/pages/HomePage';
import { CustomerPanel } from '@/pages/CustomerPanel';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { useEffect } from 'react';

function Router() {
  const path = useRoute();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (path === '/customer' && !user) navigate('/');
    if (path === '/admin/dashboard' && (!user || role !== 'admin')) navigate('/admin');
  }, [path, user, role, loading]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream-50"><div className="text-maroon-600 text-lg">लोड हो रहा है...</div></div>;
  }

  if (path === '/admin') return <AdminLogin />;
  if (path === '/admin/dashboard') return <AdminDashboard />;
  if (path === '/customer') return <CustomerPanel />;

  return <HomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <ToastContainer />
    </AuthProvider>
  );
}
