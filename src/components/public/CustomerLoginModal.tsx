import { useState } from 'react';
import { LogIn, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';

export function CustomerLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast('error', 'लॉगिन विफल - गलत ईमेल या पासवर्ड');
      return;
    }
    toast('success', 'लॉगिन सफल! आपके डैशबोर्ड पर जायें...');
    onClose();
    navigate('/customer');
  };

  return (
    <Modal open={open} onClose={onClose} title="ग्राहक लॉगिन" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">ईमेल</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="आपका ईमेल पता"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">पासवर्ड</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            placeholder="आपका पासवर्ड"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          लॉगिन करें
        </button>
        <p className="text-center text-sm text-maroon-500">
          अपने लॉगिन क्रेडेंशियल के लिए मेस प्रबंधक से संपर्क करें।
        </p>
      </form>
    </Modal>
  );
}
