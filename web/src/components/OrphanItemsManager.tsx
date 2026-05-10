import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';

interface OrphanItem {
  id: string; barcode: string; name: string; category: string;
  quantity: number; expiry_date: string | null; risk_level: string; created_at: string;
}

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

  const tabCls = (t: Tab) => `px-5 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition ${tab === t ? 'border-indigo-500 text-indigo-400 bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300'}`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Gerenciador de Itens</h1>
        <button onClick={fetchData} disabled={loading} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition">
          {loading ? 'Carregando...' : '↺ Recarregar'}
        </button>
      </div>

      {error && <div className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div className="flex gap-0 border-b border-gray-800">
        <button className={tabCls('orphans')} onClick={() => { setTab('orphans'); setSelected(new Set()); }}>Órfãos ({orphans.length})</button>
        <button className={tabCls('duplicates')} onClick={() => { setTab('duplicates'); setSelected(new Set()); }}>Duplicados ({duplicates.length})</button>
      </div>

      <div className="flex flex-wrap gap-3">
        {selected.size > 0 && (
          <button onClick={() => deleteIds(Array.from(selected))} disabled={actionLoading} className="bg-red-900/50 text-red-400 text-sm font-bold px-4 py-2 rounded-xl border border-red-800 hover:bg-red-900/70 transition">
            Deletar selecionados ({selected.size})
          </button>
        )}
        {tab === 'orphans' && orphans.length > 0 && (
          <button onClick={() => deleteIds(orphans.map((o) => o.id))} disabled={actionLoading} className="bg-red-950/80 text-red-400 text-sm font-bold px-4 py-2 rounded-xl border border-red-900 hover:bg-red-950 transition">
            Deletar todos os órfãos ({orphans.length})
          </button>
        )}
        {tab === 'duplicates' && duplicates.length > 0 && (
          <button onClick={keepNewest} disabled={actionLoading} className="bg-yellow-900/30 text-yellow-400 text-sm font-bold px-4 py-2 rounded-xl border border-yellow-800 hover:bg-yellow-900/50 transition">
            Manter mais recente e deletar restantes
          </button>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3"><input type="checkbox" checked={selected.size === currentList.length && currentList.length > 0} onChange={toggleAll} /></th>
                {['ID', 'Nome', 'Código de Barras', 'Qtd', 'Motivo', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 && !loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-600">Nenhum item encontrado.</td></tr>
              ) : currentList.map((item) => {
                const isOldest = tab === 'duplicates' && oldestId(item.barcode) === item.id;
                const rowCls = tab === 'orphans'
                  ? 'bg-red-950/20 border-l-2 border-red-700'
                  : isOldest ? 'bg-yellow-950/30 border-l-2 border-yellow-600' : 'bg-yellow-950/10 border-l-2 border-yellow-900';
                return (
                  <tr key={item.id} className={`border-b border-gray-800/50 hover:brightness-110 transition ${rowCls}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-200 font-semibold text-xs">{item.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{item.barcode}</td>
                    <td className="px-4 py-3 text-gray-300 font-bold">{item.quantity}</td>
                    <td className="px-4 py-3">
                      {tab === 'orphans'
                        ? <span className="text-[11px] bg-red-900/40 text-red-400 font-bold px-2 py-1 rounded-md">Usuário inexistente</span>
                        : isOldest
                          ? <span className="text-[11px] bg-yellow-900/30 text-yellow-500 font-bold px-2 py-1 rounded-md">Duplicado (manter)</span>
                          : <span className="text-[11px] bg-yellow-900/20 text-yellow-400 font-bold px-2 py-1 rounded-md">Duplicado</span>}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openDetail(item)} className="text-xs bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 px-3 py-1.5 rounded-lg transition">Detalhes</button>
                      <button onClick={() => deleteIds([item.id])} disabled={actionLoading} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition">Deletar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null); }}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{detailItem.name}</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {([['Barcode', detailItem.barcode], ['Categoria', detailItem.category], ['Qtd', String(detailItem.quantity)], ['Risco', detailItem.risk_level], ['Criado em', new Date(detailItem.created_at).toLocaleString('pt-BR')]] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-gray-500 uppercase mb-0.5">{k}</dt><dd className="text-gray-200 font-semibold">{v}</dd></div>
              ))}
            </dl>
            <h3 className="text-sm font-bold text-gray-400">Scan Logs</h3>
            {detailLoading ? <p className="text-gray-600 text-sm">Carregando...</p> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-800">{['Data/Hora', 'Employee ID', 'Ação', 'Qtd'].map((h) => <th key={h} className="px-3 py-2 text-left text-gray-500">{h}</th>)}</tr></thead>
                <tbody>
                  {detailLogs.map((l) => (
                    <tr key={l.id} className="border-b border-gray-800/50">
                      <td className="px-3 py-2 text-gray-400">{new Date(l.scanned_at).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono">{l.employee_id ? l.employee_id.slice(0, 8) + '…' : '—'}</td>
                      <td className="px-3 py-2"><span className={l.action === 'entrada' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{l.action.toUpperCase()}</span></td>
                      <td className="px-3 py-2 text-gray-300 font-bold">{l.quantity}</td>
                    </tr>
                  ))}
                  {detailLogs.length === 0 && <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-600">Sem scan logs.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrphanItemsManager;
