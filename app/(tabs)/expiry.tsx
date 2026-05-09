import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function ExpiryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔔</Text>
      <Text style={styles.title}>Alertas de Validade</Text>
      <Text style={styles.subtitle}>
        O monitoramento de validades está disponível no painel web.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL('http://localhost:3000')}
      >
        <Text style={styles.btnText}>Abrir painel web →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  icon: { fontSize: 52 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
