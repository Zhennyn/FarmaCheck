import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getRecentLogs } from '@/src/database/db';

type Action = 'entrada' | 'saida' | 'all';

interface LogRow {
  id: string;
  item_id: string;
  employee_id: string;
  scanned_at: string;
  action: 'entrada' | 'saida';
  quantity: number;
  synced: number;
  item_name: string;
  item_category: string;
  item_risk_level: string;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const HistoryScreen = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filtered, setFiltered] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<Action>('all');
  const [dateFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await getRecentLogs(50);
        setLogs(rows as LogRow[]);
        setFiltered(rows as LogRow[]);
      } catch (error: unknown) {
        console.error('HistoryScreen load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = logs;
    if (actionFilter !== 'all') {
      result = result.filter((l) => l.action === actionFilter);
    }
    if (dateFilter.trim()) {
      result = result.filter((l) => l.scanned_at.startsWith(dateFilter.trim()));
    }
    setFiltered(result);
  }, [actionFilter, dateFilter, logs]);

  const renderItem = ({ item }: { item: LogRow }) => (
    <View style={styles.logRow}>
      <View style={styles.logHeader}>
        <Text style={styles.logItemName}>{item.item_name}</Text>
        <View style={[styles.syncDot, { backgroundColor: item.synced === 1 ? '#3b82f6' : '#6b7280' }]} />
      </View>
      <Text style={styles.logMeta}>{item.item_category} · {item.item_risk_level.toUpperCase()}</Text>
      <View style={styles.logFooter}>
        <View style={[styles.actionBadge, item.action === 'entrada' ? styles.entradaBadge : styles.saidaBadge]}>
          <Text style={styles.actionBadgeText}>{item.action}</Text>
        </View>
        <Text style={styles.logQty}>Qtd: {item.quantity}</Text>
        <Text style={styles.logDate}>{formatDate(item.scanned_at)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Bipagens</Text>

      <View style={styles.filterRow}>
        {(['all', 'entrada', 'saida'] as Action[]).map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.filterChip, actionFilter === a && styles.filterChipActive]}
            onPress={() => setActionFilter(a)}
          >
            <Text style={[styles.filterChipText, actionFilter === a && styles.filterChipTextActive]}>
              {a === 'all' ? 'Todos' : a.charAt(0).toUpperCase() + a.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum registro encontrado.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', paddingTop: 56 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#374151' },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  logRow: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, gap: 6 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logItemName: { color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1 },
  syncDot: { width: 10, height: 10, borderRadius: 5 },
  logMeta: { color: '#9ca3af', fontSize: 13 },
  logFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  entradaBadge: { backgroundColor: '#166534' },
  saidaBadge: { backgroundColor: '#7f1d1d' },
  actionBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  logQty: { color: '#d1d5db', fontSize: 13 },
  logDate: { color: '#6b7280', fontSize: 12, marginLeft: 'auto' },
  emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 40, fontSize: 15 },
});

export default HistoryScreen;
