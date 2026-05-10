import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../lib/supabase';

interface StockItem {
  id: string; name: string; barcode: string; category: string;
  quantity: number; expiry_date: string | null; risk_level: string; created_at: string;
  last_scan?: string;
}

const exportSection = (items: StockItem[], filename: string) => {
  const headers = ['Nome', 'Barcode', 'Categoria', 'Quantidade', 'Risco', 'Validade'];
  const rows = items.map((i) => [i.name, i.barcode, i.category, i.quantity, i.risk_level, i.expiry_date ? new Date(i.expiry_date).toLocaleDateString('pt-BR') : '—']);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const Table: React.FC<{ items: StockItem[]; emptyMsg: string; filename: string }> = ({ items, emptyMsg, filename }) => (
  <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
      <span className="text-xs text-gray-500">{items.length} item(ns)</span>
      {items.length > 0 && (
        <button onClick={() => exportSection(items, filename)} className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold transition">📥 Exportar</button>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-gray-800">{['Nome', 'Barcode', 'Categoria', 'Qtd', 'Risco', 'Validade'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">{emptyMsg}</td></tr>
          ) : items.map((item) => (
            <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
              <td className="px-4 py-2.5 text-gray-200 font-semibold">{item.name}</td>
              <td className="px-4 py-2.5 text-gray-400 font-mono">{item.barcode}</td>
              <td className="px-4 py-2.5 text-gray-400">{item.category}</td>
              <td className={`px-4 py-2.5 font-black ${item.quantity === 0 ? 'text-red-400' : item.quantity <= 5 ? 'text-orange-400' : 'text-gray-300'}`}>{item.quantity}</td>
              <td className="px-4 py-2.5 text-gray-400 uppercase">{item.risk_level}</td>
              <td className="px-4 py-2.5 text-gray-400">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
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

    const recentItemIds = new Set((recentScans ?? []).map((s: { item_id: string }) => s.item_id));
    const items = allItems as StockItem[];

    setInactive(items.filter((i) => !recentItemIds.has(i.id)));
    setCritical(items.filter((i) => i.quantity > 0 && i.quantity <= 5));
    setZero(items.filter((i) => i.quantity === 0));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Alertas de Estoque</h1>
        <button onClick={fetchAll} disabled={loading} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition">
          {loading ? 'Carregando...' : '↺ Recarregar'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-400 mb-2">📦 Sem movimentação há mais de 30 dias ({inactive.length})</h2>
          <Table items={inactive} emptyMsg="Nenhum item inativo." filename="itens_inativos" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-orange-400 mb-2">⚠️ Estoque crítico — quantidade ≤ 5 ({critical.length})</h2>
          <Table items={critical} emptyMsg="Nenhum item em estoque crítico." filename="estoque_critico" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-red-400 mb-2">🔴 Sem estoque — quantidade = 0 ({zero.length})</h2>
          <Table items={zero} emptyMsg="Nenhum item zerado." filename="sem_estoque" />
        </div>
      </div>
    </div>
  );
};

export default StockAlerts;
