import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../lib/supabase';

interface AlertItem {
  id: string; name: string; barcode: string; category: string;
  quantity: number; expiry_date: string; risk_level: string;
  employee_regional: string | null; employee_number: string | null;
}

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

const daysBadge = (days: number) => {
  if (days < 0) return <span className="text-[11px] bg-red-900/60 text-red-300 font-black px-2 py-0.5 rounded-md">VENCIDO ({Math.abs(days)}d)</span>;
  if (days <= 7) return <span className="text-[11px] bg-red-900/40 text-red-400 font-bold px-2 py-0.5 rounded-md">{days}d</span>;
  if (days <= 15) return <span className="text-[11px] bg-yellow-900/40 text-yellow-400 font-bold px-2 py-0.5 rounded-md">{days}d</span>;
  return <span className="text-[11px] bg-blue-900/30 text-blue-400 font-bold px-2 py-0.5 rounded-md">{days}d</span>;
};

const ExpiryAlerts: React.FC = () => {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRegional, setFilterRegional] = useState('');
  const [filterNumber, setFilterNumber] = useState('');

  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    const { data } = await supabase.from('items')
      .select('id, name, barcode, category, quantity, expiry_date, risk_level')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', cutoff.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });
    if (data) setItems(data as AlertItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const regionais = useMemo(() => [...new Set(items.map((i) => i.employee_regional).filter(Boolean))] as string[], [items]);
  const numbers = useMemo(() => [...new Set(items.map((i) => i.employee_number).filter(Boolean))] as string[], [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (filterRegional && i.employee_regional !== filterRegional) return false;
    if (filterNumber && i.employee_number !== filterNumber) return false;
    return true;
  }), [items, filterRegional, filterNumber]);

  const vencidos = useMemo(() => filtered.filter((i) => daysUntil(i.expiry_date) < 0), [filtered]);
  const urgentes = useMemo(() => filtered.filter((i) => { const d = daysUntil(i.expiry_date); return d >= 0 && d <= 7; }), [filtered]);
  const atencao = useMemo(() => filtered.filter((i) => { const d = daysUntil(i.expiry_date); return d > 7 && d <= 15; }), [filtered]);
  const proximo = useMemo(() => filtered.filter((i) => { const d = daysUntil(i.expiry_date); return d > 15 && d <= 30; }), [filtered]);

  const exportXLSX = () => {
    const headers = ['Nome', 'Código de Barras', 'Categoria', 'Quantidade', 'Risco', 'Validade', 'Dias Restantes'];
    const rows = filtered.map((i) => [i.name, i.barcode, i.category, i.quantity, i.risk_level, new Date(i.expiry_date).toLocaleDateString('pt-BR'), daysUntil(i.expiry_date)]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alertas de Vencimento');
    XLSX.writeFile(wb, `alertas_vencimento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const Section: React.FC<{ title: string; badge: string; items: AlertItem[]; borderColor: string }> = ({ title, badge, items: sItems, borderColor }) => (
    sItems.length === 0 ? null : (
      <div className={`bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden border-l-4 ${borderColor}`}>
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-300">{title}</h2>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${badge}`}>{sItems.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-800">{['Nome', 'Barcode', 'Qtd', 'Risco', 'Validade'].map((h) => <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {sItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-2 text-gray-200 font-semibold">{item.name}</td>
                  <td className="px-4 py-2 text-gray-400 font-mono">{item.barcode}</td>
                  <td className="px-4 py-2 text-gray-300 font-bold">{item.quantity}</td>
                  <td className="px-4 py-2 text-gray-400 uppercase">{item.risk_level}</td>
                  <td className="px-4 py-2 text-gray-300 whitespace-nowrap">
                    {new Date(item.expiry_date).toLocaleDateString('pt-BR')}
                    <span className="ml-2">{daysBadge(daysUntil(item.expiry_date))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  );

  const INP = 'bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Alertas de Vencimento</h1>
        <button onClick={exportXLSX} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition">📥 Exportar XLSX</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className={INP} value={filterRegional} onChange={(e) => setFilterRegional(e.target.value)}>
          <option value="">Regional</option>
          {regionais.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={INP} value={filterNumber} onChange={(e) => setFilterNumber(e.target.value)}>
          <option value="">Nº Drogaria</option>
          {numbers.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Carregando...</p> : (
        <div className="space-y-4">
          <Section title="🔴 Produtos Vencidos" badge="bg-red-700 text-white" items={vencidos} borderColor="border-red-600" />
          <Section title="🚨 Vencem em até 7 dias" badge="bg-red-900 text-red-300" items={urgentes} borderColor="border-red-500" />
          <Section title="⚠️ Vencem em até 15 dias" badge="bg-yellow-900 text-yellow-300" items={atencao} borderColor="border-yellow-500" />
          <Section title="📅 Vencem em até 30 dias" badge="bg-blue-900 text-blue-300" items={proximo} borderColor="border-blue-500" />
          {filtered.length === 0 && <p className="text-gray-600 text-sm text-center py-10">Nenhum alerta de vencimento.</p>}
        </div>
      )}
    </div>
  );
};

export default ExpiryAlerts;
