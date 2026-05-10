import React, { useState, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';
import { exportLogsToXLSX } from '../lib/exportXLSX';
import GlassCard from './ui/GlassCard';
import { RiskBadge } from './ui/RiskBadge';

interface LogRow { id: string; scanned_at: string; action: string; quantity: number; employee_name: string; employee_sigla: string | null; employee_number: string | null; employee_regional: string | null; item_id: string; item_name: string; item_barcode: string; item_category: string; item_risk_level: 'low'|'medium'|'high'|'critical'; item_expiry_date: string | null; item_quantity: number; synced: boolean; }
interface Filters { dateFrom: string; dateTo: string; employeeId: string; regional: string; number: string; category: string; action: string; risk_level: string; }

const INIT: Filters = { dateFrom: '', dateTo: '', employeeId: '', regional: '', number: '', category: '', action: '', risk_level: '' };
const PAGE_SIZE = 50;

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(INIT);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const supabase = createClient();
  const setF = <K extends keyof Filters>(k: K, v: string) => { setFilters((p) => ({ ...p, [k]: v })); setPage(1); };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('scan_logs').select(`id, item_id, scanned_at, action, quantity, profiles!employee_id(name, sigla, number, regional), items!item_id(name, barcode, category, risk_level, expiry_date, quantity)`).order('scanned_at', { ascending: false }).limit(2000);
    if (filters.dateFrom) q = q.gte('scanned_at', filters.dateFrom);
    if (filters.dateTo) q = q.lte('scanned_at', filters.dateTo + 'T23:59:59');
    if (filters.action) q = q.eq('action', filters.action);
    const { data } = await q;
    if (!data) { setLoading(false); return; }
    const rows: LogRow[] = (data as unknown[]).map((raw) => {
      const r = raw as any;
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const it = Array.isArray(r.items) ? r.items[0] : r.items;
      return {
        id: r.id, item_id: r.item_id, scanned_at: r.scanned_at, action: r.action, quantity: r.quantity, synced: true,
        employee_name: p?.name ?? '—', employee_sigla: p?.sigla ?? null, employee_number: p?.number ?? null, employee_regional: p?.regional ?? null,
        item_name: it?.name ?? '—', item_barcode: it?.barcode ?? '—', item_category: it?.category ?? '—', item_risk_level: it?.risk_level ?? 'low', item_expiry_date: it?.expiry_date ?? null, item_quantity: it?.quantity ?? 0,
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

  const exportXLSX = () => exportLogsToXLSX(clientFiltered);

  const regionais = useMemo(() => [...new Set(logs.map((l) => l.employee_regional).filter(Boolean))] as string[], [logs]);
  const numbers = useMemo(() => [...new Set(logs.map((l) => l.employee_number).filter(Boolean))] as string[], [logs]);
  const categories = useMemo(() => [...new Set(logs.map((l) => l.item_category).filter(Boolean))].sort(), [logs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Relatórios</h1>
        <button onClick={exportXLSX} className="btn-primary flex items-center gap-2">📥 XLSX</button>
      </div>

      <GlassCard className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Data início</label><input type="date" className="inp-glass w-full" value={filters.dateFrom} onChange={(e) => setF('dateFrom', e.target.value)} /></div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Data fim</label><input type="date" className="inp-glass w-full" value={filters.dateTo} onChange={(e) => setF('dateTo', e.target.value)} /></div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Ação</label>
          <select className="inp-glass w-full" value={filters.action} onChange={(e) => setF('action', e.target.value)}>
            <option value="">Todas</option><option value="entrada">Entrada</option><option value="saida">Saída</option>
          </select>
        </div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Risco</label>
          <select className="inp-glass w-full" value={filters.risk_level} onChange={(e) => setF('risk_level', e.target.value)}>
            <option value="">Todos</option>{['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Regional</label>
          <select className="inp-glass w-full" value={filters.regional} onChange={(e) => setF('regional', e.target.value)}>
            <option value="">Todas</option>{regionais.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Nº Drogaria</label>
          <select className="inp-glass w-full" value={filters.number} onChange={(e) => setF('number', e.target.value)}>
            <option value="">Todos</option>{numbers.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Categoria</label>
          <select className="inp-glass w-full" value={filters.category} onChange={(e) => setF('category', e.target.value)}>
            <option value="">Todas</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={fetchLogs} disabled={loading} className="btn-primary w-full h-[38px]">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </GlassCard>

      {clientFiltered.length > 0 && (
        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase">{clientFiltered.length} resultado(s) — Página {page} de {totalPages}</p>
      )}

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>{['Data/Hora', 'Funcionário', 'Sigla', 'Nº', 'Regional', 'Item', 'Barcode', 'Categoria', 'Qtd', 'Ação', 'Risco', 'Validade'].map(h => <th key={h} className="whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-10 text-[var(--text-muted)]">{loading ? 'Buscando...' : 'Aplique os filtros e clique em Buscar.'}</td></tr>
              ) : paged.map((l) => (
                <tr key={l.id}>
                  <td className="text-[var(--text-secondary)] whitespace-nowrap">{new Date(l.scanned_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="font-semibold whitespace-nowrap">{l.employee_name}</td>
                  <td className="text-[var(--text-secondary)] font-mono">{l.employee_sigla ?? '—'}</td>
                  <td className="text-[var(--text-secondary)]">{l.employee_number ?? '—'}</td>
                  <td className="text-[var(--text-secondary)]">{l.employee_regional ?? '—'}</td>
                  <td className="whitespace-nowrap">{l.item_name}</td>
                  <td className="text-[var(--text-secondary)] font-mono">{l.item_barcode}</td>
                  <td className="text-[var(--text-secondary)]">{l.item_category}</td>
                  <td className="font-bold">{l.quantity}</td>
                  <td><span className={`text-[10px] font-bold uppercase ${l.action === 'entrada' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>{l.action}</span></td>
                  <td><RiskBadge level={l.item_risk_level} /></td>
                  <td className="text-[var(--text-secondary)] whitespace-nowrap">{l.item_expiry_date ? new Date(l.item_expiry_date).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[var(--border-glass)] bg-[var(--bg-surface)] flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !text-xs !py-1 !px-3 disabled:opacity-30">Anterior</button>
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Página {page} de {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !text-xs !py-1 !px-3 disabled:opacity-30">Próxima</button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Reports;
