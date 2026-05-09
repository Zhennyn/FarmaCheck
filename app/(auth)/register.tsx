import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createClient } from '@/src/lib/supabase';

const RegisterScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), role: 'funcionario' },
        },
      });
      if (error) throw error;
      // Trigger no Supabase cria o perfil com status='pending' automaticamente
      router.replace('/(auth)/pending' as never);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao registrar.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Após o registro, aguarde a aprovação do gerente para acessar o app.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="João da Silva"
              placeholderTextColor="#4b5563"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#4b5563"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#4b5563"
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repita a senha"
              placeholderTextColor="#4b5563"
              secureTextEntry
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              🔒 Sua conta será criada com status <Text style={{ color: '#f59e0b', fontWeight: '700' }}>pendente</Text> e precisará de aprovação do gerente antes de usar o app.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Criar conta</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 56 },
  back: { marginBottom: 24 },
  backText: { color: '#6366f1', fontSize: 15, fontWeight: '600' },
  header: { marginBottom: 24, gap: 8 },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 16,
  },
  fieldGroup: { gap: 6 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  notice: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  noticeText: { color: '#d1d5db', fontSize: 13, lineHeight: 20 },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});

export default RegisterScreen;
