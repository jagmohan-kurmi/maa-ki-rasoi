import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import type { Settings } from '@/types';

export function SettingsPage() {
  const [form, setForm] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (data) setForm(data as Settings);
    })();
  }, []);

  const update = (k: keyof Settings, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('settings').update(form).eq('id', form.id);
    setLoading(false);
    if (error) { toast('error', 'सहेजना विफल'); return; }
    toast('success', 'सेटिंग्स सहेजी गईं');
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="card p-5">
        <h3 className="font-bold text-maroon-800 mb-4">व्यवसाय जानकारी</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">व्यवसाय नाम</label><input className="input" value={form.business_name || ''} onChange={e => update('business_name', e.target.value)} /></div>
          <div><label className="label">टैगलाइन</label><input className="input" value={form.tagline || ''} onChange={e => update('tagline', e.target.value)} /></div>
          <div><label className="label">फ़ोन</label><input className="input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
          <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)} /></div>
          <div><label className="label">ईमेल</label><input className="input" value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
          <div><label className="label">मुद्रा</label><input className="input" value={form.currency || '₹'} onChange={e => update('currency', e.target.value)} /></div>
        </div>
        <div className="mt-4"><label className="label">पता</label><textarea className="input" value={form.address || ''} onChange={e => update('address', e.target.value)} /></div>
        <div className="mt-4"><label className="label">Google Map URL</label><input className="input" value={form.google_map_url || ''} onChange={e => update('google_map_url', e.target.value)} /></div>
        <div className="mt-4"><label className="label">लोगो URL</label><input className="input" value={form.logo_url || ''} onChange={e => update('logo_url', e.target.value)} /></div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-maroon-800 mb-4">समय और शुल्क</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">व्यवसाय समय</label><input className="input" value={form.business_timing || ''} onChange={e => update('business_timing', e.target.value)} /></div>
          <div><label className="label">मासिक डिलीवरी शुल्क</label><input type="number" className="input" value={form.monthly_delivery_charge || 0} onChange={e => update('monthly_delivery_charge', Number(e.target.value))} /></div>
        </div>
        <div className="mt-4"><label className="label">रसीद फ़ुटर</label><input className="input" value={form.receipt_footer || ''} onChange={e => update('receipt_footer', e.target.value)} /></div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-maroon-800 mb-4">प्रबंधक</h3>
        <div><label className="label">प्रबंधक ईमेल</label><input className="input" value={form.admin_email || ''} onChange={e => update('admin_email', e.target.value)} /></div>
        <p className="text-xs text-maroon-500 mt-1">इस ईमेल से लॉगिन करने पर प्रबंधक डैशबोर्ड खुलेगा।</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary"><Save size={18} /> {loading ? 'सहेज...' : 'सेटिंग्स सहेजें'}</button>
    </form>
  );
}
