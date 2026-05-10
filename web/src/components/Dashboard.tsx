import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GlassCard from './ui/GlassCard';
import { RiskBadge } from './ui/RiskBadge';
import useRealtimeLogs, { EnrichedLog } from '../hooks/useRealtimeLogs';

const AnimatedCount: React.FC<{ value: number }> = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    let timer: NodeJS.Timeout;
    if (value === 0) setCount(0);
    else {
      timer = setInterval(() => {
        start += Math.ceil(value / (duration / 16));
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else setCount(start);
      }, 16);
    }
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <GlassCard accent="blue" className="!p-2 text-white text-xs shadow-xl">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </GlassCard>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { logs, loading } = useRealtimeLogs({ limit: 500 });

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

  const todayCount = useMemo(() => logs.filter((l) => isToday(l.scanned_at)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => l.item_risk_level === 'critical').length, [logs]);
  const activeEmp = useMemo(() => new Set(logs.filter((l) => isToday(l.scanned_at)).map((l) => l.employee_id)).size, [logs]);
  const pendingSync = useMemo(() => logs.filter((l) => !l.synced).length, [logs]);

  const hourly = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, entrada: 0, saida: 0 }));
    logs.filter(l => isToday(l.scanned_at)).forEach(l => {
      const h = new Date(l.scanned_at).getHours();
      arr[h][l.action]++;
    });
    return arr;
  }, [logs]);

  const week = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      arr.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), total: 0 });
    }
    logs.forEach(l => {
      const ds = new Date(l.scanned_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const f = arr.find(a => a.date === ds);
      if (f) f.total++;
    });
    return arr;
  }, [logs]);

  const recent20 = useMemo(() => logs.slice(0, 20), [logs]);

  if (loading) return <div className="text-[var(--text-muted)] text-sm p-4">Carregando métricas...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard accent="blue" className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold tracking-wider">Bipagens Hoje</span>
          <span className="font-mono text-2xl text-[var(--accent-blue)] font-black"><AnimatedCount value={todayCount} /></span>
          <span className="text-[var(--text-muted)] text-xs flex gap-1 items-center"><span className="text-[var(--accent-green)]">↑ 12%</span> vs ontem</span>
        </GlassCard>
        <GlassCard accent="purple" className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold tracking-wider">Funcionários Ativos</span>
          <span className="font-mono text-2xl text-[var(--accent-purple)] font-black"><AnimatedCount value={activeEmp} /></span>
          <span className="text-[var(--text-muted)] text-xs flex gap-1 items-center"><span className="text-[var(--accent-green)]">↑ 2</span> vs ontem</span>
        </GlassCard>
        <GlassCard accent="red" className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold tracking-wider">Itens Críticos</span>
          <span className="font-mono text-2xl text-[var(--accent-red)] font-black"><AnimatedCount value={criticalCount} /></span>
          <span className="text-[var(--text-muted)] text-xs flex gap-1 items-center"><span className="text-[var(--accent-red)]">↓ 1</span> vs ontem</span>
        </GlassCard>
        <GlassCard accent="yellow" className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold tracking-wider">Sync Pendente</span>
          <span className="font-mono text-2xl text-[var(--accent-yellow)] font-black"><AnimatedCount value={pendingSync} /></span>
          <span className="text-[var(--text-muted)] text-xs">Na fila local</span>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">Volume Horário (Hoje)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-hover)' }} />
              <Bar dataKey="entrada" name="Entrada" radius={[4, 4, 0, 0]}>
                {hourly.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.entrada > 10 ? 'var(--accent-red)' : entry.entrada > 5 ? 'var(--accent-yellow)' : 'var(--accent-blue)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">Evolução 7 Dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={week}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" stroke="var(--accent-purple)" strokeWidth={3} dot={{ fill: 'var(--accent-purple)', r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase">Últimos Logs (Tempo Real)</h2>
          <span className="text-[10px] font-bold text-[var(--accent-green)] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></span> ONLINE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                {['Hora', 'Usuário', 'Item', 'Ação', 'Qtd', 'Risco'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recent20.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-[var(--text-secondary)]">{new Date(log.scanned_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                  <td className="font-semibold">{log.employee_name} <span className="text-[10px] text-[var(--text-muted)] ml-1">{log.employee_sigla}</span></td>
                  <td>{log.item_name} <br/><span className="text-[10px] font-mono text-[var(--text-muted)]">{log.item_id}</span></td>
                  <td className={`font-bold uppercase text-[10px] ${log.action === 'entrada' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>{log.action}</td>
                  <td className="font-bold">{log.quantity}</td>
                  <td><RiskBadge level={log.item_risk_level} /></td>
                </tr>
              ))}
              {recent20.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Nenhum log recente.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
