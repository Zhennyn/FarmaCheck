import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../lib/supabase';

interface LogRow {
  id: string; scanned_at: string; action: string; quantity: number;
  employee_name: string; employee_sigla: string | null; employee_number: string | null; employee_regional: string | null;
  item_name: string; item_barcode: string; item_category: string; item_risk_level: string; item_expiry_date: string | null;
}

interface Filters {
  dateFrom: string; dateTo: string; employeeId: string; regional: string;
  number: string; category: string; action: string; risk_level: string;
}

const INIT: Filters = { dateFrom: '', dateTo: '', employeeId: '', regional: '', number: '', category: '', action: '', risk_level: '' };
const PAGE_SIZE = 50;
const INP = 'bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition w-full';

const COLS = [
  { key: 'date', label: 'Data' }, { key: 'time', label: 'Hora' },
  { key: 'employee_name', label: 'Funcionário' }, { key: 'employee_sigla', label: 'Sigla' },
  { key: 'employee_number', label: 'Número' }, { key: 'employee_regional', label: 'Regional' },
  { key: 'item_name', label: 'Item' }, { key: 'item_barcode', label: 'Código de Barras' },
  { key: 'item_category', label: 'Categoria' }, { key: 'quantity', label: 'Quantidade' },
  { key: 'action', label: 'Ação' }, { key: 'item_risk_level', label: 'Risco' },
  { key: 'item_expiry_date', label: 'Validade' },
];

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(INIT);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const supabase = createClient();
  const setF = <K extends keyof Filters>(k: K, v: string) => { setFilters((p) => ({ ...p, [k]: v })); setPage(1); };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('scan_logs')
      .select(`id, scanned_at, action, quantity,
        profiles!employee_id(name, sigla, number, regional),
        items!item_id(name, barcode, category, risk_level, expiry_date)`)
      .order('scanned_at', { ascending: false })
      .limit(2000);

    if (filters.dateFrom) q = q.gte('scanned_at', filters.dateFrom);
    if (filters.dateTo) q = q.lte('scanned_at', filters.dateTo + 'T23:59:59');
    if (filters.action) q = q.eq('action', filters.action);

    const { data } = await q;
    if (!data) { setLoading(false); return; }

    const rows: LogRow[] = (data as unknown[]).map((raw) => {
      const r = raw as {
        id: string; scanned_at: string; action: string; quantity: number;
        profiles: { name: string; sigla: string | null; number: string | null; regional: string | null } | null;
        items: { name: string; barcode: string; category: string; risk_level: string; expiry_date: string | null } | null;
      };
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const it = Array.isArray(r.items) ? r.items[0] : r.items;
      return {
        id: r.id, scanned_at: r.scanned_at, action: r.action, quantity: r.quantity,
        employee_name: p?.name ?? '—', employee_sigla: p?.sigla ?? null, employee_number: p?.number ?? null, employee_regional: p?.regional ?? null,
        item_name: it?.name ?? '—', item_barcode: it?.barcode ?? '—', item_category: it?.category ?? '—', item_risk_level: it?.risk_level ?? '—', item_expiry_date: it?.expiry_date ?? null,
      };
    });

    setLogs(rows);
    setPage(1);
    setLoading(false);
  }, [filters]);

  const clientFiltered = useMemo(() => logs.filter((l) => {
    if (filters.regional && l.employee_regional !== filters.regional) return false;
    if (filters.number && l.employee_number !== filters.number) return false;
    if (filters.category && l.item_category !== filters.category) return false;
    if (filters.risk_level && l.item_risk_level !== filters.risk_level) return false;
    return true;
  }), [logs, filters]);

  const totalPages = Math.ceil(clientFiltered.length / PAGE_SIZE);
  const paged = useMemo(() => clientFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [clientFiltered, page]);

  const toXLSXRow = (l: LogRow) => {
    const dt = new Date(l.scanned_at);
    return COLS.map(({ key }) => {
      if (key === 'date') return dt.toLocaleDateString('pt-BR');
      if (key === 'time') return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (key === 'item_expiry_date') return l.item_expiry_date ? new Date(l.item_expiry_date).toLocaleDateString('pt-BR') : '';
      return (l as unknown as Record<string, string | number | null>)[key] ?? '';
    });
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([COLS.map((c) => c.label), ...clientFiltered.map(toXLSXRow)]);
    ws['!cols'] = COLS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCSV = () => {
    const rows = [COLS.map((c) => c.label), ...clientFiltered.map(toXLSXRow)];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const regionais = useMemo(() => [...new Set(logs.map((l) => l.employee_regional).filter(Boolean))] as string[], [logs]);
  const numbers = useMemo(() => [...new Set(logs.map((l) => l.employee_number).filter(Boolean))] as string[], [logs]);
  const categories = useMemo(() => [...new Set(logs.map((l) => l.item_category).filter(Boolean))].sort(), [logs]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Relatórios</h1>
        <div className="flex gap-2">
          <button onClick={exportXLSX} className="bg-green-700 hover:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">📥 XLSX</button>
          <button onClick={exportCSV} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">📄 CSV</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Data início</label><input type="date" className={INP} value={filters.dateFrom} onChange={(e) => setF('dateFrom', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Data fim</label><input type="date" className={INP} value={filters.dateTo} onChange={(e) => setF('dateTo', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Ação</label>
          <select className={INP} value={filters.action} onChange={(e) => setF('action', e.target.value)}>
            <option value="">Todas</option><option value="entrada">Entrada</option><option value="saida">Saída</option>
          </select>
        </div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Risco</label>
          <select className={INP} value={filters.risk_level} onChange={(e) => setF('risk_level', e.target.value)}>
            <option value="">Todos</option>{['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Regional</label>
          <select className={INP} value={filters.regional} onChange={(e) => setF('regional', e.target.value)}>
            <option value="">Todas</option>{regionais.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Nº Drogaria</label>
          <select className={INP} value={filters.number} onChange={(e) => setF('number', e.target.value)}>
            <option value="">Todos</option>{numbers.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-gray-500 uppercase mb-1 block">Categoria</label>
          <select className={INP} value={filters.category} onChange={(e) => setF('category', e.target.value)}>
            <option value="">Todas</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={fetchLogs} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {clientFiltered.length > 0 && (
        <p className="text-gray-500 text-xs">{clientFiltered.length} resultado(s) — Página {page} de {totalPages}</p>
      )}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Data/Hora', 'Funcionário', 'Sigla', 'Nº', 'Regional', 'Item', 'Barcode', 'Categoria', 'Qtd', 'Ação', 'Risco', 'Validade'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-600">{loading ? 'Buscando...' : 'Aplique os filtros e clique em Buscar.'}</td></tr>
              ) : paged.map((l) => (
                <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{new Date(l.scanned_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-3 py-2.5 text-gray-200 font-semibold whitespace-nowrap">{l.employee_name}</td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono">{l.employee_sigla ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-400">{l.employee_number ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-400">{l.employee_regional ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-200 whitespace-nowrap">{l.item_name}</td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono">{l.item_barcode}</td>
                  <td className="px-3 py-2.5 text-gray-400">{l.item_category}</td>
                  <td className="px-3 py-2.5 text-gray-300 font-bold">{l.quantity}</td>
                  <td className="px-3 py-2.5"><span className={l.action === 'entrada' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{l.action.toUpperCase()}</span></td>
                  <td className="px-3 py-2.5 text-gray-400 uppercase">{l.item_risk_level}</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{l.item_expiry_date ? new Date(l.item_expiry_date).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-sm bg-gray-800 disabled:opacity-30 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg transition">Anterior</button>
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-sm bg-gray-800 disabled:opacity-30 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg transition">Próxima</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
