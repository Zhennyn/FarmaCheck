import { useState, useCallback } from 'react';
import { BarcodeScanningResult } from 'expo-camera';
import { createClient } from '@/src/lib/supabase';
import { getItemByBarcode, insertItem, LocalItem } from '@/src/database/db';

interface ScannerState {
  scanned: boolean;
  scanning: boolean;
  currentItem: LocalItem | null;
  handleScan: (result: BarcodeScanningResult) => Promise<void>;
  reset: () => void;
}

const useScanner = (): ScannerState => {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [currentItem, setCurrentItem] = useState<LocalItem | null>(null);

  const handleScan = useCallback(async (result: BarcodeScanningResult): Promise<void> => {
    if (scanned || scanning) return;
    setScanning(true);

    try {
      const barcode = result.data;
      let item = await getItemByBarcode(barcode);

      if (!item) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('barcode', barcode)
          .single();

        if (error || !data) {
          setCurrentItem(null);
          setScanned(true);
          return;
        }

        const remote: LocalItem = {
          id: data.id,
          barcode: data.barcode,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          expiry_date: data.expiry_date ?? null,
          risk_level: data.risk_level,
          created_at: data.created_at,
          synced: 1,
        };

        await insertItem(remote);
        item = remote;
      }

      setCurrentItem(item);
      setScanned(true);
    } catch (error: unknown) {
      console.error('Scanner error:', error);
    } finally {
      setScanning(false);
    }
  }, [scanned, scanning]);

  const reset = useCallback(() => {
    setScanned(false);
    setCurrentItem(null);
  }, []);

  return { scanned, scanning, currentItem, handleScan, reset };
};

export default useScanner;
