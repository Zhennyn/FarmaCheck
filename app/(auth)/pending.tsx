import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { createClient } from '@/src/lib/supabase';

const PendingScreen = () => {
  const [status, setStatus] = useState<'pending' | 'rejected' | 'loading'>('loading');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from('profiles')
          .select('status, rejection_reason')
          .eq('id', session.user.id)
          .single();

        setStatus((data?.status as 'pending' | 'rejected') ?? 'pending');
        setRejectionReason(data?.rejection_reason ?? null);
      } catch (error: unknown) {
        console.error('PendingScreen fetch error:', error);
      }
    };

    fetchStatus();

    // Realtime: auto-redirect quando aprovado
    const channel = supabase
      .channel('profile_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        const updated = payload.new as { status: string; rejection_reason: string | null };
        if (updated.status === 'approved') {
          // useAuthGuard no _layout vai redirecionar para (tabs)
          supabase.auth.refreshSession();
        } else {
          setStatus(updated.status as 'pending' | 'rejected');
          setRejectionReason(updated.rejection_reason ?? null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'rejected' ? (
          <>
            <Text style={styles.iconRejected}>❌</Text>
            <Text style={styles.title}>Acesso negado</Text>
            <Text style={styles.subtitle}>
              Sua solicitação foi recusada pelo gerente.
            </Text>
            {rejectionReason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Motivo:</Text>
                <Text style={styles.reasonText}>{rejectionReason}</Text>
              </View>
            )}
            <Text style={styles.hint}>
              Entre em contato com o gerente da farmácia para mais informações.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.iconPending}>⏳</Text>
            <Text style={styles.title}>Aguardando aprovação</Text>
            <Text style={styles.subtitle}>
              Sua conta foi criada com sucesso! O gerente precisa aprovar seu acesso antes de você usar o app.
            </Text>
            <View style={styles.stepsBox}>
              <StepItem done icon="✅" text="Conta criada" />
              <StepItem done={false} icon="⏳" text="Aguardando aprovação do gerente" />
              <StepItem done={false} icon="🚀" text="Acesso liberado" />
            </View>
            <Text style={styles.hint}>
              Esta tela atualizará automaticamente quando você for aprovado.
            </Text>
          </>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepItem = ({ done, icon, text }: { done: boolean; icon: string; text: string }) => (
  <View style={stepStyles.row}>
    <Text style={stepStyles.icon}>{icon}</Text>
    <Text style={[stepStyles.text, done && stepStyles.textDone]}>{text}</Text>
  </View>
);

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  icon: { fontSize: 18 },
  text: { color: '#6b7280', fontSize: 14, flex: 1 },
  textDone: { color: '#22c55e', fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  iconPending: { fontSize: 52 },
  iconRejected: { fontSize: 52 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  stepsBox: {
    alignSelf: 'stretch',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  reasonBox: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    gap: 4,
  },
  reasonLabel: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  reasonText: { color: '#fca5a5', fontSize: 14 },
  hint: { color: '#4b5563', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  signOutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 8,
  },
  signOutText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
});

export default PendingScreen;
