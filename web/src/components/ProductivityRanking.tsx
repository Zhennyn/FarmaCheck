import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '../lib/supabase';

type Period = 'today' | '7d' | '30d';

interface RankEntry {
  id: string; name: string; sigla: string | null; number: string | null; regional: string | null;
  total: number; lastScan: string;
}

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
    const { data } = await supabase
      .from('scan_logs')
      .select('employee_id, quantity, scanned_at, profiles!employee_id(name, sigla, number, regional)')
      .gte('scanned_at', periodStart(p))
      .order('scanned_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const map = new Map<string, RankEntry>();
    (data as unknown[]).forEach((raw) => {
      const row = raw as { employee_id: string; quantity: number; scanned_at: string; profiles: { name: string; sigla: string | null; number: string | null; regional: string | null } | null };
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const existing = map.get(row.employee_id);
      if (existing) {
        existing.total += row.quantity;
        if (row.scanned_at > existing.lastScan) existing.lastScan = row.scanned_at;
      } else {
        map.set(row.employee_id, {
          id: row.employee_id,
          name: prof?.name ?? 'Desconhecido',
          sigla: prof?.sigla ?? null,
          number: prof?.number ?? null,
          regional: prof?.regional ?? null,
          total: row.quantity,
          lastScan: row.scanned_at,
        });
      }
    });

    setRanking([...map.values()].sort((a, b) => b.total - a.total));
    setLoading(false);
  }, [periodStart]);

  useEffect(() => { fetchRanking(period); }, [period, fetchRanking]);

  const top10 = useMemo(() => ranking.slice(0, 10).map((r) => ({ name: r.sigla ?? r.name.split(' ')[0], total: r.total })), [ranking]);

  const medals = ['🥇', '🥈', '🥉'];
  const PERIOD_LABEL: Record<Period, string> = { today: 'Hoje', '7d': '7 dias', '30d': '30 dias' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Ranking de Produtividade</h1>
        <div className="flex gap-2">
          {(['today', '7d', '30d'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Calculando...</p> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['#', 'Nome', 'Sigla', 'Nº', 'Regional', 'Total Bipado', 'Última Bipagem'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-600">Sem dados para o período.</td></tr>
                ) : ranking.map((emp, idx) => (
                  <tr key={emp.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 text-lg">{idx < 3 ? medals[idx] : <span className="text-gray-500 font-bold text-sm">{idx + 1}</span>}</td>
                    <td className="px-4 py-3 text-gray-200 font-semibold">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{emp.sigla ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{emp.number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{emp.regional ?? '—'}</td>
                    <td className="px-4 py-3 text-indigo-400 font-black text-base">{emp.total}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(emp.lastScan).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-sm font-bold text-gray-400 mb-4">Top 10 — Total Bipado</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductivityRanking;
