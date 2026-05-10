import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';

interface AlertItem { id: string; name: string; barcode: string; category: string; quantity: number; expiry_date: string; risk_level: string; employee_regional: string | null; employee_number: string | null; }

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

const daysBadge = (days: number) => {
  if (days < 0) return <span className="text-[10px] bg-[rgba(248,113,113,0.15)] text-[var(--accent-red)] border border-[var(--border-red)] font-black px-2 py-0.5 rounded-full" style={{ animation: 'pulse-dot 2s infinite' }}>VENCIDO ({Math.abs(days)}d)</span>;
  if (days <= 7) return <span className="text-[10px] text-[var(--accent-red)] font-mono font-bold px-2 py-0.5">{days}d</span>;
  if (days <= 15) return <span className="text-[10px] text-[var(--accent-yellow)] font-mono font-bold px-2 py-0.5">{days}d</span>;
  return <span className="text-[10px] text-[var(--accent-blue)] font-mono font-bold px-2 py-0.5">{days}d</span>;
};

const dotColor = (days: number) => {
  if (days < 0 || days <= 7) return 'var(--accent-red)';
  if (days <= 15) return 'var(--accent-yellow)';
  return 'var(--accent-blue)';
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

  const Section: React.FC<{ title: string; accent: 'red' | 'yellow' | 'blue'; items: AlertItem[] }> = ({ title, accent, items: sItems }) => (
    sItems.length === 0 ? null : (
      <GlassCard accent={accent} className="!p-0 overflow-hidden border-l-[3px]">
        <div className="px-5 py-3 border-b border-[var(--border-glass)] bg-[var(--bg-surface)] flex items-center gap-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">{title}</h2>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--border-${accent})] text-[var(--accent-${accent})] border border-[var(--border-${accent})]`}>{sItems.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead><tr>{['Nome', 'Barcode', 'Qtd', 'Risco', 'Validade'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {sItems.map((item) => {
                const days = daysUntil(item.expiry_date);
                return (
                  <tr key={item.id}>
                    <td className="font-semibold flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor(days), boxShadow: `0 0 8px ${dotColor(days)}` }}></span>
                      {item.name}
                    </td>
                    <td className="font-mono text-[var(--text-secondary)]">{item.barcode}</td>
                    <td className="font-bold">{item.quantity}</td>
                    <td className="text-[var(--text-secondary)] uppercase text-xs">{item.risk_level}</td>
                    <td className="whitespace-nowrap">
                      <span className="text-[var(--text-primary)]">{new Date(item.expiry_date).toLocaleDateString('pt-BR')}</span>
                      <span className="ml-2">{daysBadge(days)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Alertas de Vencimento</h1>
        <button onClick={exportXLSX} className="btn-primary flex items-center gap-2">📥 Exportar XLSX</button>
      </div>

      <GlassCard className="flex flex-wrap gap-3">
        <select className="inp-glass" value={filterRegional} onChange={(e) => setFilterRegional(e.target.value)}>
          <option value="">Regional</option>
          {regionais.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="inp-glass" value={filterNumber} onChange={(e) => setFilterNumber(e.target.value)}>
          <option value="">Nº Drogaria</option>
          {numbers.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </GlassCard>

      {loading ? <p className="text-[var(--text-muted)] text-sm">Carregando...</p> : (
        <div className="space-y-4">
          <Section title="Produtos Vencidos" accent="red" items={vencidos} />
          <Section title="Vencem em até 7 dias" accent="red" items={urgentes} />
          <Section title="Vencem em até 15 dias" accent="yellow" items={atencao} />
          <Section title="Vencem em até 30 dias" accent="blue" items={proximo} />
          {filtered.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-10">Nenhum alerta de vencimento.</p>}
        </div>
      )}
    </div>
  );
};

export default ExpiryAlerts;
