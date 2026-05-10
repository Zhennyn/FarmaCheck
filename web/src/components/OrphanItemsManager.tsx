import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';

interface OrphanItem { id: string; barcode: string; name: string; category: string; quantity: number; expiry_date: string | null; risk_level: string; created_at: string; }
interface ScanLogRow { id: string; employee_id: string | null; scanned_at: string; action: string; quantity: number; }

type Tab = 'orphans' | 'duplicates';

const OrphanItemsManager: React.FC = () => {
  const [tab, setTab] = useState<Tab>('orphans');
  const [orphans, setOrphans] = useState<OrphanItem[]>([]);
  const [duplicates, setDuplicates] = useState<OrphanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<OrphanItem | null>(null);
  const [detailLogs, setDetailLogs] = useState<ScanLogRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const [{ data: o, error: oe }, { data: d, error: de }] = await Promise.all([
      supabase.rpc('get_orphan_items'),
      supabase.rpc('get_duplicate_items'),
    ]);
    if (oe) setError(oe.message);
    else setOrphans((o ?? []) as OrphanItem[]);
    if (de) setError(de.message);
    else setDuplicates((d ?? []) as OrphanItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentList = tab === 'orphans' ? orphans : duplicates;

  const dupGroups = useMemo(() => {
    const m = new Map<string, OrphanItem[]>();
    duplicates.forEach((i) => { const g = m.get(i.barcode) ?? []; g.push(i); m.set(i.barcode, g); });
    return m;
  }, [duplicates]);

  const oldestId = (barcode: string) => {
    const g = dupGroups.get(barcode) ?? [];
    return g.reduce((acc, cur) => cur.created_at < acc.created_at ? cur : acc, g[0])?.id ?? null;
  };

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((p) => p.size === currentList.length ? new Set() : new Set(currentList.map((i) => i.id)));

  const deleteIds = useCallback(async (ids: string[]) => {
    if (!window.confirm(`Deletar ${ids.length} item(ns)?`)) return;
    setActionLoading(true);
    const { error: err } = await supabase.from('items').delete().in('id', ids);
    if (err) setError(err.message);
    setSelected(new Set());
    await fetchData();
    setActionLoading(false);
  }, [fetchData]);

  const keepNewest = useCallback(async () => {
    if (!window.confirm('Manter o mais recente de cada grupo e deletar os demais?')) return;
    setActionLoading(true);
    const toDelete: string[] = [];
    dupGroups.forEach((group) => {
      const sorted = [...group].sort((a, b) => b.created_at.localeCompare(a.created_at));
      toDelete.push(...sorted.slice(1).map((i) => i.id));
    });
    if (toDelete.length > 0) {
      const { error: err } = await supabase.from('items').delete().in('id', toDelete);
      if (err) setError(err.message);
    }
    setSelected(new Set());
    await fetchData();
    setActionLoading(false);
  }, [dupGroups, fetchData]);

  const openDetail = useCallback(async (item: OrphanItem) => {
    setDetailItem(item); setDetailLogs([]); setDetailLoading(true);
    const { data } = await supabase.from('scan_logs').select('id, employee_id, scanned_at, action, quantity').eq('item_id', item.id).order('scanned_at', { ascending: false });
    if (data) setDetailLogs(data as ScanLogRow[]);
    setDetailLoading(false);
  }, []);

  const tabCls = (t: Tab) => `px-5 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition ${tab === t ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] bg-[var(--bg-surface)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`;

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Gerenciador de Itens</h1>
        <button onClick={fetchData} disabled={loading} className="btn-ghost">
          {loading ? 'Carregando...' : '↺ Recarregar'}
        </button>
      </div>

      {error && <GlassCard accent="red" className="!bg-[rgba(248,113,113,0.1)] text-[var(--accent-red)] text-sm !p-3">{error}</GlassCard>}

      <div className="flex gap-0 border-b border-[var(--border-glass)]">
        <button className={tabCls('orphans')} onClick={() => { setTab('orphans'); setSelected(new Set()); }}>Órfãos ({orphans.length})</button>
        <button className={tabCls('duplicates')} onClick={() => { setTab('duplicates'); setSelected(new Set()); }}>Duplicados ({duplicates.length})</button>
      </div>

      <GlassCard className="flex flex-wrap gap-3">
        {selected.size > 0 && (
          <button onClick={() => deleteIds(Array.from(selected))} disabled={actionLoading} className="btn-danger">
            Deletar selecionados ({selected.size})
          </button>
        )}
        {tab === 'orphans' && orphans.length > 0 && (
          <button onClick={() => deleteIds(orphans.map((o) => o.id))} disabled={actionLoading} className="btn-danger">
            Deletar todos os órfãos ({orphans.length})
          </button>
        )}
        {tab === 'duplicates' && duplicates.length > 0 && (
          <button onClick={keepNewest} disabled={actionLoading} className="btn-primary !border-[var(--border-yellow)] !text-[var(--accent-yellow)] !bg-[rgba(251,191,36,0.15)] hover:!bg-[rgba(251,191,36,0.25)]">
            Manter mais recente e deletar restantes
          </button>
        )}
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.size === currentList.length && currentList.length > 0} onChange={toggleAll} /></th>
                {['ID', 'Nome', 'Código de Barras', 'Qtd', 'Motivo', 'Ações'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 && !loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">Nenhum item encontrado.</td></tr>
              ) : currentList.map((item) => {
                const isOldest = tab === 'duplicates' && oldestId(item.barcode) === item.id;
                return (
                  <tr key={item.id}>
                    <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
                    <td className="text-[var(--text-muted)] font-mono text-xs">{item.id.slice(0, 8)}</td>
                    <td className="font-semibold">{item.name}</td>
                    <td className="font-mono text-[var(--text-secondary)]">{item.barcode}</td>
                    <td className="font-bold">{item.quantity}</td>
                    <td>
                      {tab === 'orphans'
                        ? <span className="text-[10px] bg-[rgba(248,113,113,0.15)] text-[var(--accent-red)] font-bold px-2 py-1 rounded-full border border-[var(--border-red)]">Usuário inexistente</span>
                        : isOldest
                          ? <span className="text-[10px] bg-[rgba(52,211,153,0.15)] text-[var(--accent-green)] font-bold px-2 py-1 rounded-full border border-[var(--border-green)]">Duplicado (manter)</span>
                          : <span className="text-[10px] bg-[rgba(251,191,36,0.15)] text-[var(--accent-yellow)] font-bold px-2 py-1 rounded-full border border-[var(--border-yellow)]">Duplicado</span>}
                    </td>
                    <td className="flex gap-2">
                      <button onClick={() => openDetail(item)} className="btn-primary py-1 px-2 text-[10px]">Detalhes</button>
                      <button onClick={() => deleteIds([item.id])} disabled={actionLoading} className="btn-danger py-1 px-2 text-[10px]">Deletar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null); }}>
          <GlassCard accent="blue" className="w-full max-w-2xl !p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h2 className="text-lg font-black text-white">{detailItem.name}</h2>
              <button onClick={() => setDetailItem(null)} className="text-[var(--text-secondary)] hover:text-white text-xl">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {([['Barcode', detailItem.barcode], ['Categoria', detailItem.category], ['Qtd', String(detailItem.quantity)], ['Risco', detailItem.risk_level], ['Criado em', new Date(detailItem.created_at).toLocaleString('pt-BR')]] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-[var(--text-muted)] uppercase mb-1 font-bold">{k}</dt><dd className="text-[var(--text-primary)] font-semibold">{v}</dd></div>
              ))}
            </dl>
            <h3 className="text-sm font-bold text-[var(--text-secondary)] mt-4">Scan Logs</h3>
            {detailLoading ? <p className="text-[var(--text-muted)] text-sm">Carregando...</p> : (
              <table className="glass-table mt-2">
                <thead><tr>{['Data/Hora', 'Employee ID', 'Ação', 'Qtd'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {detailLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-[var(--text-secondary)]">{new Date(l.scanned_at).toLocaleString('pt-BR')}</td>
                      <td className="text-[var(--text-muted)] font-mono">{l.employee_id ? l.employee_id.slice(0, 8) + '…' : '—'}</td>
                      <td><span className={`text-[10px] font-bold uppercase ${l.action === 'entrada' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>{l.action}</span></td>
                      <td className="font-bold">{l.quantity}</td>
                    </tr>
                  ))}
                  {detailLogs.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-[var(--text-muted)]">Sem registros.</td></tr>}
                </tbody>
              </table>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default OrphanItemsManager;
