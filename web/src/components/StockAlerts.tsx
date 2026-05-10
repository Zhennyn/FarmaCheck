import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';
import { RiskBadge } from './ui/RiskBadge';

interface StockItem { id: string; name: string; barcode: string; category: string; quantity: number; expiry_date: string | null; risk_level: string; created_at: string; }

const exportSection = (items: StockItem[], filename: string) => {
  const headers = ['Nome', 'Barcode', 'Categoria', 'Quantidade', 'Risco', 'Validade'];
  const rows = items.map((i) => [i.name, i.barcode, i.category, i.quantity, i.risk_level, i.expiry_date ? new Date(i.expiry_date).toLocaleDateString('pt-BR') : '—']);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const Table: React.FC<{ items: StockItem[]; emptyMsg: string; filename: string; accent: 'red' | 'yellow' | 'purple' }> = ({ items, emptyMsg, filename, accent }) => (
  <GlassCard accent={accent} className="!p-0 overflow-hidden border-l-[3px]">
    <div className="px-5 py-3 border-b border-[var(--border-glass)] bg-[var(--bg-surface)] flex items-center justify-between">
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--border-${accent})] text-[var(--accent-${accent})] border border-[var(--border-${accent})]`}>{items.length} itens</span>
      {items.length > 0 && (
        <button onClick={() => exportSection(items, filename)} className="btn-ghost !text-[10px] !py-1 !px-2">📥 Exportar</button>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="glass-table">
        <thead><tr>{['Nome', 'Barcode', 'Categoria', 'Qtd', 'Risco', 'Validade'].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">{emptyMsg}</td></tr>
          ) : items.map((item) => (
            <tr key={item.id}>
              <td className="font-semibold">{item.name}</td>
              <td className="font-mono text-[var(--text-secondary)]">{item.barcode}</td>
              <td className="text-[var(--text-secondary)]">{item.category}</td>
              <td className={`font-black ${item.quantity === 0 ? 'text-[var(--accent-red)]' : item.quantity <= 5 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-primary)]'}`}>{item.quantity}</td>
              <td><RiskBadge level={item.risk_level} /></td>
              <td className="text-[var(--text-secondary)]">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </GlassCard>
);

const StockAlerts: React.FC = () => {
  const [inactive, setInactive] = useState<StockItem[]>([]);
  const [critical, setCritical] = useState<StockItem[]>([]);
  const [zero, setZero] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const cutoff30 = new Date(); cutoff30.setDate(cutoff30.getDate() - 30);
    const [{ data: allItems }, { data: recentScans }] = await Promise.all([
      supabase.from('items').select('id, name, barcode, category, quantity, expiry_date, risk_level, created_at'),
      supabase.from('scan_logs').select('item_id, scanned_at').gte('scanned_at', cutoff30.toISOString()),
    ]);
    if (!allItems) { setLoading(false); return; }
    const recentItemIds = new Set((recentScans ?? []).map((s: any) => s.item_id));
    const items = allItems as StockItem[];
    setInactive(items.filter((i) => !recentItemIds.has(i.id)));
    setCritical(items.filter((i) => i.quantity > 0 && i.quantity <= 5));
    setZero(items.filter((i) => i.quantity === 0));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Alertas de Estoque</h1>
        <button onClick={fetchAll} disabled={loading} className="btn-ghost">
          {loading ? 'Carregando...' : '↺ Recarregar'}
        </button>
      </div>

      {loading ? <p className="text-[var(--text-muted)] text-sm">Carregando...</p> : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-[var(--accent-purple)] uppercase mb-2 ml-1">📦 Sem movimentação (&gt; 30 dias)</h2>
            <Table items={inactive} emptyMsg="Nenhum item inativo." filename="itens_inativos" accent="purple" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[var(--accent-yellow)] uppercase mb-2 ml-1">⚠️ Estoque crítico (≤ 5)</h2>
            <Table items={critical} emptyMsg="Nenhum item em estoque crítico." filename="estoque_critico" accent="yellow" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[var(--accent-red)] uppercase mb-2 ml-1">🔴 Sem estoque (= 0)</h2>
            <Table items={zero} emptyMsg="Nenhum item zerado." filename="sem_estoque" accent="red" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
