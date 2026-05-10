import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { exportLogsToXLSX } from '../lib/exportXLSX';
import { createClient } from '../lib/supabase';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_BG: Record<RiskLevel, string> = {
  low: 'rgba(34,197,94,0.08)',
  medium: 'rgba(234,179,8,0.08)',
  high: 'rgba(249,115,22,0.08)',
  critical: 'rgba(239,68,68,0.08)',
};

const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const getExpiryBadge = (expiryDate?: string | null) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 8 }}>VENCIDO</span>;
  }
  if (diffDays <= 30) {
    return <span style={{ background: '#9a3412', color: '#fdba74', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 8 }}>{diffDays} DIAS</span>;
  }
  return null;
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
    padding: '24px',
    borderBottom: `4px solid ${accent}`,
    flex: 1,
    minWidth: 200,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }}>
    <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</p>
    <p style={{ color: '#ffffff', fontSize: 36, fontWeight: 800, margin: '12px 0 0' }}>{value}</p>
  </div>
);

type SortField = 'employee_name' | 'item_name' | 'item_expiry_date' | 'item_risk_level' | 'scanned_at';

const Dashboard = () => {
  const [drugstoreFilter, setDrugstoreFilter] = useState('');
  const [regionalFilter, setRegionalFilter] = useState('');
  const { logs, loading } = useRealtimeLogs({
    drugstoreNumber: drugstoreFilter || undefined,
    regional: regionalFilter || undefined,
  });
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [sortField, setSortField] = useState<SortField>('scanned_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // BUG 6: load distinct drugstore/regional options from profiles
  const [drugstoreOptions, setDrugstoreOptions] = useState<string[]>([]);
  const [regionalOptions, setRegionalOptions] = useState<string[]>([]);

  const loadFilterOptions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('drugstore_number, regional');
    if (!data) return;
    const ds = Array.from(new Set(data.map((r: { drugstore_number: string | null }) => r.drugstore_number).filter(Boolean))) as string[];
    const reg = Array.from(new Set(data.map((r: { regional: string | null }) => r.regional).filter(Boolean))) as string[];
    setDrugstoreOptions(ds.sort());
    setRegionalOptions(reg.sort());
  }, []);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, employeeFilter, riskFilter, drugstoreFilter, regionalFilter]);

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
    let result = logs.filter((l) => {
      if (employeeFilter && l.employee_name !== employeeFilter) return false;
      if (riskFilter !== 'all' && l.item_risk_level !== riskFilter) return false;
      if (searchQuery && !l.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    result = result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [logs, employeeFilter, riskFilter, searchQuery, sortField, sortDirection]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const hourlyData = useMemo(() => buildHourlyData(logs), [logs]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{ color: '#4b5563', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: '#6366f1', marginLeft: 4 }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // BUG 5: use unified XLSX export
  const downloadXLSX = () => exportLogsToXLSX(filtered);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#ffffff', fontFamily: 'Inter, sans-serif', padding: '40px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Torre de Controle</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Ao Vivo</span>
            </div>
            <style>
              {`@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } 100% { opacity: 1; transform: scale(1); } }`}
            </style>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 15, margin: 0 }}>Monitoramento e auditoria de produtos da Farmácia</p>
        </div>
        <button 
          onClick={downloadXLSX}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'transform 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          📥 Exportar Relatório (XLSX)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
        <MetricCard label="Bipagens Hoje" value={todayCount} accent="#6366f1" />
        <MetricCard label="Itens Críticos" value={criticalCount} accent="#ef4444" />
        <MetricCard label="Colaboradores (Hoje)" value={activeEmployees} accent="#22c55e" />
        <MetricCard label="Campeão do Dia" value={leaderboard[0]?.[0] || 'Ninguém'} accent="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#e5e7eb' }}>🏆 Top Produtividade (Hoje)</h2>
          {leaderboard.length === 0 ? <p style={{color: '#6b7280', fontSize: 14, fontStyle: 'italic'}}>Nenhuma atividade detectada hoje.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaderboard.map(([name, count], index) => (
                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: index < 3 ? 700 : 500, color: index === 0 ? '#fbbf24' : index === 1 ? '#e5e7eb' : index === 2 ? '#d97706' : '#9ca3af' }}>
                    {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}
                    {name}
                  </span>
                  <div style={{ background: 'rgba(99,102,241,0.1)', padding: '4px 12px', borderRadius: 999 }}>
                    <span style={{ fontWeight: 700, color: '#818cf8', fontSize: 14 }}>{count} itens</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#e5e7eb' }}>Bipagens nas Últimas 24h</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27273a" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#27273a' }} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 12, color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#e5e7eb' }}>Mapa de Vencimentos (Meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expiryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27273a" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#27273a' }} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 12, color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 24, padding: '32px 0', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '0 32px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px 0' }}>Log de Auditoria Detalhado</h2>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 280 }}>
              <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16, color: '#6b7280' }}>🔍</span>
              <input
                type="text"
                placeholder="Pesquisar produto ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a14', color: '#fff', border: '1px solid #374151', borderRadius: 12, padding: '10px 16px 10px 42px', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
              />
            </div>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{ background: '#0a0a14', color: '#d1d5db', border: '1px solid #374151', borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Todos os Colaboradores</option>
              {employees.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
              style={{ background: '#0a0a14', color: '#d1d5db', border: '1px solid #374151', borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Qualquer Risco</option>
              {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((r) => (
                <option key={r} value={r}>{r === 'low' ? 'Baixo' : r === 'medium' ? 'Médio' : r === 'high' ? 'Alto' : 'Crítico'} ({r})</option>
              ))}
            </select>

            <select
              value={drugstoreFilter}
              onChange={(e) => setDrugstoreFilter(e.target.value)}
              style={{ background: '#0a0a14', color: '#d1d5db', border: '1px solid #374151', borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Nº Drogaria</option>
              {drugstoreOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={regionalFilter}
              onChange={(e) => setRegionalFilter(e.target.value)}
              style={{ background: '#0a0a14', color: '#d1d5db', border: '1px solid #374151', borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Regional</option>
              {regionalOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
            Exibindo <strong style={{color: '#fff'}}>{filtered.length}</strong> resultado(s) encontrado(s) na base.
          </p>
        </div>

        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #374151', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#9ca3af', margin: 0 }}>Sincronizando com a nuvem...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27273a', background: 'rgba(255,255,255,0.02)' }}>
                    <th onClick={() => handleSort('employee_name')} style={{ cursor: 'pointer', textAlign: 'left', padding: '16px 32px', color: '#9ca3af', fontWeight: 600, userSelect: 'none' }}>Colaborador <SortIcon field="employee_name" /></th>
                    <th onClick={() => handleSort('item_name')} style={{ cursor: 'pointer', textAlign: 'left', padding: '16px', color: '#9ca3af', fontWeight: 600, userSelect: 'none' }}>Produto <SortIcon field="item_name" /></th>
                    <th onClick={() => handleSort('item_expiry_date')} style={{ cursor: 'pointer', textAlign: 'left', padding: '16px', color: '#9ca3af', fontWeight: 600, userSelect: 'none' }}>Vencimento <SortIcon field="item_expiry_date" /></th>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#9ca3af', fontWeight: 600 }}>Ação</th>
                    <th style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontWeight: 600 }}>Qtd</th>
                    <th onClick={() => handleSort('item_risk_level')} style={{ cursor: 'pointer', textAlign: 'left', padding: '16px', color: '#9ca3af', fontWeight: 600, userSelect: 'none' }}>Nível de Risco <SortIcon field="item_risk_level" /></th>
                    <th onClick={() => handleSort('scanned_at')} style={{ cursor: 'pointer', textAlign: 'right', padding: '16px 32px', color: '#9ca3af', fontWeight: 600, userSelect: 'none' }}>Registro <SortIcon field="scanned_at" /></th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #1a1a2e', background: RISK_BG[log.item_risk_level], transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                      onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      <td style={{ padding: '16px 32px', color: '#f3f4f6', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                            {log.employee_name.charAt(0).toUpperCase()}
                          </div>
                          {log.employee_name}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#f3f4f6' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{log.item_name}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{log.item_category}</div>
                      </td>
                      <td style={{ padding: '16px', color: '#e5e7eb', whiteSpace: 'nowrap' }}>
                        {log.item_expiry_date ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {new Date(log.item_expiry_date).toLocaleDateString('pt-BR')}
                            {getExpiryBadge(log.item_expiry_date)}
                          </div>
                        ) : <span style={{ color: '#6b7280' }}>Não Informado</span>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: log.action === 'entrada' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          color: log.action === 'entrada' ? '#4ade80' : '#f87171',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase'
                        }}>{log.action}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#e5e7eb', fontWeight: 700, textAlign: 'center', fontSize: 15 }}>{log.quantity}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: RISK_COLORS[log.item_risk_level], fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
                          {log.item_risk_level === 'low' ? 'BAIXO' : log.item_risk_level === 'medium' ? 'MÉDIO' : log.item_risk_level === 'high' ? 'ALTO' : 'CRÍTICO'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 32px', color: '#9ca3af', textAlign: 'right', fontSize: 13 }}>{formatTime(log.scanned_at)}</td>
                    </tr>
                  ))}
                  {currentLogs.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280', fontSize: 15 }}>Nenhuma atividade registrada para estes filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 0', borderTop: '1px solid #27273a' }}>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Página {currentPage} de {totalPages}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{ background: currentPage === 1 ? '#1f2937' : '#374151', color: currentPage === 1 ? '#4b5563' : '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                  >
                    Anterior
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    style={{ background: currentPage === totalPages ? '#1f2937' : '#374151', color: currentPage === totalPages ? '#4b5563' : '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
