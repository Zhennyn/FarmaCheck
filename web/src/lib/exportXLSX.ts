import * as XLSX from 'xlsx';
import { EnrichedLog } from '../hooks/useRealtimeLogs';

const COLUMNS = [
  { key: 'date',             label: 'Data' },
  { key: 'time',             label: 'Hora' },
  { key: 'employee_name',    label: 'Funcionário' },
  { key: 'employee_number',  label: 'Nº Drogaria' },
  { key: 'employee_regional',label: 'Regional' },
  { key: 'item_name',        label: 'Item' },
  { key: 'barcode',          label: 'Código de Barras' },
  { key: 'item_category',    label: 'Categoria' },
  { key: 'item_quantity',    label: 'Quantidade' },
  { key: 'action',           label: 'Ação' },
  { key: 'item_risk_level',  label: 'Risco' },
  { key: 'item_expiry_date', label: 'Validade' },
];

export const exportLogsToXLSX = (logs: EnrichedLog[], filename = 'relatorio_farmacheck'): void => {
  const rows = logs.map((log) => {
    const dt = new Date(log.scanned_at);
    return {
      date: dt.toLocaleDateString('pt-BR'),
      time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      employee_name: log.employee_name,
      employee_number: log.employee_number ?? '',
      employee_regional: log.employee_regional ?? '',
      item_name: log.item_name,
      barcode: log.item_id,
      item_category: log.item_category,
      item_quantity: log.item_quantity,
      action: log.action,
      item_risk_level: log.item_risk_level,
      item_expiry_date: log.item_expiry_date
        ? new Date(log.item_expiry_date).toLocaleDateString('pt-BR')
        : '',
    };
  });

  const headers = COLUMNS.map((c) => c.label);
  const data = rows.map((r) =>
    COLUMNS.map((c) => (r as Record<string, string | number>)[c.key] ?? '')
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  const colWidth = 20;
  worksheet['!cols'] = COLUMNS.map(() => ({ wch: colWidth }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${date}.xlsx`);
};
