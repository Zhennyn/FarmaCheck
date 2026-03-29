/* Smoke test for manual internal base import mapping logic. */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const normalizarTextoMedida = (valor = '') =>
  String(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const parseNumeroMedida = (valor) => {
  const texto = String(valor || '').replace(',', '.');
  const numero = parseFloat(texto);
  return Number.isFinite(numero) ? numero : 0;
};

const inferirMedidaDaApresentacao = (apresentacao) => {
  const texto = normalizarTextoMedida(apresentacao);
  if (!texto) return { unidade_medida: 'unidades', quantidade_medida: 0 };

  const matchMl = texto.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (matchMl) return { unidade_medida: 'ml', quantidade_medida: parseNumeroMedida(matchMl[1]) };

  const matchGramas = texto.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
  if (matchGramas) return { unidade_medida: 'g', quantidade_medida: parseNumeroMedida(matchGramas[1]) };

  const matchGotas = texto.match(/(\d+(?:[.,]\d+)?)\s*gotas?\b/);
  if (matchGotas) return { unidade_medida: 'gotas', quantidade_medida: parseNumeroMedida(matchGotas[1]) };

  return { unidade_medida: 'unidades', quantidade_medida: 0 };
};

const inferirTipoEmbalagem = (apresentacao) => {
  const texto = normalizarTextoMedida(apresentacao);
  if (!texto) return null;

  if (/\b(amp|ampola|ampolas|fa)\b/.test(texto)) return 'ampola';
  if (/\b(env|envelope|envelopes|sache|saches|saqueta|saquetas)\b/.test(texto)) return 'envelope';
  if (/\b(bisnaga|bisnagas|tubo|tubos|pomada|creme|gel)\b/.test(texto)) return 'bisnaga';
  if (/\b(spray|sprayes|aerossol|aerosol)\b/.test(texto)) return 'spray';
  if (/\b(frasco|frascos|fras)\b/.test(texto)) return 'frasco';

  return null;
};

const normalizarCabecalho = (valor) =>
  String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const obterValorPorCabecalho = (registro, aliases) => {
  for (const alias of aliases) {
    if (registro[alias]) return registro[alias];
  }
  return '';
};

const normalizarCodigoImportado = (valor) => {
  const texto = String(valor || '').replace(/^\uFEFF/, '').trim();
  if (!texto) return '';
  if (/^\d+\.0+$/.test(texto)) return texto.replace(/\.0+$/, '');
  return texto;
};

const detectarSeparador = (linha) => {
  const qtdPontoVirgula = (linha.match(/;/g) || []).length;
  const qtdVirgula = (linha.match(/,/g) || []).length;
  return qtdPontoVirgula >= qtdVirgula ? ';' : ',';
};

const parseLinhaDelimitada = (linha, separador) => {
  const colunas = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const caractere = linha[i];
    const proximo = linha[i + 1];

    if (caractere === '"') {
      if (dentroDeAspas && proximo === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if (caractere === separador && !dentroDeAspas) {
      colunas.push(atual.trim());
      atual = '';
      continue;
    }

    atual += caractere;
  }

  colunas.push(atual.trim());
  return colunas;
};

const lerPlanilhaComoLinhas = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.xlsx') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const primeiraAba = workbook.worksheets[0];
    if (!primeiraAba) return [];

    const linhas = [];
    primeiraAba.eachRow({ includeEmpty: false }, (linha) => {
      const totalColunas = Math.max(linha.cellCount, linha.actualCellCount || 0);
      const colunas = Array.from({ length: totalColunas }, (_, indice) => linha.getCell(indice + 1).text.trim());
      if (colunas.some(Boolean)) {
        linhas.push(colunas);
      }
    });

    return linhas;
  }

  if (ext === '.xls') {
    throw new Error('Formato .xls nao suportado no teste. Use .xlsx ou .csv.');
  }

  const conteudo = fs.readFileSync(filePath, 'utf8');
  const linhasTexto = conteudo
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhasTexto.length === 0) return [];

  const separador = detectarSeparador(linhasTexto[0]);
  return linhasTexto.map((linha) => parseLinhaDelimitada(linha, separador));
};

