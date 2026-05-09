import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createClient } from '@/src/lib/supabase';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      // useAuthGuard no _layout redireciona automaticamente
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao fazer login.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logo}>💊</Text>
          <Text style={styles.appName}>FarmaCheck</Text>
          <Text style={styles.subtitle}>Gestão de validades farmacêuticas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>

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
              placeholder="••••••••"
              placeholderTextColor="#4b5563"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/register' as never)}>
            <Text style={styles.linkText}>Não tem conta? <Text style={styles.linkHighlight}>Registrar-se</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 56 },
  appName: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 16,
  },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
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
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', paddingVertical: 4 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkHighlight: { color: '#6366f1', fontWeight: '700' },
});

export default LoginScreen;
