import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';

interface OrphanItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string | null;
  risk_level: string;
  created_at: string;
}

interface ScanLogDetail {
  id: string;
  employee_id: string | null;
  scanned_at: string;
  action: string;
  quantity: number;
}

type Tab = 'orphans' | 'duplicates';

const CELL: React.CSSProperties = { padding: '12px 16px', fontSize: 13 };
const TAG = (color: string, bg: string, label: string) => (
  <span style={{ background: bg, color, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
    {label}
  </span>
);

const OrphanItemsManager: React.FC = () => {
  const [tab, setTab] = useState<Tab>('orphans');
  const [orphans, setOrphans] = useState<OrphanItem[]>([]);
  const [duplicates, setDuplicates] = useState<OrphanItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<OrphanItem | null>(null);
  const [detailLogs, setDetailLogs] = useState<ScanLogDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [{ data: o, error: oe }, { data: d, error: de }] = await Promise.all([
        supabase.rpc('get_orphan_items'),
        supabase.rpc('get_duplicate_items'),
      ]);
      if (oe) throw new Error(oe.message);
      if (de) throw new Error(de.message);
      setOrphans((o ?? []) as OrphanItem[]);
      setDuplicates((d ?? []) as OrphanItem[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentList: OrphanItem[] = tab === 'orphans' ? orphans : duplicates;

  const duplicateGroups = useMemo<Map<string, OrphanItem[]>>(() => {
    const map = new Map<string, OrphanItem[]>();
    for (const item of duplicates) {
      const group = map.get(item.barcode) ?? [];
      group.push(item);
      map.set(item.barcode, group);
    }
    return map;
  }, [duplicates]);

  const oldestInGroup = (barcode: string): string | null => {
    const group = duplicateGroups.get(barcode) ?? [];
    if (group.length === 0) return null;
    return group.reduce((oldest, cur) =>
      cur.created_at < oldest.created_at ? cur : oldest
    ).id;
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === currentList.length
        ? new Set()
        : new Set(currentList.map((i) => i.id))
    );
  };

  const deleteIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Deletar ${ids.length} item(ns)? Esta ação é irreversível.`)) return;
    setActionLoading(true);
    try {
      const { error: err } = await supabase.from('items').delete().in('id', ids);
      if (err) throw new Error(err.message);
      await fetchData();
      setSelected(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar.');
    } finally {
      setActionLoading(false);
    }
  }, [fetchData]);

  const deleteSelected = () => deleteIds(Array.from(selected));
  const deleteAllOrphans = () => deleteIds(orphans.map((o) => o.id));

  const keepNewestDeleteRest = useCallback(async () => {
    if (!window.confirm('Manter o item mais recente de cada grupo e deletar os demais?')) return;
    setActionLoading(true);
    try {
      const toDelete: string[] = [];
      for (const [, group] of duplicateGroups) {
        const sorted = [...group].sort((a, b) =>
          b.created_at.localeCompare(a.created_at)
        );
        toDelete.push(...sorted.slice(1).map((i) => i.id));
      }
      if (toDelete.length > 0) {
        const { error: err } = await supabase.from('items').delete().in('id', toDelete);
        if (err) throw new Error(err.message);
      }
      await fetchData();
      setSelected(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao limpar duplicatas.');
    } finally {
      setActionLoading(false);
    }
  }, [duplicateGroups, fetchData]);

  const openDetail = useCallback(async (item: OrphanItem) => {
    setDetailItem(item);
    setDetailLogs([]);
    setDetailLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('scan_logs')
        .select('id, employee_id, scanned_at, action, quantity')
        .eq('item_id', item.id)
        .order('scanned_at', { ascending: false });
      if (err) throw new Error(err.message);
      setDetailLogs((data ?? []) as ScanLogDetail[]);
    } catch (err: unknown) {
      setDetailLogs([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '10px 24px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    background: tab === t ? '#1a1a2e' : 'transparent',
    color: tab === t ? '#6366f1' : '#9ca3af',
    borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
  });

  const rowBg = (item: OrphanItem): React.CSSProperties => {
    if (tab === 'orphans') return { background: 'rgba(239,68,68,0.07)' };
    if (oldestInGroup(item.barcode) === item.id) return { background: 'rgba(234,179,8,0.1)' };
    return { background: 'rgba(234,179,8,0.04)' };
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Gerenciador de Itens</h2>
        <button
          onClick={fetchData}
          disabled={loadingData}
          style={{ background: '#374151', color: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          {loadingData ? 'Carregando...' : '↺ Recarregar'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #27273a', marginBottom: 24 }}>
        <button style={tabStyle('orphans')} onClick={() => { setTab('orphans'); setSelected(new Set()); }}>
          Órfãos ({orphans.length})
        </button>
        <button style={tabStyle('duplicates')} onClick={() => { setTab('duplicates'); setSelected(new Set()); }}>
          Duplicados ({duplicates.length})
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={actionLoading}
            style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Deletar selecionados ({selected.size})
          </button>
        )}
        {tab === 'orphans' && orphans.length > 0 && (
          <button
            onClick={deleteAllOrphans}
            disabled={actionLoading}
            style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Deletar todos os órfãos ({orphans.length})
          </button>
        )}
        {tab === 'duplicates' && duplicates.length > 0 && (
          <button
            onClick={keepNewestDeleteRest}
            disabled={actionLoading}
            style={{ background: '#713f12', color: '#fde68a', border: '1px solid #92400e', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Manter mais recente e deletar duplicatas
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #27273a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #27273a' }}>
              <th style={{ ...CELL, width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.size === currentList.length && currentList.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ ...CELL, textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>ID</th>
              <th style={{ ...CELL, textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Nome</th>
              <th style={{ ...CELL, textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Cód. Barras</th>
              <th style={{ ...CELL, textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>Qtd</th>
              <th style={{ ...CELL, textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Motivo</th>
              <th style={{ ...CELL, textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentList.length === 0 && !loadingData && (
              <tr>
                <td colSpan={7} style={{ ...CELL, textAlign: 'center', color: '#6b7280', padding: 40 }}>
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
            {currentList.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1f2937', ...rowBg(item) }}>
                <td style={CELL}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td style={{ ...CELL, fontFamily: 'monospace', color: '#9ca3af' }}>
                  {item.id.substring(0, 8)}
                </td>
                <td style={{ ...CELL, fontWeight: 600 }}>{item.name}</td>
                <td style={{ ...CELL, fontFamily: 'monospace' }}>{item.barcode}</td>
                <td style={{ ...CELL, textAlign: 'center' }}>{item.quantity}</td>
                <td style={CELL}>
                  {tab === 'orphans'
                    ? TAG('#f87171', 'rgba(239,68,68,0.15)', 'Usuário inexistente')
                    : oldestInGroup(item.barcode) === item.id
                      ? TAG('#fbbf24', 'rgba(234,179,8,0.15)', 'Duplicado (manter)')
                      : TAG('#fde68a', 'rgba(234,179,8,0.08)', 'Duplicado')}
                </td>
                <td style={{ ...CELL, textAlign: 'center' }}>
                  <button
                    onClick={() => openDetail(item)}
                    style={{ background: '#1e3a5f', color: '#93c5fd', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null); }}
        >
          <div style={{ background: '#13131f', borderRadius: 20, padding: 32, width: '90%', maxWidth: 640, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #27273a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Detalhes do Item</h3>
              <button onClick={() => setDetailItem(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 24 }}>
              {([
                ['Nome', detailItem.name],
                ['Categoria', detailItem.category],
                ['Cód. Barras', detailItem.barcode],
                ['Quantidade', String(detailItem.quantity)],
                ['Risco', detailItem.risk_level],
                ['Validade', detailItem.expiry_date ?? 'N/D'],
                ['Criado em', new Date(detailItem.created_at).toLocaleString('pt-BR')],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <dt style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>{label}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
                </div>
              ))}
            </dl>

            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#9ca3af' }}>Histórico de Scan Logs</h4>
            {detailLoading ? (
              <p style={{ color: '#6b7280' }}>Carregando...</p>
            ) : detailLogs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum scan log associado.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27273a' }}>
                    {['Data/Hora', 'Ação', 'Qtd', 'Employee ID'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '8px 10px' }}>{new Date(log.scanned_at).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: log.action === 'entrada' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{log.quantity}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#6b7280' }}>
                        {log.employee_id ? log.employee_id.substring(0, 8) + '…' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              onClick={() => deleteIds([detailItem.id]).then(() => setDetailItem(null))}
              disabled={actionLoading}
              style={{ marginTop: 24, background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Deletar este item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrphanItemsManager;
