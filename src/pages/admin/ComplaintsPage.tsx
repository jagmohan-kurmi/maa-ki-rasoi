import { useEffect, useState } from 'react';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Feedback';
import type { Complaint, ComplaintStatus } from '@/types';

const STATUS_OPTIONS: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const STATUS_LABELS: Record<ComplaintStatus, string> = { Open: 'खुली', 'In Progress': 'प्रगति में', Resolved: 'हल हुआ', Closed: 'बंद' };

export function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<Complaint | null>(null);

  const load = async () => {
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (data) setComplaints(data as Complaint[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.subject.toLowerCase().includes(search.toLowerCase()) || c.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (c: Complaint, status: ComplaintStatus, adminResponse?: string) => {
    const { error } = await supabase.from('complaints').update({ status, admin_response: adminResponse ?? c.admin_response }).eq('id', c.id);
    if (error) { toast('error', 'विफल'); return; }
    toast('success', 'शिकायत अपडेट हुई');
    setEditing(null);
    load();
  };

  const statusBadge = (s: ComplaintStatus) => ({ Open: 'badge-yellow', 'In Progress': 'badge-blue', Resolved: 'badge-green', Closed: 'badge-gray' }[s]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="खोजें..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-44">
          <option value="all">सभी स्थिति</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare size={48} />} title="कोई शिकायत नहीं" />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-maroon-800">{c.subject}</h3>
                  <p className="text-xs text-maroon-500">{c.customer_name} - {formatDate(c.created_at)}</p>
                </div>
                <span className={statusBadge(c.status)}>{STATUS_LABELS[c.status]}</span>
              </div>
              <p className="text-sm text-maroon-600 mb-3">{c.description}</p>
              {c.admin_response && <div className="pt-2 border-t border-cream-100"><p className="text-xs font-semibold text-maroon-500">उत्तर:</p><p className="text-sm text-maroon-700">{c.admin_response}</p></div>}
              <div className="flex gap-2 mt-3">
                <select value={c.status} onChange={e => updateStatus(c, e.target.value as ComplaintStatus)} className="input text-sm py-1.5 w-40">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button onClick={() => setEditing(c)} className="btn-outline text-sm">उत्तर दें</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResponseModal complaint={editing} onClose={() => setEditing(null)} onSave={(response, status) => updateStatus(editing!, status, response)} />
    </div>
  );
}

function ResponseModal({ complaint, onClose, onSave }: { complaint: Complaint | null; onClose: () => void; onSave: (response: string, status: ComplaintStatus) => void }) {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<ComplaintStatus>('Resolved');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (complaint) { setResponse(complaint.admin_response || ''); setStatus(complaint.status); }
  }, [complaint]);

  if (!complaint) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSave(response, status);
    setLoading(false);
  };

  return (
    <Modal open={!!complaint} onClose={onClose} title="शिकायत का उत्तर" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-cream-50 rounded-xl p-3">
          <p className="font-semibold text-maroon-800">{complaint.subject}</p>
          <p className="text-sm text-maroon-600">{complaint.description}</p>
        </div>
        <div><label className="label">स्थिति</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value as ComplaintStatus)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div><label className="label">उत्तर</label><textarea className="input min-h-[120px]" value={response} onChange={e => setResponse(e.target.value)} placeholder="ग्राहक को उत्तर लिखें..." /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : null} सहेजें</button>
      </form>
    </Modal>
  );
}
