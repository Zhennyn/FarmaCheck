import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { v4 as uuidv4 } from 'uuid';
import useScanner from '@/src/hooks/useScanner';
import useAuth from '@/src/hooks/useAuth';
import { insertScanLog } from '@/src/database/db';
import { useState } from 'react';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type Action = 'entrada' | 'saida';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const ScanScreen = () => {
  const { user } = useAuth();
  const { scanned, scanning, currentItem, handleScan, reset } = useScanner();
  const [permission, requestPermission] = useCameraPermissions();
  const [quantity, setQuantity] = useState('1');
  const [action, setAction] = useState<Action>('entrada');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleConfirm = async () => {
    if (!currentItem || !user) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }
    setSaving(true);
    try {
      await insertScanLog({
        id: uuidv4(),
        item_id: currentItem.id,
        employee_id: user.id,
        scanned_at: new Date().toISOString(),
        action,
        quantity: qty,
      });
      Alert.alert('Sucesso', 'Registro salvo.', [{ text: 'OK', onPress: reset }]);
      setQuantity('1');
    } catch (error: unknown) {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={styles.errorText}>Permissão de câmera negada.</Text></View>;

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={async (result: BarcodeScanningResult) => handleScan(result)}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39'] }}
            style={StyleSheet.absoluteFillObject}
          />
          {scanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.scanningText}>Buscando item...</Text>
            </View>
          )}
          <View style={styles.scanFrame} />
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {currentItem ? (
            <>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[currentItem.risk_level as RiskLevel] }]}>
                <Text style={styles.riskBadgeText}>{currentItem.risk_level.toUpperCase()}</Text>
              </View>
              <Text style={styles.itemName}>{currentItem.name}</Text>
              <Text style={styles.itemMeta}>{currentItem.category}</Text>
              {currentItem.expiry_date && (
                <Text style={styles.itemMeta}>Validade: {currentItem.expiry_date}</Text>
              )}
              <View style={styles.actionRow}>
                {(['entrada', 'saida'] as Action[]).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.actionButton, action === a && styles.actionButtonActive]}
                    onPress={() => setAction(a)}
                  >
                    <Text style={[styles.actionButtonText, action === a && styles.actionButtonTextActive]}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Quantidade"
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity style={[styles.confirmButton, saving && styles.disabledBtn]} onPress={handleConfirm} disabled={saving}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.confirmButtonText}>Confirmar Registro</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={reset}>
                <Text style={styles.resetButtonText}>Bipar outro</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.errorText}>Item não encontrado.</Text>
              <TouchableOpacity style={styles.resetButton} onPress={reset}>
                <Text style={styles.resetButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  cameraContainer: { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 240, borderWidth: 2, borderColor: '#6366f1', borderRadius: 12 },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  scanningText: { color: '#ffffff', fontSize: 16 },
  resultContainer: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  riskBadgeText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  itemName: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  itemMeta: { color: '#9ca3af', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  actionButtonActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  actionButtonText: { color: '#9ca3af', fontWeight: '600' },
  actionButtonTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#1f2937', color: '#ffffff', borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#374151' },
  confirmButton: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  confirmButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  resetButton: { alignItems: 'center', paddingVertical: 12 },
  resetButtonText: { color: '#6366f1', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center' },
});

export default ScanScreen;
