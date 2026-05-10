-- Migration: add columns to profiles, RPCs, and view

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sigla text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regional text;

CREATE OR REPLACE FUNCTION get_orphan_items()
RETURNS TABLE (
  id uuid, barcode text, name text, category text,
  quantity int, expiry_date date, risk_level text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT i.id, i.barcode, i.name, i.category, i.quantity, i.expiry_date, i.risk_level, i.created_at
  FROM items i
  WHERE NOT EXISTS (
    SELECT 1 FROM scan_logs sl
    INNER JOIN profiles p ON p.id = sl.employee_id
    WHERE sl.item_id = i.id
  );
$$;

CREATE OR REPLACE FUNCTION get_duplicate_items()
RETURNS TABLE (
  id uuid, barcode text, name text, category text,
  quantity int, expiry_date date, risk_level text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT i.id, i.barcode, i.name, i.category, i.quantity, i.expiry_date, i.risk_level, i.created_at
  FROM items i
  WHERE i.barcode IN (SELECT barcode FROM items GROUP BY barcode HAVING COUNT(*) > 1)
  ORDER BY i.barcode, i.created_at DESC;
$$;

CREATE OR REPLACE VIEW daily_stats AS
SELECT
  (SELECT COUNT(*) FROM scan_logs WHERE scanned_at >= CURRENT_DATE) AS total_today,
  (SELECT COUNT(*) FROM items WHERE risk_level = 'critical') AS critical_items,
  (SELECT COUNT(DISTINCT employee_id) FROM scan_logs WHERE scanned_at >= CURRENT_DATE) AS active_employees,
  (SELECT COUNT(*) FROM scan_logs WHERE synced = false) AS pending_sync;

GRANT EXECUTE ON FUNCTION get_orphan_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_duplicate_items() TO authenticated;
GRANT SELECT ON daily_stats TO authenticated;
