import { useEffect, useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, downloadCSV, exportPDF, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

type ReportType = 'customer' | 'revenue' | 'expense' | 'profit' | 'pending' | 'attendance' | 'renewal';

const REPORTS: { id: ReportType; label: string }[] = [
  { id: 'customer', label: 'ग्राहक रिपोर्ट' },
  { id: 'revenue', label: 'आय रिपोर्ट' },
  { id: 'expense', label: 'खर्च रिपोर्ट' },
  { id: 'profit', label: 'लाभ रिपोर्ट' },
  { id: 'pending', label: 'बकाया भुगतान रिपोर्ट' },
  { id: 'attendance', label: 'उपस्थिति रिपोर्ट' },
  { id: 'renewal', label: 'रिन्यूअल रिपोर्ट' },
];

export function ReportsPage() {
  const [type, setType] = useState<ReportType>('customer');
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (type === 'customer') {
        const { data: rows } = await supabase.from('customers').select('customer_id, full_name, mobile, meal_type, status, monthly_subscription_charge, monthly_delivery_charge, discount, final_payable_amount, joining_date, renewal_date').order('full_name');
        setData((rows || []) as Record<string, unknown>[]);
      } else if (type === 'revenue') {
        const { data: rows } = await supabase.from('payments').select('receipt_number, customer_name, amount, payment_mode, payment_date, month').gte('payment_date', from).lte('payment_date', to).order('payment_date', { ascending: false });
        setData((rows || []) as Record<string, unknown>[]);
      } else if (type === 'expense') {
        const { data: rows } = await supabase.from('expenses').select('category, description, amount, expense_date').gte('expense_date', from).lte('expense_date', to).order('expense_date', { ascending: false });
        setData((rows || []) as Record<string, unknown>[]);
      } else if (type === 'profit') {
        const [{ data: pay }, { data: exp }] = await Promise.all([
          supabase.from('payments').select('amount, payment_date').gte('payment_date', from).lte('payment_date', to),
          supabase.from('expenses').select('amount, expense_date').gte('expense_date', from).lte('expense_date', to),
        ]);
        const income = pay?.reduce((s, p) => s + p.amount, 0) || 0;
        const expenses = exp?.reduce((s, e) => s + e.amount, 0) || 0;
        setData([{ अवधि_से: from, अवधि_तक: to, कुल_आय: income, कुल_खर्च: expenses, शुद्ध_लाभ: income - expenses }]);
      } else if (type === 'pending') {
        const { data: customers } = await supabase.from('customers').select('id, customer_id, full_name, mobile, final_payable_amount, status').eq('status', 'Active');
        const { data: payments } = await supabase.from('payments').select('customer_id, amount').gte('payment_date', from).lte('payment_date', to);
        const paidByCustomer: Record<string, number> = {};
        (payments || []).forEach(p => { paidByCustomer[p.customer_id] = (paidByCustomer[p.customer_id] || 0) + p.amount; });
        const pending = (customers || []).filter(c => (c.final_payable_amount || 0) > (paidByCustomer[c.id] || 0)).map(c => ({
          customer_id: c.customer_id, full_name: c.full_name, mobile: c.mobile,
          final_payable_amount: c.final_payable_amount, paid: paidByCustomer[c.id] || 0,
          pending: (c.final_payable_amount || 0) - (paidByCustomer[c.id] || 0),
        }));
        setData(pending);
      } else if (type === 'attendance') {
        const { data: atts } = await supabase.from('employee_attendance').select('employee_name, attendance_date, status, check_in, check_out').gte('attendance_date', from).lte('attendance_date', to).order('attendance_date', { ascending: false });
        setData((atts || []) as Record<string, unknown>[]);
      } else if (type === 'renewal') {
        const { data: customers } = await supabase.from('customers').select('customer_id, full_name, mobile, renewal_date, status').not('renewal_date', 'is', null).order('renewal_date');
        setData((customers || []) as Record<string, unknown>[]);
      }
    } catch {
      toast('error', 'रिपोर्ट लोड विफल');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [type, from, to]);

  const exportCsv = () => {
    if (data.length === 0) return;
    downloadCSV(`${type}_report_${todayISO()}.csv`, data);
    toast('success', 'CSV डाउनलोड हुआ');
  };

  const exportPdf = () => {
    if (data.length === 0) return;
    const report = REPORTS.find(r => r.id === type)!;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? '-'}</td>`).join('')}</tr>`).join('');
    const content = `<h1>${report.label}</h1><p>अवधि: ${from} से ${to}</p><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
    exportPDF(report.label, content);
  };

  const showDateRange = type !== 'customer' && type !== 'renewal';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={type} onChange={e => setType(e.target.value as ReportType)} className="input sm:w-56">
          {REPORTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {showDateRange && (
          <>
            <div><label className="text-xs text-maroon-500">से</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input" /></div>
            <div><label className="text-xs text-maroon-500">तक</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input" /></div>
          </>
        )}
        <div className="flex gap-2 ml-auto">
          <button onClick={exportCsv} disabled={data.length === 0} className="btn-outline"><Download size={18} /> CSV</button>
          <button onClick={exportPdf} disabled={data.length === 0} className="btn-outline"><Download size={18} /> PDF</button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 size={32} className="animate-spin text-maroon-600 mx-auto" /></div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-maroon-500">
          <FileText size={48} className="mx-auto mb-3 text-maroon-300" />
          <p>कोई डेटा नहीं</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{Object.keys(data[0]).map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {Object.keys(data[0]).map(h => {
                    const val = row[h];
                    const isMoney = typeof val === 'number' && (h.includes('amount') || h.includes('आय') || h.includes('खर्च') || h.includes('लाभ') || h.includes('payable') || h.includes('paid') || h.includes('pending'));
                    return <td key={h} className={isMoney ? 'font-semibold' : ''}>{isMoney ? formatCurrency(val as number) : (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/) ? formatDate(val) : (val !== null && val !== undefined ? String(val) : '-'))}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
