import { useEffect, useState } from 'react';
import { Save, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, todayISO } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/Feedback';
import type { Employee, EmployeeAttendance, AttendanceStatus } from '@/types';

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Half Day', 'Late'];
const STATUS_LABELS: Record<AttendanceStatus, string> = { Present: 'उपस्थित', Absent: 'अनुपस्थित', Leave: 'छुट्टी', 'Half Day': 'अर्ध दिवस', Late: 'देर से' };
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: 'bg-green-100 text-green-700', Absent: 'bg-red-100 text-red-700',
  Leave: 'bg-amber-100 text-amber-700', 'Half Day': 'bg-blue-100 text-blue-700', Late: 'bg-purple-100 text-purple-700',
};

export function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, EmployeeAttendance>>({});
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: emps }, { data: atts }] = await Promise.all([
      supabase.from('employees').select('*').eq('status', 'Active').order('name'),
      supabase.from('employee_attendance').select('*').eq('attendance_date', date),
    ]);
    setEmployees(emps as Employee[] || []);
    const map: Record<string, EmployeeAttendance> = {};
    (atts || []).forEach(a => { map[a.employee_id] = a as EmployeeAttendance; });
    setAttendance(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [date]);

  const setAtt = (empId: string, field: keyof EmployeeAttendance, value: string) => {
    setAttendance(prev => {
      const existing = prev[empId] || { employee_id: empId, employee_name: employees.find(e => e.id === empId)?.name || '', attendance_date: date, status: 'Present', check_in: '', check_out: '', notes: '' };
      return { ...prev, [empId]: { ...existing, [field]: value } };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const emp of employees) {
        const att = attendance[emp.id];
        if (!att) continue;
        if (att.id) {
          await supabase.from('employee_attendance').update({ status: att.status, check_in: att.check_in, check_out: att.check_out, notes: att.notes }).eq('id', att.id);
        } else {
          await supabase.from('employee_attendance').insert({
            employee_id: emp.id, employee_name: emp.name, attendance_date: date,
            status: att.status, check_in: att.check_in, check_out: att.check_out, notes: att.notes,
          });
        }
      }
      toast('success', 'उपस्थिति सहेजी गई');
    } catch {
      toast('error', 'सहेजना विफल');
    }
    setSaving(false);
  };

  // Monthly summary
  const [monthView, setMonthView] = useState(false);
  const [monthlyData, setMonthlyData] = useState<Record<string, Record<string, number>>>({});

  const loadMonthly = async () => {
    const d = new Date(date);
    const ms = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data } = await supabase.from('employee_attendance').select('*').gte('attendance_date', ms).lte('attendance_date', me);
    const summary: Record<string, Record<string, number>> = {};
    (data || []).forEach(a => {
      const att = a as EmployeeAttendance;
      if (!summary[att.employee_name]) summary[att.employee_name] = {};
      summary[att.employee_name][att.status] = (summary[att.employee_name][att.status] || 0) + 1;
    });
    setMonthlyData(summary);
  };

  useEffect(() => { if (monthView) loadMonthly(); }, [monthView, date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setMonthView(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${!monthView ? 'bg-maroon-700 text-white' : 'bg-white text-maroon-700 border border-cream-200'}`}>दैनिक</button>
          <button onClick={() => setMonthView(true)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${monthView ? 'bg-maroon-700 text-white' : 'bg-white text-maroon-700 border border-cream-200'}`}>मासिक</button>
        </div>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-44" />
          {!monthView && <button onClick={save} disabled={saving} className="btn-primary"><Save size={18} /> {saving ? 'सहेज...' : 'सहेजें'}</button>}
        </div>
      </div>

      {!monthView ? (
        loading ? (
          <div className="py-12 text-center text-maroon-500">लोड हो रहा है...</div>
        ) : employees.length === 0 ? (
          <EmptyState icon={<Calendar size={48} />} title="कोई सक्रिय कर्मचारी नहीं" />
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead><tr><th>कर्मचारी</th><th>स्थिति</th><th>चेक-इन</th><th>चेक-आउट</th><th>टिप्पणी</th></tr></thead>
              <tbody>
                {employees.map(emp => {
                  const att = attendance[emp.id];
                  return (
                    <tr key={emp.id}>
                      <td className="font-semibold">{emp.name}</td>
                      <td>
                        <select value={att?.status || 'Present'} onChange={e => setAtt(emp.id, 'status', e.target.value)} className={`input text-sm py-1 w-32 ${STATUS_COLORS[(att?.status || 'Present') as AttendanceStatus]}`}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td><input type="time" value={att?.check_in || ''} onChange={e => setAtt(emp.id, 'check_in', e.target.value)} className="input text-sm py-1 w-28" /></td>
                      <td><input type="time" value={att?.check_out || ''} onChange={e => setAtt(emp.id, 'check_out', e.target.value)} className="input text-sm py-1 w-28" /></td>
                      <td><input value={att?.notes || ''} onChange={e => setAtt(emp.id, 'notes', e.target.value)} className="input text-sm py-1" placeholder="..." /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr><th>कर्मचारी</th>{STATUS_OPTIONS.map(s => <th key={s}>{STATUS_LABELS[s]}</th>)}<th>कुल दिन</th><th>वेतन तैयार</th></tr></thead>
            <tbody>
              {employees.map(emp => {
                const data = monthlyData[emp.name] || {};
                const total = Object.values(data).reduce((a, b) => a + b, 0);
                const payable = (data['Present'] || 0) + (data['Half Day'] || 0) * 0.5 + (data['Late'] || 0);
                return (
                  <tr key={emp.id}>
                    <td className="font-semibold">{emp.name}</td>
                    {STATUS_OPTIONS.map(s => <td key={s}>{data[s] || 0}</td>)}
                    <td>{total}</td>
                    <td><span className="badge-green">{payable} दिन</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
