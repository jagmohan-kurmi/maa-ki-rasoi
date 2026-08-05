import { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, Utensils, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import { toast } from '@/components/ui/Toast';

export function AdminLogin() {
  const { signIn, user, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role === 'admin') navigate('/admin/dashboard');
  }, [user, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast('error', 'गलत ईमेल या पासवर्ड');
      return;
    }
    toast('success', 'लॉगिन सफल');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-maroon-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-maroon-600 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cream-500 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <button onClick={() => navigate('/')} className="text-cream-300 hover:text-white flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft size={16} /> वेबसाइट पर वापस
        </button>

        <div className="card bg-white p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-maroon-700 flex items-center justify-center text-white mx-auto mb-4">
              <Utensils size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold text-maroon-800">प्रबंधक लॉगिन</h1>
            <p className="text-sm text-maroon-500 mt-1">माा की रसोई प्रबंधन प्रणाली</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">ईमेल</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="प्रबंधक ईमेल"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label">पासवर्ड</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="पासवर्ड"
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              लॉगिन करें
            </button>
          </form>
        </div>
        <p className="text-center text-cream-400 text-xs mt-6">केवल अधिकृत प्रबंधकों के लिए</p>
      </div>
    </div>
  );
}
