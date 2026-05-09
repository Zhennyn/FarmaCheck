import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useRealtimeLogs, { EnrichedLog } from '../hooks/useRealtimeLogs';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_BG: Record<RiskLevel, string> = {
  low: 'rgba(34,197,94,0.12)',
  medium: 'rgba(234,179,8,0.12)',
  high: 'rgba(249,115,22,0.12)',
  critical: 'rgba(239,68,68,0.12)',
};

const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const buildHourlyData = (logs: EnrichedLog[]) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const buckets: Record<number, number> = {};
  for (let h = 0; h < 24; h++) buckets[h] = 0;

  logs.forEach((log) => {
    const d = new Date(log.scanned_at);
    if (d >= cutoff) {
      const hour = d.getHours();
      buckets[hour] = (buckets[hour] ?? 0) + 1;
    }
  });

  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}h`,
    count: buckets[h] ?? 0,
  }));
};

const MetricCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div style={{
    background: '#1a1a2e',
    borderRadius: 16,
    padding: '20px 24px',
    borderLeft: `4px solid ${accent}`,
    flex: 1,
    minWidth: 160,
  }}>
    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{label}</p>
    <p style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>{value}</p>
  </div>
);

const Dashboard = () => {
  const { logs, loading } = useRealtimeLogs();
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  const todayCount = useMemo(() => logs.filter((l) => isToday(l.scanned_at)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => l.item_risk_level === 'critical').length, [logs]);
  const activeEmployees = useMemo(() => new Set(logs.filter((l) => isToday(l.scanned_at)).map((l) => l.employee_id)).size, [logs]);
  const pendingSync = useMemo(() => logs.filter((l) => !l.synced).length, [logs]);

  const employees = useMemo(() => Array.from(new Set(logs.map((l) => l.employee_name))), [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (employeeFilter && l.employee_name !== employeeFilter) return false;
      if (riskFilter !== 'all' && l.item_risk_level !== riskFilter) return false;
      return true;
    });
  }, [logs, employeeFilter, riskFilter]);

  const hourlyData = useMemo(() => buildHourlyData(logs), [logs]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#ffffff', fontFamily: 'Inter, sans-serif', padding: '32px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard FarmaCheck</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Monitoramento em tempo real</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
        <MetricCard label="Bipagens hoje" value={todayCount} accent="#6366f1" />
        <MetricCard label="Itens críticos" value={criticalCount} accent="#ef4444" />
        <MetricCard label="Funcionários ativos" value={activeEmployees} accent="#22c55e" />
        <MetricCard label="Pendentes de sync" value={pendingSync} accent="#f97316" />
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Bipagens por hora (últimas 24h)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>Logs em tempo real</h2>
          <select
            value={employeeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEmployeeFilter(e.target.value)}
            style={{ background: '#111827', color: '#d1d5db', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
          >
            <option value="">Todos funcionários</option>
            {employees.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRiskFilter(e.target.value as RiskLevel | 'all')}
            style={{ background: '#111827', color: '#d1d5db', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
          >
            <option value="all">Todos riscos</option>
            {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Funcionário', 'Item', 'Ação', 'Qtd', 'Risco', 'Horário'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid #111827', background: RISK_BG[log.item_risk_level] }}
                  >
                    <td style={{ padding: '10px 12px', color: '#e5e7eb' }}>{log.employee_name}</td>
                    <td style={{ padding: '10px 12px', color: '#e5e7eb' }}>
                      <div>{log.item_name}</div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>{log.item_category}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: log.action === 'entrada' ? '#166534' : '#7f1d1d',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#e5e7eb' }}>{log.quantity}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: RISK_COLORS[log.item_risk_level], fontWeight: 600, fontSize: 12 }}>
                        {log.item_risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{formatTime(log.scanned_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Nenhum resultado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