const importarBaseInternaDeArquivo = async (filePath) => {
  const linhas = await lerPlanilhaComoLinhas(filePath);
  if (linhas.length < 2) return { ok: false, motivo: 'arquivo-sem-dados', registros: [] };

  const cabecalhos = linhas[0].map((coluna) => normalizarCabecalho(coluna));
  const arquivoAnvisa = cabecalhos.includes('numero_registro_cadastro') && cabecalhos.includes('nome_comercial');
  const mapaCadastros = new Map();

  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].map((coluna) => String(coluna || '').trim());
    if (colunas.length < 2) continue;

    const registro = cabecalhos.reduce((acc, cabecalho, index) => {
      acc[cabecalho] = colunas[index] || '';
      return acc;
    }, {});

    const codigo = normalizarCodigoImportado(
      obterValorPorCabecalho(registro, [
        'codigo_ean',
        'codigo',
        'ean',
        'gtin',
        'codigo_de_barras',
        'codigodebarras',
        'numero_registro_cadastro',
        'numero_registro',
        'registro',
        'registro_anvisa',
      ])
    );

    const nome = obterValorPorCabecalho(registro, [
      'nome',
      'descricao',
      'descricao_produto',
      'produto',
      'nome_produto',
      'nome_comercial',
      'nome_tecnico',
    ]);

    const classeRisco = obterValorPorCabecalho(registro, ['classe_risco']);
    const nomeTecnico = obterValorPorCabecalho(registro, ['nome_tecnico']);
    const apresentacao =
      obterValorPorCabecalho(registro, ['apresentacao', 'apresentacao_comercial', 'embalagem', 'descricao_apresentacao']) ||
      [classeRisco ? `Classe ${classeRisco}` : '', nomeTecnico].filter(Boolean).join(' | ');

    if (!codigo || !nome) continue;

    const numeroProcesso = obterValorPorCabecalho(registro, ['numero_processo', 'processo']);
    mapaCadastros.set(codigo, {
      codigo,
      nome,
      apresentacao,
      custo: 0,
      embalagem: inferirTipoEmbalagem(apresentacao) || undefined,
      ...inferirMedidaDaApresentacao(apresentacao),
      referencia: numeroProcesso,
    });
  }

  return {
    ok: true,
    arquivoAnvisa,
    registros: Array.from(mapaCadastros.values()),
  };
};

const assert = (condicao, mensagem) => {
  if (!condicao) {
    throw new Error(mensagem);
  }
};

const run = async () => {
  const tmpDir = path.join(__dirname, '.tmp-import-tests');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const csvPath = path.join(tmpDir, 'base-ean.csv');
  const csvConteudo = [
    'codigo_ean;nome;apresentacao;numero_processo',
    '7891000000001;Dipirona 500mg;Frasco 120 ml;PROC-001',
    '7891000000001;Dipirona 500mg Revisado;Frasco 120 ml;PROC-REV',
    ';Sem Codigo;Frasco 60 ml;PROC-IGN',
  ].join('\n');
  fs.writeFileSync(csvPath, csvConteudo, 'utf8');

  const anvisaPath = path.join(tmpDir, 'base-anvisa.csv');
  const anvisaConteudo = [
    'numero_registro_cadastro;nome_comercial;classe_risco;nome_tecnico;numero_processo',
    '1234567890123;Produto Cadastro;III;Solucao Oral 20 ml;ANV-001',
  ].join('\n');
  fs.writeFileSync(anvisaPath, anvisaConteudo, 'utf8');

  const xlsxPath = path.join(tmpDir, 'base-xlsx.xlsx');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Base');
  [
    ['ean', 'descricao', 'descricao_apresentacao', 'processo'],
    ['7892000000002', 'Produto Planilha', 'Bisnaga 20 g', 'XLS-001'],
  ].forEach((linha) => ws.addRow(linha));
  await wb.xlsx.writeFile(xlsxPath);

  const r1 = await importarBaseInternaDeArquivo(csvPath);
  assert(r1.ok, 'CSV base EAN deveria ser processado com sucesso');
  assert(r1.registros.length === 1, `Esperado 1 registro unico no CSV, obtido ${r1.registros.length}`);
  assert(r1.registros[0].nome === 'Dipirona 500mg Revisado', 'Duplicado por codigo deve manter ultimo registro');
  assert(r1.registros[0].unidade_medida === 'ml', 'Inferencia de medida ml falhou no CSV');

  const r2 = await importarBaseInternaDeArquivo(anvisaPath);
  assert(r2.ok, 'CSV ANVISA deveria ser processado com sucesso');
  assert(r2.arquivoAnvisa === true, 'Deteccao de arquivo ANVISA deveria ser true');
  assert(r2.registros.length === 1, `Esperado 1 registro ANVISA, obtido ${r2.registros.length}`);
  assert(r2.registros[0].referencia === 'ANV-001', 'Numero do processo nao foi mapeado corretamente');

  const r3 = await importarBaseInternaDeArquivo(xlsxPath);
  assert(r3.ok, 'XLSX deveria ser processado com sucesso');
  assert(r3.registros.length === 1, `Esperado 1 registro no XLSX, obtido ${r3.registros.length}`);
  assert(r3.registros[0].embalagem === 'bisnaga', 'Inferencia de embalagem no XLSX falhou');
  assert(r3.registros[0].unidade_medida === 'g', 'Inferencia de unidade g no XLSX falhou');

  console.log('PASS: importacao manual de base interna validada em CSV, ANVISA e XLSX');
};

run().catch((error) => {
  console.error('FAIL:', error.message || error);
  process.exit(1);
});
