import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';

interface Item {
  id: string; barcode: string; name: string; category: string;
  quantity: number; expiry_date: string | null; risk_level: string; created_at: string;
}

interface ScanLogRow {
  id: string; employee_name: string; scanned_at: string; action: string; quantity: number;
}

const INP = 'bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition';
const RISK_COLOR: Record<string, string> = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400' };

const daysUntil = (date: string | null) => {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
};

const ItemManager: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailLogs, setDetailLogs] = useState<ScanLogRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as Item[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);

  const filtered = useMemo(() => items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.barcode.includes(search)) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterRisk && item.risk_level !== filterRisk) return false;
    if (filterExpiry) {
      const days = daysUntil(item.expiry_date);
      if (days === null || days > parseInt(filterExpiry)) return false;
    }
    return true;
  }), [items, search, filterCategory, filterRisk, filterExpiry]);

  const toggleSelect = (id: string) => setSelected((prev) => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () => setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)));

  const openDetail = useCallback(async (item: Item) => {
    setDetailItem(item); setDetailLogs([]); setDetailLoading(true);
    const { data } = await supabase.from('scan_logs')
      .select('id, scanned_at, action, quantity, profiles!employee_id(name)')
      .eq('item_id', item.id).order('scanned_at', { ascending: false });
    if (data) {
      setDetailLogs((data as unknown[]).map((r) => {
        const row = r as { id: string; scanned_at: string; action: string; quantity: number; profiles: { name: string } | null };
        return { id: row.id, employee_name: row.profiles?.name ?? '—', scanned_at: row.scanned_at, action: row.action, quantity: row.quantity };
      }));
    }
    setDetailLoading(false);
  }, []);

  const deleteIds = useCallback(async (ids: string[]) => {
    if (!window.confirm(`Deletar ${ids.length} item(ns)?`)) return;
    setActionLoading(true);
    await supabase.from('items').delete().in('id', ids);
    setSelected(new Set());
    await fetchItems();
    setActionLoading(false);
  }, [fetchItems]);

  const expiryBadge = (days: number | null) => {
    if (days === null) return null;
    if (days < 0) return <span className="text-[11px] bg-red-900/50 text-red-400 font-bold px-2 py-0.5 rounded-md ml-2">VENCIDO</span>;
    if (days <= 7) return <span className="text-[11px] bg-red-900/30 text-red-300 font-bold px-2 py-0.5 rounded-md ml-2">{days}d</span>;
    if (days <= 30) return <span className="text-[11px] bg-orange-900/30 text-orange-300 font-bold px-2 py-0.5 rounded-md ml-2">{days}d</span>;
    return null;
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-black text-white">Itens</h1>

      <div className="flex flex-wrap gap-3">
        <input className={INP + ' flex-1 min-w-[220px]'} placeholder="🔍 Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={INP} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Categoria</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={INP} value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
          <option value="">Risco</option>
          {['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={INP} value={filterExpiry} onChange={(e) => setFilterExpiry(e.target.value)}>
          <option value="">Validade</option>
          <option value="0">Vencidos</option>
          <option value="7">Vence em 7 dias</option>
          <option value="15">Vence em 15 dias</option>
          <option value="30">Vence em 30 dias</option>
        </select>
        {selected.size > 0 && (
          <button onClick={() => deleteIds(Array.from(selected))} disabled={actionLoading}
            className="bg-red-900/50 text-red-400 text-sm font-bold px-4 py-2 rounded-xl border border-red-800 hover:bg-red-900/70 transition">
            Deletar selecionados ({selected.size})
          </button>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                {['Nome', 'Código de Barras', 'Categoria', 'Qtd', 'Risco', 'Validade', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-600">Carregando...</td></tr>
              ) : filtered.map((item) => {
                const days = daysUntil(item.expiry_date);
                return (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                    <td className="px-4 py-3 text-gray-200 font-semibold text-xs">{item.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{item.barcode}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{item.category}</td>
                    <td className="px-4 py-3 text-gray-300 font-bold">{item.quantity}</td>
                    <td className={`px-4 py-3 text-xs font-bold uppercase ${RISK_COLOR[item.risk_level] ?? 'text-gray-400'}`}>{item.risk_level}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : '—'}
                      {expiryBadge(days)}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openDetail(item)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition">Detalhes</button>
                      <button onClick={() => deleteIds([item.id])} disabled={actionLoading} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition">Deletar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null); }}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{detailItem.name}</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {([['Código de Barras', detailItem.barcode], ['Categoria', detailItem.category], ['Quantidade', String(detailItem.quantity)], ['Risco', detailItem.risk_level], ['Validade', detailItem.expiry_date ? new Date(detailItem.expiry_date).toLocaleDateString('pt-BR') : '—'], ['Criado em', new Date(detailItem.created_at).toLocaleString('pt-BR')]] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-gray-500 uppercase mb-0.5">{k}</dt><dd className="text-gray-200 font-semibold">{v}</dd></div>
              ))}
            </dl>
            <h3 className="text-sm font-bold text-gray-400 mt-2">Histórico de Scan Logs</h3>
            {detailLoading ? <p className="text-gray-600 text-sm">Carregando...</p> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-800">{['Data/Hora', 'Funcionário', 'Ação', 'Qtd'].map((h) => <th key={h} className="px-3 py-2 text-left text-gray-500">{h}</th>)}</tr></thead>
                <tbody>
                  {detailLogs.map((l) => (
                    <tr key={l.id} className="border-b border-gray-800/50">
                      <td className="px-3 py-2 text-gray-400">{new Date(l.scanned_at).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-gray-300">{l.employee_name}</td>
                      <td className="px-3 py-2"><span className={l.action === 'entrada' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{l.action.toUpperCase()}</span></td>
                      <td className="px-3 py-2 text-gray-300 font-bold">{l.quantity}</td>
                    </tr>
                  ))}
                  {detailLogs.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-600">Sem registros.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManager;
