import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '../lib/supabase';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ExpiringItem {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  risk_level: RiskLevel;
  daysLeft: number;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low'];

const daysBetween = (dateStr: string): number => {
  const expiry = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const DaysBadge = ({ days }: { days: number }) => {
  const bg = days <= 7 ? '#ef4444' : days <= 15 ? '#eab308' : '#374151';
  const text = days <= 0 ? 'Vencido' : `${days}d`;
  return (
    <span style={{ background: bg, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
      {text}
    </span>
  );
};

const ExpiryAlert = () => {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + 30);
        const horizonStr = horizon.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('items')
          .select('id, name, category, expiry_date, risk_level')
          .not('expiry_date', 'is', null)
          .lte('expiry_date', horizonStr)
          .order('expiry_date', { ascending: true });

        if (error || !data) return;

        setItems(
          data.map((row: { id: string; name: string; category: string; expiry_date: string; risk_level: string }) => ({
            ...row,
            risk_level: row.risk_level as RiskLevel,
            daysLeft: daysBetween(row.expiry_date),
          }))
        );
      } catch (error: unknown) {
        console.error('ExpiryAlert load error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<RiskLevel, ExpiringItem[]> = { critical: [], high: [], medium: [], low: [] };
    items.forEach((item) => { map[item.risk_level].push(item); });
    return map;
  }, [items]);

  return (
    <div style={{ background: '#0d0d1a', minHeight: '100vh', padding: '32px 40px', fontFamily: 'Inter, sans-serif', color: '#ffffff' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Alertas de Validade</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Itens com vencimento nos próximos 30 dias</p>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Carregando...</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Nenhum item próximo do vencimento.</p>
      ) : (
        RISK_ORDER.map((level) => {
          const group = grouped[level];
          if (group.length === 0) return null;
          return (
            <div key={level} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: RISK_COLORS[level] }} />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: RISK_COLORS[level], textTransform: 'uppercase', letterSpacing: 1 }}>
                  {level} · {group.length} item(s)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.map((item) => (
                  <div key={item.id} style={{
                    background: '#1a1a2e',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: `3px solid ${RISK_COLORS[level]}`,
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#e5e7eb' }}>{item.name}</p>
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{item.category} · Vence em {item.expiry_date}</p>
                    </div>
                    <DaysBadge days={item.daysLeft} />
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ExpiryAlert;
