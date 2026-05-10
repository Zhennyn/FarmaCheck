import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';

type Period = 'today' | '7d' | '30d';
interface RankEntry { id: string; name: string; sigla: string | null; number: string | null; regional: string | null; total: number; lastScan: string; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <GlassCard accent="blue" className="!p-2 text-white text-xs shadow-xl">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-[var(--accent-blue)]">Total: {payload[0].value}</p>
      </GlassCard>
    );
  }
  return null;
};

const ProductivityRanking: React.FC = () => {
  const [period, setPeriod] = useState<Period>('today');
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const periodStart = useCallback((p: Period): string => {
    const d = new Date();
    if (p === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString(); }
    if (p === '7d') { d.setDate(d.getDate() - 7); return d.toISOString(); }
    d.setDate(d.getDate() - 30); return d.toISOString();
  }, []);

  const fetchRanking = useCallback(async (p: Period) => {
    setLoading(true);
    const { data } = await supabase.from('scan_logs').select('employee_id, quantity, scanned_at, profiles!employee_id(name, sigla, number, regional)').gte('scanned_at', periodStart(p)).order('scanned_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const map = new Map<string, RankEntry>();
    (data as unknown[]).forEach((raw) => {
      const row = raw as any;
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const existing = map.get(row.employee_id);
      if (existing) { existing.total += row.quantity; if (row.scanned_at > existing.lastScan) existing.lastScan = row.scanned_at; } 
      else { map.set(row.employee_id, { id: row.employee_id, name: prof?.name ?? 'Desconhecido', sigla: prof?.sigla ?? null, number: prof?.number ?? null, regional: prof?.regional ?? null, total: row.quantity, lastScan: row.scanned_at }); }
    });
    setRanking([...map.values()].sort((a, b) => b.total - a.total));
    setLoading(false);
  }, [periodStart]);

  useEffect(() => { fetchRanking(period); }, [period, fetchRanking]);

  const top10 = useMemo(() => ranking.slice(0, 10).map((r) => ({ name: r.sigla ?? r.name.split(' ')[0], total: r.total })), [ranking]);

  const medals = ['🥇', '🥈', '🥉'];
  const PERIOD_LABEL: Record<Period, string> = { today: 'Hoje', '7d': '7 dias', '30d': '30 dias' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Ranking de Produtividade</h1>
        <GlassCard className="flex gap-2 !py-2 !px-3">
          {(['today', '7d', '30d'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${period === p ? 'bg-[var(--accent-blue)] text-[#0a0f1e]' : 'text-[var(--text-secondary)] hover:text-white'}`}>
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </GlassCard>
      </div>

      {loading ? <p className="text-[var(--text-muted)] text-sm">Calculando...</p> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GlassCard className="!p-0 overflow-hidden h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-glass) transparent' }}>
            <table className="glass-table">
              <thead><tr>{['#', 'Nome', 'Sigla', 'Nº', 'Regional', 'Total', 'Última Bipagem'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">Sem dados para o período.</td></tr>
                ) : ranking.map((emp, idx) => (
                  <tr key={emp.id}>
                    <td className="text-lg">{idx < 3 ? medals[idx] : <span className="text-[var(--text-muted)] font-bold text-sm">{idx + 1}</span>}</td>
                    <td className="font-semibold">{emp.name}</td>
                    <td className="font-mono text-[var(--text-secondary)] text-xs">{emp.sigla ?? '—'}</td>
                    <td className="text-[var(--text-secondary)] text-xs">{emp.number ?? '—'}</td>
                    <td className="text-[var(--text-secondary)] text-xs">{emp.regional ?? '—'}</td>
                    <td className="text-[var(--accent-blue)] font-black text-base">{emp.total}</td>
                    <td className="text-[var(--text-secondary)] text-[10px]">{new Date(emp.lastScan).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <GlassCard className="h-[400px] flex flex-col">
            <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">Top 10 — Total Bipado</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-hover)' }} />
                  <Bar dataKey="total" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ProductivityRanking;
