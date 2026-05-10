import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import useRealtimeLogs, { EnrichedLog } from '../hooks/useRealtimeLogs';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const RISK_BG: Record<RiskLevel, string> = {
  low: 'bg-green-900/20 border-l-2 border-green-500',
  medium: 'bg-yellow-900/20 border-l-2 border-yellow-500',
  high: 'bg-orange-900/20 border-l-2 border-orange-500',
  critical: 'bg-red-900/20 border-l-2 border-red-500',
};
const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'text-green-400', medium: 'text-yellow-400',
  high: 'text-orange-400', critical: 'text-red-400',
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const fmtTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const MetricCard: React.FC<{ label: string; value: string | number; accent: string; icon: string }> = ({ label, value, accent, icon }) => (
  <div className={`bg-gray-900 rounded-2xl p-5 border-b-4 ${accent} flex-1 min-w-[160px]`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xl">{icon}</span>
      <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">{label}</p>
    </div>
    <p className="text-white text-4xl font-black">{value}</p>
  </div>
);

const buildHourly = (logs: EnrichedLog[]) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 3600 * 1000);
  const entrada: Record<number, number> = {};
  const saida: Record<number, number> = {};
  for (let h = 0; h < 24; h++) { entrada[h] = 0; saida[h] = 0; }
  logs.forEach((l) => {
    const d = new Date(l.scanned_at);
    if (d >= cutoff) {
      const h = d.getHours();
      if (l.action === 'entrada') entrada[h]++;
      else saida[h]++;
    }
  });
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}h`,
    entrada: entrada[h],
    saida: saida[h],
  }));
};

const build7Days = (logs: EnrichedLog[]) => {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days[d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
  }
  logs.forEach((l) => {
    const key = new Date(l.scanned_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
};

const TT = { contentStyle: { background: '#111827', border: 'none', borderRadius: 12, color: '#fff' }, cursor: { fill: 'rgba(255,255,255,0.04)' } };

const Dashboard: React.FC = () => {
  const { logs, loading } = useRealtimeLogs({ limit: 500 });

  const todayCount = useMemo(() => logs.filter((l) => isToday(l.scanned_at)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => l.item_risk_level === 'critical').length, [logs]);
  const activeEmp = useMemo(() => new Set(logs.filter((l) => isToday(l.scanned_at)).map((l) => l.employee_id)).size, [logs]);
  const pendingSync = useMemo(() => logs.filter((l) => !l.synced).length, [logs]);
  const hourly = useMemo(() => buildHourly(logs), [logs]);
  const week = useMemo(() => build7Days(logs), [logs]);
  const recent20 = useMemo(() => logs.slice(0, 20), [logs]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black text-white">Torre de Controle</h1>
        <span className="flex items-center gap-1.5 bg-green-900/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />AO VIVO
        </span>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-wrap gap-4">
        <MetricCard label="Bipagens Hoje" value={todayCount} accent="border-indigo-500" icon="📊" />
        <MetricCard label="Itens Críticos" value={criticalCount} accent="border-red-500" icon="🚨" />
        <MetricCard label="Funcionários (Hoje)" value={activeEmp} accent="border-green-500" icon="👥" />
        <MetricCard label="Pendentes Sync" value={pendingSync} accent="border-orange-500" icon="⏳" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-sm font-bold text-gray-300 mb-4">Bipagens por Hora (últimas 24h)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourly} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar dataKey="entrada" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entrada" />
              <Bar dataKey="saida" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saída" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-sm font-bold text-gray-300 mb-4">Evolução — Últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={week} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Bipagens" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Realtime table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-300">Últimos 20 Registros</h2>
          {loading && <span className="text-xs text-gray-500 animate-pulse">Atualizando...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Funcionário', 'Sigla', 'Nº', 'Regional', 'Item', 'Ação', 'Qtd', 'Risco', 'Horário'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent20.map((log) => (
                <tr key={log.id} className={`border-b border-gray-800/50 hover:brightness-110 transition ${RISK_BG[log.item_risk_level]}`}>
                  <td className="px-4 py-3 text-gray-200 font-medium">{log.employee_name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.employee_sigla ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.employee_number ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.employee_regional ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-200 font-semibold text-xs">{log.item_name}</div>
                    <div className="text-gray-500 text-[11px]">{log.item_category}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${log.action === 'entrada' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-bold">{log.quantity}</td>
                  <td className={`px-4 py-3 text-xs font-bold uppercase ${RISK_LABEL[log.item_risk_level]}`}>
                    {log.item_risk_level}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtTime(log.scanned_at)}</td>
                </tr>
              ))}
              {recent20.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-600">Sem registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
