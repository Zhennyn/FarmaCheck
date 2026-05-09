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

const MetricCard = ({ label, value, accent }: { label: string; value: number | string; accent: string }) => (
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
  const [searchQuery, setSearchQuery] = useState('');

  const todayCount = useMemo(() => logs.filter((l) => isToday(l.scanned_at)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => l.item_risk_level === 'critical').length, [logs]);
  const activeEmployees = useMemo(() => new Set(logs.filter((l) => isToday(l.scanned_at)).map((l) => l.employee_name)).size, [logs]);
  
  const leaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      if (isToday(l.scanned_at)) {
        counts[l.employee_name] = (counts[l.employee_name] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const expiryData = useMemo(() => {
    const buckets: Record<string, number> = {};
    logs.forEach(l => {
      if (l.item_expiry_date) {
        const monthYear = l.item_expiry_date.substring(0, 7); // YYYY-MM
        buckets[monthYear] = (buckets[monthYear] || 0) + 1;
      }
    });
    return Object.entries(buckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));
  }, [logs]);

  const employees = useMemo(() => Array.from(new Set(logs.map((l) => l.employee_name))), [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (employeeFilter && l.employee_name !== employeeFilter) return false;
      if (riskFilter !== 'all' && l.item_risk_level !== riskFilter) return false;
      if (searchQuery && !l.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [logs, employeeFilter, riskFilter, searchQuery]);

  const hourlyData = useMemo(() => buildHourlyData(logs), [logs]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');
  };

  const downloadCSV = () => {
    const headers = ['Funcionário', 'Item', 'Categoria', 'Risco', 'Ação', 'Qtd', 'Validade', 'Data/Hora'];
    const rows = filtered.map(log => [
      `"${log.employee_name}"`,
      `"${log.item_name}"`,
      `"${log.item_category}"`,
      log.item_risk_level,
      log.action,
      log.quantity,
      log.item_expiry_date || 'N/D',
      new Date(log.scanned_at).toLocaleString('pt-BR')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `farmacheck_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#ffffff', fontFamily: 'Inter, sans-serif', padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard FarmaCheck</h1>
          <p style={{ color: '#6b7280' }}>Visão geral da auditoria de PVPS</p>
        </div>
        <button 
          onClick={downloadCSV}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
        >
          📥 Exportar Relatório (CSV)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
        <MetricCard label="Bipagens hoje" value={todayCount} accent="#6366f1" />
        <MetricCard label="Itens críticos" value={criticalCount} accent="#ef4444" />
        <MetricCard label="Funcionários ativos hoje" value={activeEmployees} accent="#22c55e" />
        <MetricCard label="Campeão do Dia" value={leaderboard[0]?.[0] || '-'} accent="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🏆 Top Funcionários (Hoje)</h2>
          {leaderboard.length === 0 ? <p style={{color: '#6b7280', fontSize: 13}}>Nenhuma bipagem hoje.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {leaderboard.map(([name, count], index) => (
                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f2937' }}>
                  <span style={{ fontSize: 14 }}>
                    {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}
                    {name}
                  </span>
                  <span style={{ fontWeight: 600, color: '#6366f1' }}>{count} itens</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Bipagens por hora (24h)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Previsão de Vencimentos (Lotes Bipados)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expiryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>Auditoria de PVPS</h2>
          
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: '#111827', color: '#d1d5db', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', fontSize: 13, minWidth: 200 }}
          />

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
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Carregando dados da nuvem...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Funcionário', 'Item', 'Vencimento', 'Ação', 'Qtd', 'Risco', 'Data/Hora'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid #111827', background: RISK_BG[log.item_risk_level], transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '12px', color: '#e5e7eb', fontWeight: 500 }}>{log.employee_name}</td>
                    <td style={{ padding: '12px', color: '#e5e7eb' }}>
                      <div style={{ fontWeight: 600 }}>{log.item_name}</div>
                      <div style={{ color: '#9ca3af', fontSize: 11 }}>{log.item_category}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb' }}>
                      {log.item_expiry_date ? new Date(log.item_expiry_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: log.action === 'entrada' ? '#166534' : '#7f1d1d',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>{log.action.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontWeight: 600 }}>{log.quantity}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: RISK_COLORS[log.item_risk_level], fontWeight: 700, fontSize: 12 }}>
                        {log.item_risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af' }}>{formatTime(log.scanned_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nenhum log encontrado para esses filtros.</td></tr>
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
