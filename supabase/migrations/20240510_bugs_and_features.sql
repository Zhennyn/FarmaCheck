-- BUG 4: ON DELETE CASCADE for scan_logs.employee_id
-- BUG 6: add drugstore_number and regional to profiles

-- Step 1: add columns if missing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS drugstore_number text,
  ADD COLUMN IF NOT EXISTS regional text;

-- Step 2: fix employee_id FK with CASCADE
ALTER TABLE scan_logs
  DROP CONSTRAINT IF EXISTS scan_logs_employee_id_fkey;

ALTER TABLE scan_logs
  ADD CONSTRAINT scan_logs_employee_id_fkey
  FOREIGN KEY (employee_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- FEATURE: items.item_id FK in scan_logs already CASCADE per schema.sql
-- ensure it is still SET NULL so items without logs can exist
ALTER TABLE scan_logs
  DROP CONSTRAINT IF EXISTS scan_logs_item_id_fkey;

ALTER TABLE scan_logs
  ADD CONSTRAINT scan_logs_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE SET NULL;

-- FEATURE: RPC get_orphan_items
CREATE OR REPLACE FUNCTION get_orphan_items()
RETURNS TABLE (
  id uuid,
  barcode text,
  name text,
  category text,
  quantity int,
  expiry_date date,
  risk_level text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    i.id,
    i.barcode,
    i.name,
    i.category,
    i.quantity,
    i.expiry_date,
    i.risk_level,
    i.created_at
  FROM items i
  WHERE NOT EXISTS (
    SELECT 1
    FROM scan_logs sl
    INNER JOIN profiles p ON p.id = sl.employee_id
    WHERE sl.item_id = i.id
  );
$$;

-- FEATURE: RPC get_duplicate_items
CREATE OR REPLACE FUNCTION get_duplicate_items()
RETURNS TABLE (
  id uuid,
  barcode text,
  name text,
  category text,
  quantity int,
  expiry_date date,
  risk_level text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    i.id,
    i.barcode,
    i.name,
    i.category,
    i.quantity,
    i.expiry_date,
    i.risk_level,
    i.created_at
  FROM items i
  WHERE i.barcode IN (
    SELECT barcode FROM items GROUP BY barcode HAVING COUNT(*) > 1
  )
  ORDER BY i.barcode, i.created_at DESC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_orphan_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_duplicate_items() TO authenticated;
