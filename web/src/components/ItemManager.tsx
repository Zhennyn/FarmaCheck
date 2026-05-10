import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';
import { RiskBadge } from './ui/RiskBadge';

interface Item { id: string; barcode: string; name: string; category: string; quantity: number; expiry_date: string | null; risk_level: string; created_at: string; }
interface ScanLogRow { id: string; employee_name: string; scanned_at: string; action: string; quantity: number; }

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

  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)));

  const openDetail = useCallback(async (item: Item) => {
    setDetailItem(item); setDetailLogs([]); setDetailLoading(true);
    const { data } = await supabase.from('scan_logs').select('id, scanned_at, action, quantity, profiles!employee_id(name)').eq('item_id', item.id).order('scanned_at', { ascending: false });
    if (data) {
      setDetailLogs((data as unknown[]).map((r) => {
        const row = r as any;
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
    if (days < 0) return <span className="text-[10px] bg-[rgba(248,113,113,0.15)] text-[var(--accent-red)] font-bold px-1.5 py-0.5 rounded-full ml-2" style={{ animation: 'pulse-dot 2s infinite' }}>VENCIDO</span>;
    if (days <= 7) return <span className="text-[10px] bg-[rgba(248,113,113,0.15)] text-[var(--accent-red)] font-bold px-1.5 py-0.5 rounded-full ml-2">{days}d</span>;
    if (days <= 30) return <span className="text-[10px] bg-[rgba(251,191,36,0.15)] text-[var(--accent-yellow)] font-bold px-1.5 py-0.5 rounded-full ml-2">{days}d</span>;
    return null;
  };

  return (
    <div className="space-y-4 relative">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Itens</h1>

      <GlassCard className="flex flex-wrap gap-3">
        <input className="inp-glass flex-1 min-w-[220px]" placeholder="🔍 Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="inp-glass" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Categoria</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="inp-glass" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
          <option value="">Risco</option>
          {['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="inp-glass" value={filterExpiry} onChange={(e) => setFilterExpiry(e.target.value)}>
          <option value="">Validade</option>
          <option value="0">Vencidos</option>
          <option value="7">Vence em 7 dias</option>
          <option value="15">Vence em 15 dias</option>
          <option value="30">Vence em 30 dias</option>
        </select>
        {selected.size > 0 && (
          <button onClick={() => deleteIds(Array.from(selected))} disabled={actionLoading} className="btn-danger">
            Deletar selecionados ({selected.size})
          </button>
        )}
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                {['Nome', 'Código de Barras', 'Categoria', 'Qtd', 'Risco', 'Validade', 'Ações'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-[var(--text-muted)]">Carregando...</td></tr>
              ) : filtered.map((item) => {
                const days = daysUntil(item.expiry_date);
                return (
                  <tr key={item.id}>
                    <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                    <td className="font-semibold">{item.name}</td>
                    <td className="font-mono text-[var(--text-secondary)]">{item.barcode}</td>
                    <td className="text-[var(--text-secondary)]">{item.category}</td>
                    <td className="font-bold">{item.quantity}</td>
                    <td><RiskBadge level={item.risk_level} /></td>
                    <td className="text-[var(--text-secondary)] whitespace-nowrap">
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : '—'}
                      {expiryBadge(days)}
                    </td>
                    <td className="flex gap-2">
                      <button onClick={() => openDetail(item)} className="btn-ghost py-1 px-2 text-[10px]">Detalhes</button>
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
              {([['Código de Barras', detailItem.barcode], ['Categoria', detailItem.category], ['Quantidade', String(detailItem.quantity)], ['Risco', detailItem.risk_level], ['Validade', detailItem.expiry_date ? new Date(detailItem.expiry_date).toLocaleDateString('pt-BR') : '—'], ['Criado em', new Date(detailItem.created_at).toLocaleString('pt-BR')]] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-[var(--text-muted)] uppercase mb-1 font-bold">{k}</dt><dd className="text-[var(--text-primary)] font-semibold">{v}</dd></div>
              ))}
            </dl>
            <h3 className="text-sm font-bold text-[var(--text-secondary)] mt-4">Histórico de Scan Logs</h3>
            {detailLoading ? <p className="text-[var(--text-muted)] text-sm">Carregando...</p> : (
              <table className="glass-table mt-2">
                <thead><tr>{['Data/Hora', 'Funcionário', 'Ação', 'Qtd'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {detailLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-[var(--text-secondary)]">{new Date(l.scanned_at).toLocaleString('pt-BR')}</td>
                      <td className="text-[var(--text-primary)]">{l.employee_name}</td>
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

export default ItemManager;
