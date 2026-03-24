const fs = require('fs');
const path = require('path');

const src = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Documents', 'cmed_site_temp.csv');
const dst = process.argv[3] || path.join(__dirname, '..', 'assets', 'data', 'anvisa-base.json');

const normalizeHeader = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const text = fs.readFileSync(src, 'latin1');
const lines = text.split(/\r?\n/).filter((line) => line.trim());
const headerIndex = lines.findIndex((line) => line.includes('EAN 1') && line.includes('PRODUTO'));

if (headerIndex === -1) {
  throw new Error('Nao foi possivel localizar o cabecalho da tabela CMED.');
}

const headers = parseCsvLine(lines[headerIndex]).map((value) => normalizeHeader(value.trim()));
const records = new Map();

for (let lineIndex = headerIndex + 1; lineIndex < lines.length; lineIndex += 1) {
  const cols = parseCsvLine(lines[lineIndex]);
  if (cols.length < headers.length) continue;

  const row = headers.reduce((acc, header, index) => {
    acc[header] = (cols[index] || '').trim();
    return acc;
  }, {});

  const nome = row.produto || row.substancia;
  const apresentacao = row.apresentacao || '';
  const referencia = (row.registro || '').replace(/\D/g, '');

  if (!nome) continue;

  const eans = [row.ean_1, row.ean_2, row.ean_3]
    .map((value) => (value || '').replace(/\D/g, ''))
    .filter((value, index, all) => value && all.indexOf(value) === index);

  for (const codigo of eans) {
    if (!records.has(codigo)) {
      records.set(codigo, {
        codigo,
        nome,
        apresentacao,
        custo: 0,
        referencia,
      });
    }
  }
}

fs.writeFileSync(dst, JSON.stringify([...records.values()]));
console.log(`Registros gerados: ${records.size}`);