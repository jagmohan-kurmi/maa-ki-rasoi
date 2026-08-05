import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import type { WeeklyMenu } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS: Record<string, string> = {
  Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार',
  Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार', Sunday: 'रविवार',
};

export function MenuPage() {
  const [menu, setMenu] = useState<Record<string, WeeklyMenu>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('weekly_menu').select('*').order('sort_order');
      const map: Record<string, WeeklyMenu> = {};
      (data || []).forEach(m => { map[m.day_of_week] = m; });
      setMenu(map);
    })();
  }, []);

  const update = (day: string, field: keyof WeeklyMenu, value: string) => {
    setMenu(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const save = async () => {
    setLoading(true);
    try {
      for (const day of DAYS) {
        const existing = menu[day];
        if (existing?.id) {
          await supabase.from('weekly_menu').update({
            breakfast: existing.breakfast, lunch: existing.lunch, dinner: existing.dinner,
          }).eq('id', existing.id);
        } else {
          await supabase.from('weekly_menu').insert({
            day_of_week: day, breakfast: existing?.breakfast || '', lunch: existing?.lunch || '', dinner: existing?.dinner || '',
            sort_order: DAYS.indexOf(day) + 1,
          });
        }
      }
      toast('success', 'मेनू सहेजा गया');
    } catch {
      toast('error', 'सहेजना विफल');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-maroon-600 text-sm">साप्ताहिक मेनू संपादित करें</p>
        <button onClick={save} disabled={loading} className="btn-primary"><Save size={18} /> {loading ? 'सहेज रहे...' : 'सहेजें'}</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map(day => (
          <div key={day} className="card p-5">
            <h3 className="font-bold text-maroon-800 mb-3">{DAY_LABELS[day]}</h3>
            <div className="space-y-3">
              <div><label className="label">ब्रेकफ़ास्ट</label><input className="input" value={menu[day]?.breakfast || ''} onChange={e => update(day, 'breakfast', e.target.value)} placeholder="पोहा, चाय" /></div>
              <div><label className="label">लंच</label><input className="input" value={menu[day]?.lunch || ''} onChange={e => update(day, 'lunch', e.target.value)} placeholder="दाल, चावल, सब्ज़ी" /></div>
              <div><label className="label">डिनर</label><input className="input" value={menu[day]?.dinner || ''} onChange={e => update(day, 'dinner', e.target.value)} placeholder="पनीर, रोटी, चावल" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
