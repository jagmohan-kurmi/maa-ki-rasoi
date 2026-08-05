export function formatCurrency(amount: number, symbol = '₹'): string {
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0);
  return `${symbol}${formatted}`;
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth(): string {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function generateReceiptNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MKR${ymd}${random}`;
}

export function generateCustomerId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MKR${year}${random}`;
}

export function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateEmployeeId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP${random}`;
}

export function daysUntil(date: string | null): number {
  if (!date) return -1;
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title: string, content: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #7B1E1E; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #7B1E1E; color: white; }
      tr:nth-child(even) { background: #f9f9f9; }
    </style></head><body>${content}</body></html>
  `);
  win.document.close();
  win.print();
}
