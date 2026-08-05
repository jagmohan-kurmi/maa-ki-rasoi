import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Customer, Settings } from '@/types';

type Role = 'admin' | 'customer' | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: Role;
  customer: Customer | null;
  settings: Settings | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const determineRole = async (u: User): Promise<Role> => {
    let adminEmail = 'maakirasoiankit65679@gmail.com';
    const { data: s } = await supabase.from('settings').select('admin_email').limit(1).maybeSingle();
    if (s?.admin_email) adminEmail = s.admin_email;
    if (u.email === adminEmail) return 'admin';
    return 'customer';
  };

  const loadCustomer = async (u: User) => {
    const { data } = await supabase.from('customers').select('*').eq('user_id', u.id).maybeSingle();
    setCustomer(data as Customer | null);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    setSettings(data as Settings | null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadSettings();
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        const r = await determineRole(session.user);
        if (!mounted) return;
        setRole(r);
        if (r === 'customer') await loadCustomer(session.user);
      }
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setSession(null);
          setRole(null);
          setCustomer(null);
          return;
        }
        setUser(session.user);
        setSession(session);
        const r = await determineRole(session.user);
        setRole(r);
        if (r === 'customer') await loadCustomer(session.user);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setCustomer(null);
  };

  const refreshCustomer = async () => {
    if (user) await loadCustomer(user);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, customer, settings, loading, signIn, signOut, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
