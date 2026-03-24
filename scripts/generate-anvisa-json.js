const fs = require('fs');
const path = require('path');

const src = path.join(process.env.USERPROFILE || '', 'Documents', 'TA_PRODUTO_SAUDE_SITE.csv');
const dst = path.join(__dirname, '..', 'assets', 'data', 'anvisa-base.json');

const text = fs.readFileSync(src, 'latin1');
const lines = text.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  throw new Error('CSV sem dados suficientes.');
}

const headers = lines[0].split(';').map((value) => value.trim());
const getIndex = (name) => headers.indexOf(name);

const idxRegistro = getIndex('NUMERO_REGISTRO_CADASTRO');
const idxProcesso = getIndex('NUMERO_PROCESSO');
const idxNomeTecnico = getIndex('NOME_TECNICO');
const idxClasse = getIndex('CLASSE_RISCO');
const idxNomeComercial = getIndex('NOME_COMERCIAL');

const registros = new Map();
for (let i = 1; i < lines.length; i += 1) {
  const cols = lines[i].split(';');
  const codigo = String(cols[idxRegistro] || '').replace(/\D/g, '');
  if (!codigo) continue;

  const nome = String(cols[idxNomeComercial] || cols[idxNomeTecnico] || '').trim();
  if (!nome) continue;

  const nomeTecnico = String(cols[idxNomeTecnico] || '').trim();
  const classe = String(cols[idxClasse] || '').trim();
  const referencia = String(cols[idxProcesso] || '').replace(/\D/g, '');
  const apresentacao = [classe ? `Classe ${classe}` : '', nomeTecnico && nomeTecnico !== nome ? nomeTecnico : '']
    .filter(Boolean)
    .join(' | ');

  if (!registros.has(codigo)) {
    registros.set(codigo, {
      codigo,
      nome,
      apresentacao,
      custo: 0,
      referencia,
    });
  }
}

fs.writeFileSync(dst, JSON.stringify([...registros.values()]));
console.log(`Registros gerados: ${registros.size}`);
