import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';

interface PendingUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const UserApproval = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [rejectionInput, setRejectionInput] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setDbError(null);
    const supabase = createClient();
    const query = supabase
      .from('profiles')
      .select('id, name, email, role, status, created_at, rejection_reason')
      .order('created_at', { ascending: false });

    if (filter === 'pending') query.eq('status', 'pending');

    const { data, error } = await query;
    if (error) {
      console.error('Fetch users error:', error);
      setDbError(error.message);
    } else if (data) {
      setUsers(data as PendingUser[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchUsers();

    const supabase = createClient();
    const channel = supabase
      .channel('user_approval_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setProcessing(userId);
    try {
      const supabase = createClient();
      const payload: Record<string, string> = { status };
      if (status === 'rejected') {
        payload.rejection_reason = rejectionInput[userId] ?? 'Acesso negado pelo gerente.';
      }
      await supabase.from('profiles').update(payload).eq('id', userId);
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Aprovação de Usuários</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            Gerencie o acesso dos funcionários ao app
          </p>
        </div>
        {pendingCount > 0 && (
          <span style={{
            background: '#f59e0b', color: '#000', borderRadius: 999,
            padding: '4px 12px', fontSize: 13, fontWeight: 700, marginLeft: 'auto',
          }}>
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: filter === f ? '#6366f1' : 'transparent',
              borderColor: filter === f ? '#6366f1' : '#374151',
              color: filter === f ? '#fff' : '#9ca3af',
            }}
          >
            {f === 'pending' ? '⏳ Pendentes' : '📋 Todos'}
          </button>
        ))}
        <button
          onClick={() => { setLoading(true); fetchUsers(); }}
          style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 13,
            cursor: 'pointer', border: '1px solid #374151',
            background: 'transparent', color: '#9ca3af', marginLeft: 'auto',
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Table */}
      {dbError ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: 20, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', marginBottom: 20 }}>
          <strong>Erro no Banco de Dados:</strong> {dbError}<br/>
          <span style={{ fontSize: 13, marginTop: 10, display: 'block', color: '#9ca3af' }}>Isso geralmente significa que as colunas no Supabase não foram criadas ou a política de segurança está bloqueando.</span>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>Carregando...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4b5563', padding: 60, fontSize: 15 }}>
          {filter === 'pending' ? '✅ Nenhum usuário pendente' : 'Nenhum usuário encontrado'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map((user) => (
            <div key={user.id} style={{
              background: '#111827', borderRadius: 14, padding: 20,
              border: '1px solid', borderColor: user.status === 'pending' ? 'rgba(245,158,11,0.3)' : '#1f2937',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>👤</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</span>
                    <span style={{
                      background: statusColors[user.status] + '22',
                      color: statusColors[user.status],
                      borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                      border: `1px solid ${statusColors[user.status]}44`,
                    }}>
                      {statusLabels[user.status]}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                    <span>📧 {user.email ?? '—'}</span>
                    <span>🏷️ {user.role}</span>
                    <span>📅 {formatDate(user.created_at)}</span>
                  </div>
                  {user.status === 'rejected' && user.rejection_reason && (
                    <div style={{
                      marginTop: 10, padding: 10, background: 'rgba(239,68,68,0.08)',
                      borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                      <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>Motivo: </span>
                      <span style={{ color: '#fca5a5', fontSize: 13 }}>{user.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {user.status === 'pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                    <input
                      placeholder="Motivo da rejeição (opcional)"
                      value={rejectionInput[user.id] ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRejectionInput((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      style={{
                        background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
                        padding: '8px 12px', color: '#fff', fontSize: 13, width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => updateStatus(user.id, 'approved')}
                        disabled={processing === user.id}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                          background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', opacity: processing === user.id ? 0.6 : 1,
                        }}
                      >
                        ✅ Aprovar
                      </button>
                      <button
                        onClick={() => updateStatus(user.id, 'rejected')}
                        disabled={processing === user.id}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                          background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', opacity: processing === user.id ? 0.6 : 1,
                        }}
                      >
                        ❌ Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;
