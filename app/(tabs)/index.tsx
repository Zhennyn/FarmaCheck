import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ExcelJS from 'exceljs';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { Activity, AlertTriangle, Barcode, Bell, Camera, Check, Download, Edit, Edit2, Package, Plus, Search, Trash2, TrendingUp, Upload, User, Warehouse, X } from 'lucide-react-native';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Image, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../hooks/use-color-scheme';

type Produto = {
  id: string;
  nome: string;
  codigo: string;
  apresentacao?: string;
  embalagem?: TipoEmbalagem;
  unidade_medida?: UnidadeMedida;
  quantidade_medida?: number;
  validade: string;
  validades_adicionais?: string;
  custo: number;
  qtd: number;
  colaborador: string;
  lote?: string;
  observacao?: string;
  status_conferencia?: StatusConferencia;
};

type UnidadeMedida = 'unidades' | 'comprimidos' | 'capsulas' | 'drageas' | 'ml' | 'g' | 'gotas' | 'ampolas' | 'envelopes' | 'bisnagas' | 'frascos' | 'sprays';

type TipoEmbalagem = 'frasco' | 'bisnaga' | 'envelope' | 'spray' | 'ampola';

type StatusConferencia = 'pendente' | 'conferido' | 'resolvido';

type TipoFiltro = 'todos' | 'proximos' | 'no_prazo' | 'vencidos';
type ThemePreference = 'system' | 'light' | 'dark';

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: string;
    generic_name?: string;
    quantity?: string;
  };
};

type CadastroEan = {
  codigo: string;
  nome: string;
  apresentacao: string;
  custo: number;
  embalagem?: TipoEmbalagem;
  unidade_medida?: UnidadeMedida;
  quantidade_medida?: number;
  referencia?: string;
};

type HistoricoRegistro = {
  id: string;
  produto_id: string;
  acao: string;
  nome: string;
  codigo: string;
  colaborador: string;
  data_evento: number;
  detalhes: string;
  tipo_produto?: string;
};

type BancoDados = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;
type ColunaTabela = { name: string };
type StatusValidadeInfo = {
  tipo: 'ok' | 'markdown' | 'retirar' | 'vencido';
  label: string;
  cor: string;
  bg: string;
  border: string;
};
type ProdutoComAnalise = Produto & {
  diasAteValidade: number;
  statusValidade: StatusValidadeInfo;
  embalagemCalculada: TipoEmbalagem | null;
  totalMedidoCalculado: string | null;
};

const OPCOES_UNIDADE_MEDIDA: { valor: UnidadeMedida; label: string }[] = [
  { valor: 'unidades', label: 'Unid' },
  { valor: 'comprimidos', label: 'Comp' },
  { valor: 'capsulas', label: 'Caps' },
  { valor: 'drageas', label: 'Dragea' },
  { valor: 'ml', label: 'ML' },
  { valor: 'g', label: 'Gramas' },
  { valor: 'gotas', label: 'Gotas' },
  { valor: 'ampolas', label: 'Ampola' },
  { valor: 'envelopes', label: 'Envelope' },
  { valor: 'bisnagas', label: 'Bisnaga' },
  { valor: 'frascos', label: 'Frasco' },
  { valor: 'sprays', label: 'Spray' },
];

const ROTULOS_UNIDADE_MEDIDA: Record<UnidadeMedida, string> = {
  unidades: 'unid',
  comprimidos: 'comp',
  capsulas: 'caps',
  drageas: 'drageas',
  ml: 'ml',
  g: 'g',
  gotas: 'gotas',
  ampolas: 'ampolas',
  envelopes: 'envelopes',
  bisnagas: 'bisnagas',
  frascos: 'frascos',
  sprays: 'sprays',
};

const ROTULOS_TIPO_EMBALAGEM: Record<TipoEmbalagem, string> = {
  frasco: 'frasco',
  bisnaga: 'bisnaga',
  envelope: 'envelope',
  spray: 'spray',
  ampola: 'ampola',
};

const ROTULOS_STATUS_CONFERENCIA: Record<StatusConferencia, string> = {
  pendente: 'pendente',
  conferido: 'conferido',
  resolvido: 'resolvido',
};



const ONBOARDING_STEPS = [
  { emoji: '💊', titulo: 'Bem-vindo ao App de Validade', descricao: 'Gerencie a validade dos produtos da sua loja com facilidade. Evite perdas e mantenha a equipe sempre sincronizada.' },
  { emoji: '📷', titulo: 'Cadastre Produtos', descricao: 'Escaneie o EAN com a câmera ou pesquise na base ANVISA. Preencha a validade, quantidade e medida.' },
  { emoji: '👆', titulo: 'Deslize para Gerenciar', descricao: 'Na lista principal, deslize um produto para a esquerda para revelar os botões de editar e excluir rapidamente.' },
  { emoji: '📊', titulo: 'Relatórios e Gráficos', descricao: 'Use o menu lateral (ícone de loja) para exportar PDF e visualizar gráficos de vencimento.' },
];

const VERSAO_BASE_INTERNA = 'cmed-base-v1';
const VERSAO_APP = '1.0.4';
const CHAVE_BASE_INTERNA = '@base_interna_embutida_versao';
const CHAVE_PRIMEIRA_INSTALACAO = '@primeira_instalacao_local_v1';
const CHAVE_NOTIFICACAO_LEMBRETE = '@notificacao_lembrete_2h';
const CHAVE_ULTIMO_ALERTA_RISCO = '@notificacao_ultimo_alerta_risco';
const CHAVE_FREQUENCIA_LEMBRETE_HORAS = '@frequencia_lembrete_horas';
const CHAVE_FREQUENCIA_ALERTA_RISCO_HORAS = '@frequencia_alerta_risco_horas';
const CHAVE_AUTO_EXCLUIR_VENCIDOS = '@auto_excluir_vencidos';
const CHAVE_MODO_TEMA = '@modo_tema';
const CHAVE_MODO_ACESSIBILIDADE = '@modo_acessibilidade';
const CHAVE_LOJA = '@loja';
const CHAVE_CODIGO_LOJA = '@codigo_loja';
const CHAVE_REGIONAL = '@regional';
const CHAVE_COLABORADOR = '@colaborador';

const CHAVE_ONBOARDING_CONCLUIDO = '@onboarding_v1';

const CHAVES_CONFIGURACAO_INICIAL = [
  CHAVE_LOJA,
  CHAVE_CODIGO_LOJA,
  CHAVE_REGIONAL,
  CHAVE_COLABORADOR,
  CHAVE_FREQUENCIA_LEMBRETE_HORAS,
  CHAVE_FREQUENCIA_ALERTA_RISCO_HORAS,
  CHAVE_AUTO_EXCLUIR_VENCIDOS,
  CHAVE_MODO_TEMA,
  CHAVE_MODO_ACESSIBILIDADE,
  CHAVE_PRIMEIRA_INSTALACAO,
  CHAVE_ONBOARDING_CONCLUIDO,
] as const;

const OPCOES_FREQUENCIA_LEMBRETE_HORAS = [2, 4, 8, 12] as const;
const OPCOES_FREQUENCIA_ALERTA_RISCO_HORAS = [3, 6, 12, 24] as const;
const FREQUENCIA_LEMBRETE_PADRAO_HORAS = 4;
const FREQUENCIA_ALERTA_RISCO_PADRAO_HORAS = 12;

const INDICES_SQLITE = [
  'CREATE INDEX IF NOT EXISTS idx_produtos_validade ON produtos(validade)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_colaborador ON produtos(colaborador)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_status_conferencia ON produtos(status_conferencia)',
  'CREATE INDEX IF NOT EXISTS idx_historico_data_evento ON historico_produtos(data_evento)',
];
const TIPOS_PLANILHA = [
  'text/csv',
  'text/plain',
  'text/comma-separated-values',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
];

const ALIASES_NOME_PRODUTO = ['nome', 'produto', 'descricao', 'descricao_produto', 'nome_produto', 'item'];
const ALIASES_CODIGO_PRODUTO = ['codigo_ean', 'codigo', 'ean', 'gtin', 'codigo_de_barras', 'codigodebarras'];
const ALIASES_VALIDADE_PRODUTO = ['validade', 'data_validade', 'dt_validade', 'vencimento', 'data_vencimento'];
const ALIASES_APRESENTACAO = ['apresentacao', 'apresentacao_comercial', 'descricao_apresentacao'];
const ALIASES_QUANTIDADE = ['quantidade', 'qtd', 'estoque'];
const ALIASES_COLABORADOR = ['colaborador', 'responsavel', 'usuario'];

const ALIASES_LOTE = ['lote', 'batch'];
const ALIASES_OBSERVACAO = ['observacao', 'obs', 'anotacao'];
const ALIASES_EMBALAGEM = ['embalagem', 'tipo_embalagem', 'frasco_bisnaga'];
const ALIASES_UNIDADE = ['tipo_medida', 'unidade_medida', 'unidade', 'medida'];
const ALIASES_CONTEUDO = ['conteudo_embalagem', 'quantidade_medida', 'conteudo', 'conteudo_total'];
const ALIASES_STATUS = ['status_conferencia', 'status', 'situacao'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
  handleError: (_notificationId, error) => {
    console.log('Falha ao processar notificacao local:', error);
  },
});

const normalizarTextoMedida = (valor?: string) => (valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const parseNumeroMedida = (valor: string | undefined) => {
const texto = String(valor || '').replace(',', '.');
const numero = parseFloat(texto);
return Number.isFinite(numero) ? numero : 0;
};

const normalizarOpcaoHoras = (valor: string | null | undefined, opcoes: readonly number[], padrao: number) => {
const numero = Number(valor);
return opcoes.includes(numero) ? numero : padrao;
};

const inferirMedidaDaApresentacao = (apresentacao?: string) => {
const texto = normalizarTextoMedida(apresentacao);
if (!texto) return { unidade_medida: 'unidades' as UnidadeMedida, quantidade_medida: 0 };

const matchMl = texto.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
if (matchMl) return { unidade_medida: 'ml' as UnidadeMedida, quantidade_medida: parseNumeroMedida(matchMl[1]) };

const matchGramas = texto.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
if (matchGramas) return { unidade_medida: 'g' as UnidadeMedida, quantidade_medida: parseNumeroMedida(matchGramas[1]) };

const matchGotas = texto.match(/(\d+(?:[.,]\d+)?)\s*gotas?\b/);
if (matchGotas) return { unidade_medida: 'gotas' as UnidadeMedida, quantidade_medida: parseNumeroMedida(matchGotas[1]) };

const matchX = texto.match(/\bx\s*(\d+(?:[.,]\d+)?)\b/);
const matchCt = texto.match(/\bct\s*(\d+(?:[.,]\d+)?)\b/);
const quantidadePadrao = parseNumeroMedida(matchX?.[1] || matchCt?.[1]);

if (/\b(com|comp|comprimido|comprimidos)\b/.test(texto)) {
  return { unidade_medida: 'comprimidos' as UnidadeMedida, quantidade_medida: quantidadePadrao };
}

if (/\b(cap|caps|capsula|capsulas)\b/.test(texto)) {
  return { unidade_medida: 'capsulas' as UnidadeMedida, quantidade_medida: quantidadePadrao };
}

if (/\b(dragea|drageas)\b/.test(texto)) {
  return { unidade_medida: 'drageas' as UnidadeMedida, quantidade_medida: quantidadePadrao };
}

if (/\b(amp|ampola|ampolas|fa)\b/.test(texto)) {
  return { unidade_medida: 'ampolas' as UnidadeMedida, quantidade_medida: quantidadePadrao || 1 };
}

if (/\b(env|envelope|envelopes|sache|saches|saqueta|saquetas)\b/.test(texto)) {
  return { unidade_medida: 'envelopes' as UnidadeMedida, quantidade_medida: quantidadePadrao || 1 };
}

if (/\b(bisnaga|bisnagas|tubo|tubos|pomada|creme|gel)\b/.test(texto)) {
  return { unidade_medida: 'bisnagas' as UnidadeMedida, quantidade_medida: quantidadePadrao || 1 };
}

if (/\b(frasco|frascos|fras)\b/.test(texto)) {
  return { unidade_medida: 'frascos' as UnidadeMedida, quantidade_medida: quantidadePadrao || 1 };
}

if (/\b(spray|sprayes|aerossol|aerosol)\b/.test(texto)) {
  return { unidade_medida: 'sprays' as UnidadeMedida, quantidade_medida: quantidadePadrao || 1 };
}

return { unidade_medida: 'unidades' as UnidadeMedida, quantidade_medida: quantidadePadrao };
};

const inferirTipoEmbalagem = (apresentacao?: string): TipoEmbalagem | null => {
const texto = normalizarTextoMedida(apresentacao);
if (!texto) return null;

if (/\b(amp|ampola|ampolas|fa)\b/.test(texto)) return 'ampola';
if (/\b(env|envelope|envelopes|sache|saches|saqueta|saquetas)\b/.test(texto)) return 'envelope';
if (/\b(bisnaga|bisnagas|tubo|tubos|pomada|creme|gel)\b/.test(texto)) return 'bisnaga';
if (/\b(spray|sprayes|aerossol|aerosol)\b/.test(texto)) return 'spray';
if (/\b(frasco|frascos|fras)\b/.test(texto)) return 'frasco';

return null;
};

const normalizarDataISO = (valor: string | undefined) => {
if (!valor) return '';
const texto = valor.trim().replace(/^\uFEFF/, '');
if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

const partesBR = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
if (partesBR) return `${partesBR[3]}-${partesBR[2]}-${partesBR[1]}`;

return texto;
};

const converterDataParaDate = (valor?: string) => {
const dataNormalizada = normalizarDataISO(valor);
if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada)) return new Date();

const [ano, mes, dia] = dataNormalizada.split('-').map(Number);
return new Date(ano, mes - 1, dia);
};

const obterStatusDesconto = (dataValidadeStr: string | undefined): StatusValidadeInfo => {
if (!dataValidadeStr) return { tipo: 'ok', label: 'SEM DATA', cor: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
const hoje = new Date(); hoje.setHours(0,0,0,0);
const partes = normalizarDataISO(dataValidadeStr).split('-');
if (partes.length !== 3) return { tipo: 'ok', label: 'DATA ERRADA', cor: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };

const vencimento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2])); vencimento.setHours(0,0,0,0);
const diffTime = vencimento.getTime() - hoje.getTime();
const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

if (diffDias < 0) return { tipo: 'vencido', label: 'VENCIDO', cor: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
if (diffDias <= 30) return { tipo: 'retirar', label: 'RETIRAR', cor: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' };
if (diffDias <= 60) return { tipo: 'markdown', label: '60% DESC', cor: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
if (diffDias <= 90) return { tipo: 'markdown', label: '40% DESC', cor: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
if (diffDias <= 120) return { tipo: 'markdown', label: '30% DESC', cor: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
if (diffDias <= 180) return { tipo: 'markdown', label: '20% DESC', cor: '#A16207', bg: '#FEFCE8', border: '#FEF08A' };
return { tipo: 'ok', label: 'NO PRAZO', cor: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };
};

const obterDiasAteValidade = (dataValidadeStr: string | undefined) => {
if (!dataValidadeStr) return Number.POSITIVE_INFINITY;
const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
const partes = normalizarDataISO(dataValidadeStr).split('-');
if (partes.length !== 3) return Number.POSITIVE_INFINITY;
const vencimento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
vencimento.setHours(0, 0, 0, 0);
return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
};

const formataDataBR = (dataStr: string | undefined) => {
if (!dataStr) return '--/--/----';
const partes = normalizarDataISO(dataStr).split('-');
if (partes.length !== 3) return dataStr;
return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const lerListaJson = (valor?: string): string[] => {
if (!valor) return [];

try {
  const lista = JSON.parse(valor) as unknown;
  if (!Array.isArray(lista)) return [];
  return lista.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
} catch {
  return [];
}
};

const extrairValidadeMaisProxima = (validade: string, validadesAdicionaisJson?: string): string => {
const datas: Date[] = [];
const dataAtual = new Date();
dataAtual.setHours(0, 0, 0, 0);

if (validade) {
  const data = new Date(validade);
  data.setHours(0, 0, 0, 0);
  datas.push(data);
}

if (validadesAdicionaisJson) {
  const adicionais = lerListaJson(validadesAdicionaisJson);
  for (const d of adicionais) {
    const data = new Date(d);
    data.setHours(0, 0, 0, 0);
    datas.push(data);
  }
}

if (datas.length === 0) return validade;

const maisproxima = datas.reduce((prev, current) => {
  const diffPrev = Math.abs(prev.getTime() - dataAtual.getTime());
  const diffCurrent = Math.abs(current.getTime() - dataAtual.getTime());
  return diffCurrent < diffPrev ? current : prev;
});

return maisproxima.toISOString().split('T')[0];
};

const obterResumoValidadesExtras = (validadesAdicionaisJson?: string) => {
const validadesExtras = lerListaJson(validadesAdicionaisJson);
const quantidade = validadesExtras.length;
const possuiMultiplasValidades = quantidade > 0;
const sufixoPlural = quantidade > 1 ? 's' : '';

return {
  validadesExtras,
  possuiMultiplasValidades,
  badgeTexto: `+${quantidade} validade${sufixoPlural} extra${sufixoPlural}`,
  extrasTexto: `Extras: ${validadesExtras.map(formataDataBR).join(' | ')}`,
};
};

export default function App() {
const [isLoading, setIsLoading] = useState(true);
const [permission, requestPermission] = useCameraPermissions();
const { width } = useWindowDimensions();
const colorScheme = useColorScheme();
const [themePreference, setThemePreference] = useState<ThemePreference>('system');
const isDark = themePreference === 'system' ? colorScheme === 'dark' : themePreference === 'dark';
const isCompact = width < 390;
const isTablet = width >= 768;
const larguraKpi = isTablet ? 260 : isCompact ? 188 : 220;
const chartWidth = Math.max(260, Math.min(width - (isCompact ? 52 : 76), isTablet ? 660 : width - 44));
const theme = useMemo(() => ({
  background: isDark ? '#020617' : '#F4F6F8',
  surface: isDark ? '#111827' : '#FFFFFF',
  surfaceAlt: isDark ? '#0F172A' : '#F8FAFC',
  border: isDark ? '#334155' : '#E5E7EB',
  borderSoft: isDark ? '#1E293B' : '#E2E8F0',
  text: isDark ? '#E5E7EB' : '#111827',
  title: isDark ? '#F8FAFC' : '#1A1C5A',
  muted: isDark ? '#94A3B8' : '#6B7280',
  subtle: isDark ? '#CBD5E1' : '#475569',
  inputBg: isDark ? '#0B1220' : '#FFFFFF',
  chipBg: isDark ? '#1F2937' : '#F3F4F6',
  chipText: isDark ? '#CBD5E1' : '#4B5563',
  eanBg: isDark ? '#0B1220' : '#F3F4F6',
  actionBg: isDark ? '#111827' : '#F9FAFB',
  closeBg: isDark ? '#1F2937' : '#F3F4F6',
  headerBg: isDark ? '#0F172A' : '#2C2E7D',
  headerPanelBg: isDark ? '#111827' : '#1E205B',
  headerPanelBorder: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(255,255,255,0.1)',
  overlay: isDark ? 'rgba(2,6,23,0.82)' : 'rgba(26, 28, 90, 0.8)',
  bottomOverlay: isDark ? 'rgba(2,6,23,0.72)' : 'rgba(26, 28, 90, 0.5)',
  sidebarOverlay: isDark ? 'rgba(2,6,23,0.5)' : 'rgba(15, 23, 42, 0.35)',
  cardBg: isDark ? '#1F2937' : '#F3F4F6',
}), [isDark]);

const [modoAcessibilidade, setModoAcessibilidade] = useState(false);
const a11y = useMemo(() => ({
  fNome: modoAcessibilidade ? 24 : 18,
  fStatus: modoAcessibilidade ? 21 : 16,
  fStatusTag: modoAcessibilidade ? 16 : 12,
  fInfoValue: modoAcessibilidade ? 22 : 18,
  fLabel: modoAcessibilidade ? 14 : 12,
  fInput: modoAcessibilidade ? 19 : 16,
  fBtnSalvar: modoAcessibilidade ? 19 : 16,
  cardPad: modoAcessibilidade ? 22 : 16,
  inputPad: modoAcessibilidade ? 20 : 16,
  iconSize: modoAcessibilidade ? 20 : 14,
}), [modoAcessibilidade]);

// ==========================================
// ESTADOS GLOBAIS
// ==========================================
const [loja, setLoja] = useState('[Loja]');
const [codigoLoja, setCodigoLoja] = useState('');
const [regional, setRegional] = useState('[Regional]');
const [colaborador, setColaborador] = useState('[Seu nome]');
const [autoExcluirVencidos, setAutoExcluirVencidos] = useState(false);
const [produtos, setProdutos] = useState<Produto[]>([]);

const [showForm, setShowForm] = useState(false);
const [showConfig, setShowConfig] = useState(false);
const [showResumoTurno, setShowResumoTurno] = useState(false);
const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
const [showHistorico, setShowHistorico] = useState(false);
const [showMenuLateral, setShowMenuLateral] = useState(false);
const [versaoBaseInternaAtual, setVersaoBaseInternaAtual] = useState('');
const [termoBusca, setTermoBusca] = useState('');
const [filtroValidade, setFiltroValidade] = useState<TipoFiltro>('todos');
const [filtroColaborador, setFiltroColaborador] = useState('');
const [filtroStatusConferencia, setFiltroStatusConferencia] = useState<StatusConferencia | 'todos'>('todos');
const [filtroUnidadeMedida, setFiltroUnidadeMedida] = useState<UnidadeMedida | 'todos'>('todos');
const [filtroEmbalagem, setFiltroEmbalagem] = useState<TipoEmbalagem | 'todos'>('todos');
const [historico, setHistorico] = useState<HistoricoRegistro[]>([]);
const [filtroHistoricoDataInicio, setFiltroHistoricoDataInicio] = useState('');
const [filtroHistoricoDataFim, setFiltroHistoricoDataFim] = useState('');
const [filtroHistoricoTipo, setFiltroHistoricoTipo] = useState('todos');
const [showImportPreview, setShowImportPreview] = useState(false);
const [itensImportacaoPreview, setItensImportacaoPreview] = useState<Produto[]>([]);
const [nomeArquivoImportacao, setNomeArquivoImportacao] = useState('');
const [filtroImportPreview, setFiltroImportPreview] = useState('');
const [importandoPreview, setImportandoPreview] = useState(false);
const [exportandoPlanilha, setExportandoPlanilha] = useState(false);

const [buscandoNaApi, setBuscandoNaApi] = useState(false);
const [isScanning, setIsScanning] = useState(false);
const [notificacoesHabilitadas, setNotificacoesHabilitadas] = useState(false);
const [frequenciaLembreteHoras, setFrequenciaLembreteHoras] = useState(FREQUENCIA_LEMBRETE_PADRAO_HORAS);
const [frequenciaResumoRiscoHoras, setFrequenciaResumoRiscoHoras] = useState(FREQUENCIA_ALERTA_RISCO_PADRAO_HORAS);

const [editandoId, setEditandoId] = useState<string | null>(null);

// NOTIFICAÇÃO COM FADE
const [showNotificacao, setShowNotificacao] = useState(false);
const [mensagemNotificacao, setMensagemNotificacao] = useState('');
const opacidadeNotificacao = useRef(new Animated.Value(0)).current;
const deslocamentoNotificacao = useRef(new Animated.Value(-12)).current;
const deslocamentoSidebar = useRef(new Animated.Value(28)).current;
const deslocamentoBottomSheet = useRef(new Animated.Value(36)).current;
const opacidadePainelModal = useRef(new Animated.Value(0)).current;
const deslocamentoDialogo = useRef(new Animated.Value(12)).current;
const escalaDialogo = useRef(new Animated.Value(0.96)).current;
const opacidadeDialogo = useRef(new Animated.Value(0)).current;
const fechandoBottomSheetRef = useRef(false);
const fechandoSidebarRef = useRef(false);
const fechandoDialogoRef = useRef(false);

// DATE PICKER
const [showDatePicker, setShowDatePicker] = useState(false);
const [dataValidadeSelecionada, setDataValidadeSelecionada] = useState(new Date());
const [showDatePickerAdicional, setShowDatePickerAdicional] = useState(false);
const [dataValidadeAdicionalSelecionada, setDataValidadeAdicionalSelecionada] = useState(new Date());
const [showHistoricoDatePicker, setShowHistoricoDatePicker] = useState(false);
const [dataHistoricoSelecionada, setDataHistoricoSelecionada] = useState(new Date());
const [alvoDatePickerHistorico, setAlvoDatePickerHistorico] = useState<'inicio' | 'fim'>('inicio');

// Campos do Formulário
const [novoNome, setNovoNome] = useState('');
const [novoCodigo, setNovoCodigo] = useState('');
const [novaApresentacao, setNovaApresentacao] = useState('');
const [novaEmbalagem, setNovaEmbalagem] = useState<TipoEmbalagem | ''>('');
const [novaUnidadeMedida, setNovaUnidadeMedida] = useState<UnidadeMedida>('unidades');
const [novaQuantidadeMedida, setNovaQuantidadeMedida] = useState('');
const [novaValidade, setNovaValidade] = useState('');
const [novasValidadesAdicionais, setNovasValidadesAdicionais] = useState<string[]>([]);
const [novaQtd, setNovaQtd] = useState('');
const [novoLote, setNovoLote] = useState('');
const [novaObservacao, setNovaObservacao] = useState('');
const [novoStatusConferencia, setNovoStatusConferencia] = useState<StatusConferencia>('pendente');

const [tempLoja, setTempLoja] = useState('');
const [tempCodigoLoja, setTempCodigoLoja] = useState('');
const [tempRegional, setTempRegional] = useState('');
const [tempColaborador, setTempColaborador] = useState('');
const [tempAutoExcluirVencidos, setTempAutoExcluirVencidos] = useState(false);
const [tempThemePreference, setTempThemePreference] = useState<ThemePreference>('system');
const [tempModoAcessibilidade, setTempModoAcessibilidade] = useState(false);
const [tempFrequenciaLembreteHoras, setTempFrequenciaLembreteHoras] = useState(FREQUENCIA_LEMBRETE_PADRAO_HORAS);
const [tempFrequenciaResumoRiscoHoras, setTempFrequenciaResumoRiscoHoras] = useState(FREQUENCIA_ALERTA_RISCO_PADRAO_HORAS);

// NOVOS ESTADOS: SWIPE, GRÁFICO
const [showGraficoStatus, setShowGraficoStatus] = useState(false);
const [exportandoPdf, setExportandoPdf] = useState(false);
const [produtoSwipeado, setProdutoSwipeado] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);
const [showOnboarding, setShowOnboarding] = useState(false);
const [onboardingStep, setOnboardingStep] = useState(0);

const swipeRefs = useRef<Record<string, Swipeable | null>>({});
const swipeAbertoRef = useRef<string | null>(null);

const ultimoCodigoBuscado = useRef('');
const cacheEanMemoria = useRef<Record<string, CadastroEan>>({});
const bancoAbertoRef = useRef<Promise<BancoDados> | null>(null);
const importacaoEmAndamentoRef = useRef(false);
const confirmacaoAutoExclusaoAbertaRef = useRef(false);

const gerarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatarTotalMedido = (produto: Pick<Produto, 'qtd' | 'quantidade_medida' | 'unidade_medida'>) => {
const quantidadeBase = Number(produto.quantidade_medida || 0);
if (!quantidadeBase) return null;

const total = (produto.qtd || 0) * quantidadeBase;
const unidade = ROTULOS_UNIDADE_MEDIDA[produto.unidade_medida || 'unidades'];
const valor = Number.isInteger(total) ? String(total) : total.toFixed(2).replace('.', ',');
return `${valor} ${unidade}`;
};

const resumirTotaisMedidos = (lista: Produto[]) => {
const totais = new Map<UnidadeMedida, number>();

lista.forEach((produto) => {
  const quantidadeBase = Number(produto.quantidade_medida || 0);
  if (!quantidadeBase) return;

  const unidade = produto.unidade_medida || 'unidades';
  const totalAtual = totais.get(unidade) || 0;
  totais.set(unidade, totalAtual + ((produto.qtd || 0) * quantidadeBase));
});

return Array.from(totais.entries())
  .filter(([, total]) => total > 0)
  .sort((a, b) => b[1] - a[1])
  .map(([unidade, total]) => {
    const valor = Number.isInteger(total) ? String(total) : total.toFixed(2).replace('.', ',');
    return `${valor} ${ROTULOS_UNIDADE_MEDIDA[unidade]}`;
  });
};

const normalizarCabecalho = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const extrairSomenteNumeros = (valor: string) => valor.replace(/\D+/g, '');

const detectarSeparador = (linha: string) => {
const qtdPontoVirgula = (linha.match(/;/g) || []).length;
const qtdVirgula = (linha.match(/,/g) || []).length;
return qtdPontoVirgula >= qtdVirgula ? ';' : ',';
};

const parseLinhaDelimitada = (linha: string, separador: string) => {
const colunas: string[] = [];
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

const obterExtensaoArquivo = (arquivo: DocumentPicker.DocumentPickerAsset) => {
const nome = (arquivo.name || '').toLowerCase();
if (nome.endsWith('.xlsx')) return 'xlsx';
if (nome.endsWith('.xls')) return 'xls';
if (nome.endsWith('.csv')) return 'csv';
if ((arquivo.mimeType || '').includes('sheet')) return 'xlsx';
if ((arquivo.mimeType || '').includes('excel')) return 'xls';
return 'csv';
};

const lerPlanilhaComoLinhas = async (arquivo: DocumentPicker.DocumentPickerAsset) => {
const extensao = obterExtensaoArquivo(arquivo);
const arquivoSelecionado = new File(arquivo.uri);

if (extensao === 'xls') {
  throw new Error('Arquivos .xls nao sao suportados. Use .xlsx ou .csv.');
}

if (extensao === 'xlsx') {
  const conteudoArray = await arquivoSelecionado.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(conteudoArray);

  const primeiraAba = workbook.worksheets[0];
  if (!primeiraAba) return [];

  const linhas: string[][] = [];
  primeiraAba.eachRow({ includeEmpty: false }, (linha) => {
    const totalColunas = Math.max(linha.cellCount, linha.actualCellCount || 0);
    const colunas = Array.from({ length: totalColunas }, (_, indice) => linha.getCell(indice + 1).text.trim());
    if (colunas.some((coluna) => coluna)) {
      linhas.push(colunas);
    }
  });

  return linhas;
}

const conteudoTexto = await arquivoSelecionado.text();
const linhasTexto = conteudoTexto
  .replace(/^\uFEFF/, '')
  .split(/\r?\n/)
  .map((linha) => linha.trim())
  .filter(Boolean);

if (linhasTexto.length === 0) return [];

const separador = detectarSeparador(linhasTexto[0]);
return linhasTexto.map((linha) => parseLinhaDelimitada(linha, separador));
};

const obterValorPorCabecalho = (registro: Record<string, string>, aliases: string[]) => {
for (const alias of aliases) {
  if (registro[alias]) return registro[alias];
}
  return '';
};

const linhaPareceCabecalhoProdutos = (linha: string[]) => {
const colunas = linha.map((coluna) => normalizarCabecalho(String(coluna || ''))).filter(Boolean);
if (colunas.length < 3) return false;

const temNome = colunas.some((coluna) => ALIASES_NOME_PRODUTO.includes(coluna));
const temCodigo = colunas.some((coluna) => ALIASES_CODIGO_PRODUTO.includes(coluna));
const temValidade = colunas.some((coluna) => ALIASES_VALIDADE_PRODUTO.includes(coluna));
return temNome && temCodigo && temValidade;
};

const normalizarStatusConferenciaImportado = (valor?: string): StatusConferencia => {
const texto = normalizarCabecalho(valor || '');
if (texto === 'conferido') return 'conferido';
if (texto === 'resolvido') return 'resolvido';
return 'pendente';
};

const normalizarCodigoImportado = (valor?: string) => {
const texto = String(valor || '').replace(/^\uFEFF/, '').trim();
if (!texto) return '';

if (/^\d+\.0+$/.test(texto)) {
  return texto.replace(/\.0+$/, '');
}

return texto;
};

const formatarDataHora = (timestamp: number) => {
const data = new Date(timestamp);
return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatarResumoBaseInterna = (versao: string) => {
if (!versao) return 'nao carregada';
if (versao.startsWith('manual:')) {
  const timestamp = Number(versao.split(':')[1]);
  if (Number.isFinite(timestamp)) return `manual em ${formatarDataHora(timestamp)}`;
  return 'manual';
}
if (versao === VERSAO_BASE_INTERNA) return `embutida (${VERSAO_BASE_INTERNA})`;
return versao;
};

const obterTipoProduto = (produto: Pick<Produto, 'embalagem' | 'unidade_medida' | 'apresentacao'>) => {
const embalagem = produto.embalagem || inferirTipoEmbalagem(produto.apresentacao) || '';
if (embalagem) return ROTULOS_TIPO_EMBALAGEM[embalagem as TipoEmbalagem];

const unidade = produto.unidade_medida || inferirMedidaDaApresentacao(produto.apresentacao).unidade_medida;
return ROTULOS_UNIDADE_MEDIDA[unidade] || 'sem tipo';
};

const preencherCamposDoProduto = useCallback((cadastro: CadastroEan) => {
setNovoNome(cadastro.nome);
setNovaApresentacao(cadastro.apresentacao || '');
setNovaEmbalagem(cadastro.embalagem || inferirTipoEmbalagem(cadastro.apresentacao) || '');
const medidaInferida = cadastro.quantidade_medida || cadastro.unidade_medida
  ? { unidade_medida: cadastro.unidade_medida || 'unidades', quantidade_medida: cadastro.quantidade_medida || 0 }
  : inferirMedidaDaApresentacao(cadastro.apresentacao);
setNovaUnidadeMedida(medidaInferida.unidade_medida);
setNovaQuantidadeMedida(medidaInferida.quantidade_medida ? String(medidaInferida.quantidade_medida) : '');
}, []);

const abrirBanco = useCallback(async () => {
if (!bancoAbertoRef.current) {
  bancoAbertoRef.current = SQLite.openDatabaseAsync('farmacia.db');
}

return await bancoAbertoRef.current;
}, []);

const fecharBancoAtual = useCallback(async () => {
if (!bancoAbertoRef.current) return;

const db = await bancoAbertoRef.current;
await db.closeAsync();
 bancoAbertoRef.current = null;
}, []);

const configurarNotificacoes = useCallback(async (solicitarPermissao = false) => {
if (Platform.OS === 'web') return false;

try {
  let statusPermissao = (await Notifications.getPermissionsAsync()).status;
  if (statusPermissao !== 'granted' && solicitarPermissao) {
    statusPermissao = (await Notifications.requestPermissionsAsync()).status;
  }

  if (statusPermissao !== 'granted') {
    setNotificacoesHabilitadas(false);
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alertas-validade', {
      name: 'Alertas de validade',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#565DF0',
      sound: 'default',
    });
  }

  setNotificacoesHabilitadas(true);
  return true;
} catch (error) {
  console.log('Nao foi possivel configurar notificacoes:', error);
  setNotificacoesHabilitadas(false);
  return false;
}
}, []);

const sincronizarEstadoNotificacoes = useCallback(async () => {
if (Platform.OS === 'web') {
  setNotificacoesHabilitadas(false);
  return;
}

try {
  const statusPermissao = (await Notifications.getPermissionsAsync()).status;
  if (statusPermissao !== 'granted') {
    setNotificacoesHabilitadas(false);
    return;
  }

  const notificacaoExistente = await AsyncStorage.getItem(CHAVE_NOTIFICACAO_LEMBRETE);
  if (!notificacaoExistente) {
    setNotificacoesHabilitadas(false);
    return;
  }

  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  const lembreteAindaExiste = agendadas.some((item) => item.identifier === notificacaoExistente);
  if (!lembreteAindaExiste) {
    await AsyncStorage.removeItem(CHAVE_NOTIFICACAO_LEMBRETE);
  }

  setNotificacoesHabilitadas(lembreteAindaExiste);
} catch (error) {
  console.log('Nao foi possivel sincronizar o estado de notificacoes:', error);
  setNotificacoesHabilitadas(false);
}
}, []);

const agendarLembreteRecorrente = useCallback(async (forcarReagendamento = false) => {
if (!(await configurarNotificacoes(true))) return false;

try {
  const notificacaoExistente = await AsyncStorage.getItem(CHAVE_NOTIFICACAO_LEMBRETE);
  if (notificacaoExistente) {
    const agendadas = await Notifications.getAllScheduledNotificationsAsync();
    const lembreteAindaExiste = agendadas.some((item) => item.identifier === notificacaoExistente);
    if (lembreteAindaExiste && !forcarReagendamento) return true;
    if (lembreteAindaExiste && forcarReagendamento) {
      await Notifications.cancelScheduledNotificationAsync(notificacaoExistente);
    }

    await AsyncStorage.removeItem(CHAVE_NOTIFICACAO_LEMBRETE);
  }

  const identificador = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Lembrete de auditoria ${codigoLoja ? `- Loja ${codigoLoja}` : ''}`,
      body: `Loja ${loja} | Regional ${regional}. Revise os produtos com vencimento proximo. Frequencia atual: ${frequenciaLembreteHoras}h.`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: frequenciaLembreteHoras * 60 * 60,
      repeats: true,
      channelId: 'alertas-validade',
    },
  });

  await AsyncStorage.setItem(CHAVE_NOTIFICACAO_LEMBRETE, identificador);
  setNotificacoesHabilitadas(true);
  return true;
} catch (error) {
  console.log('Nao foi possivel agendar o lembrete recorrente:', error);
  await AsyncStorage.removeItem(CHAVE_NOTIFICACAO_LEMBRETE);
  setNotificacoesHabilitadas(false);
  return false;
}
}, [codigoLoja, configurarNotificacoes, frequenciaLembreteHoras, loja, regional]);

const enviarNotificacaoLocal = useCallback(async (title: string, body: string) => {
if (!(await configurarNotificacoes(false))) return;

try {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null,
  });
} catch (error) {
  console.log('Nao foi possivel enviar notificacao local:', error);
}
}, [configurarNotificacoes]);

const carregarHistorico = useCallback(async () => {
const db = await abrirBanco();
const registros = await db.getAllAsync('SELECT * FROM historico_produtos ORDER BY data_evento DESC LIMIT 80') as HistoricoRegistro[];
setHistorico(registros);
}, [abrirBanco]);

const recarregarProdutos = useCallback(async () => {
setRefreshing(true);
try {
  const db = await abrirBanco();
  const todosProdutos = await db.getAllAsync('SELECT * FROM produtos') as Produto[];
  setProdutos(todosProdutos);
  await carregarHistorico();
} catch (error) {
  console.log('Erro ao recarregar produtos:', error);
} finally {
  setRefreshing(false);
}
}, [abrirBanco, carregarHistorico]);

const registrarHistorico = useCallback(async (entrada: Omit<HistoricoRegistro, 'id' | 'data_evento'>, dbAtual?: BancoDados) => {
const db = dbAtual || await abrirBanco();
await db.runAsync(
  'INSERT INTO historico_produtos (id, produto_id, acao, nome, codigo, colaborador, data_evento, detalhes, tipo_produto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  gerarId(),
  entrada.produto_id,
  entrada.acao,
  entrada.nome,
  entrada.codigo,
  entrada.colaborador,
  Date.now(),
  entrada.detalhes,
  entrada.tipo_produto || ''
);
}, [abrirBanco]);

const garantirColuna = useCallback(async (db: BancoDados, tabela: string, definicao: string) => {
const nomeColuna = definicao.trim().split(/\s+/)[0];
const colunas = await db.getAllAsync<ColunaTabela>(`PRAGMA table_info(${tabela})`);
if (colunas.some((coluna) => coluna.name === nomeColuna)) return;
await db.runAsync(`ALTER TABLE ${tabela} ADD COLUMN ${definicao}`);
}, []);

const gerarAlertasCadastro = () => {
const alertas: string[] = [];
const embalagemInferida = inferirTipoEmbalagem(novaApresentacao);
const medidaInferida = inferirMedidaDaApresentacao(novaApresentacao).unidade_medida;

if (embalagemInferida === 'frasco' && !['ml', 'gotas', 'g', 'unidades'].includes(novaUnidadeMedida)) {
  alertas.push('Frasco normalmente combina com ml, gotas, g ou unidades.');
}
  if (embalagemInferida === 'bisnaga' && novaUnidadeMedida !== 'g') {
  alertas.push('Bisnaga normalmente usa medida em g.');
}
if (novaApresentacao && medidaInferida !== 'unidades' && medidaInferida !== novaUnidadeMedida) {
  alertas.push(`A apresentação sugere ${ROTULOS_UNIDADE_MEDIDA[medidaInferida]}, mas o cálculo está em ${ROTULOS_UNIDADE_MEDIDA[novaUnidadeMedida]}.`);
}
if ((novaUnidadeMedida === 'ml' || novaUnidadeMedida === 'g' || novaUnidadeMedida === 'gotas') && !parseNumeroMedida(novaQuantidadeMedida)) {
  alertas.push('Conteúdo por embalagem está vazio para uma medida quantitativa.');
}

return alertas;
};

const salvarEanNoCache = useCallback(async (cadastro: CadastroEan) => {
cacheEanMemoria.current[cadastro.codigo] = cadastro;

const db = await abrirBanco();
await db.runAsync(
  `INSERT OR REPLACE INTO ean_cache (codigo, nome, apresentacao, embalagem, custo, unidade_medida, quantidade_medida, referencia, atualizado_em)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  cadastro.codigo,
  cadastro.nome,
  cadastro.apresentacao || '',
  cadastro.embalagem || inferirTipoEmbalagem(cadastro.apresentacao) || '',
  cadastro.custo,
  cadastro.unidade_medida || 'unidades',
  cadastro.quantidade_medida || 0,
  cadastro.referencia || '',
  Date.now()
);
}, [abrirBanco]);

const buscarEanNoCache = useCallback(async (codigo: string) => {
const cadastroMemoria = cacheEanMemoria.current[codigo];
if (cadastroMemoria) return cadastroMemoria;

const db = await abrirBanco();
const cadastroBanco = await db.getFirstAsync(
  'SELECT codigo, nome, apresentacao, embalagem, custo, unidade_medida, quantidade_medida, referencia FROM ean_cache WHERE codigo = ?',
  codigo
) as CadastroEan | null;

if (cadastroBanco) {
  cacheEanMemoria.current[codigo] = cadastroBanco;
}

return cadastroBanco;
}, [abrirBanco]);

const carregarBaseInternaEmbutida = useCallback(async () => {
const versaoAtual = await AsyncStorage.getItem(CHAVE_BASE_INTERNA);
if (versaoAtual === VERSAO_BASE_INTERNA || versaoAtual?.startsWith('manual:')) return;

const db = await abrirBanco();
const baseEmbutida = require('../../assets/data/anvisa-base.json') as CadastroEan[];
cacheEanMemoria.current = {};

await db.withTransactionAsync(async () => {
  await db.runAsync('DELETE FROM ean_cache');

  for (const cadastro of baseEmbutida) {
    await db.runAsync(
      `INSERT OR REPLACE INTO ean_cache (codigo, nome, apresentacao, embalagem, custo, unidade_medida, quantidade_medida, referencia, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      cadastro.codigo,
      cadastro.nome,
      cadastro.apresentacao || '',
      cadastro.embalagem || inferirTipoEmbalagem(cadastro.apresentacao) || '',
      cadastro.custo || 0,
      cadastro.unidade_medida || inferirMedidaDaApresentacao(cadastro.apresentacao).unidade_medida,
      cadastro.quantidade_medida || inferirMedidaDaApresentacao(cadastro.apresentacao).quantidade_medida,
      cadastro.referencia || '',
      0
    );
  }
});

await AsyncStorage.setItem(CHAVE_BASE_INTERNA, VERSAO_BASE_INTERNA);
}, [abrirBanco]);

const inicializarApp = useCallback(async () => {
try {
// 1. Carregar Configurações (AsyncStorage)
const configuracoes = Object.fromEntries(await AsyncStorage.multiGet([...CHAVES_CONFIGURACAO_INICIAL]));
const l = configuracoes[CHAVE_LOJA];
const cl = configuracoes[CHAVE_CODIGO_LOJA];
const r = configuracoes[CHAVE_REGIONAL];
const c = configuracoes[CHAVE_COLABORADOR];
const autoExcluir = configuracoes[CHAVE_AUTO_EXCLUIR_VENCIDOS];
const modoTema = configuracoes[CHAVE_MODO_TEMA];
const freqLembrete = normalizarOpcaoHoras(configuracoes[CHAVE_FREQUENCIA_LEMBRETE_HORAS], OPCOES_FREQUENCIA_LEMBRETE_HORAS, FREQUENCIA_LEMBRETE_PADRAO_HORAS);
const freqResumoRisco = normalizarOpcaoHoras(configuracoes[CHAVE_FREQUENCIA_ALERTA_RISCO_HORAS], OPCOES_FREQUENCIA_ALERTA_RISCO_HORAS, FREQUENCIA_ALERTA_RISCO_PADRAO_HORAS);
if (l) setLoja(l);
if (cl) setCodigoLoja(extrairSomenteNumeros(cl));
if (r) setRegional(r);
if (c) setColaborador(c);
setAutoExcluirVencidos(autoExcluir === 'true');
setFrequenciaLembreteHoras(freqLembrete);
setTempFrequenciaLembreteHoras(freqLembrete);
setFrequenciaResumoRiscoHoras(freqResumoRisco);
setTempFrequenciaResumoRiscoHoras(freqResumoRisco);
if (modoTema === 'system' || modoTema === 'light' || modoTema === 'dark') {
  setThemePreference(modoTema);
  setTempThemePreference(modoTema);
}
const modoA11y = configuracoes[CHAVE_MODO_ACESSIBILIDADE];
setModoAcessibilidade(modoA11y === 'true');
setTempModoAcessibilidade(modoA11y === 'true');

  // 2. Inicializar Banco de Dados (SQLite)
  const db = await abrirBanco();
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT,
      codigo TEXT,
      apresentacao TEXT,
      embalagem TEXT,
      unidade_medida TEXT,
      quantidade_medida REAL DEFAULT 0,
      validade TEXT,
      validades_adicionais TEXT,
      custo REAL,
      qtd INTEGER,
      colaborador TEXT,
      lote TEXT,
      observacao TEXT,
      status_conferencia TEXT DEFAULT 'pendente'
    )`
  );
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS ean_cache (
      codigo TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      apresentacao TEXT,
      embalagem TEXT,
      custo REAL DEFAULT 0,
      unidade_medida TEXT,
      quantidade_medida REAL DEFAULT 0,
      referencia TEXT,
      atualizado_em INTEGER
    )`
  );
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS historico_produtos (
      id TEXT PRIMARY KEY NOT NULL,
      produto_id TEXT,
      acao TEXT,
      nome TEXT,
      codigo TEXT,
      colaborador TEXT,
      data_evento INTEGER,
      detalhes TEXT,
      tipo_produto TEXT
    )`
  );

  await garantirColuna(db, 'ean_cache', 'referencia TEXT');
  await garantirColuna(db, 'produtos', "unidade_medida TEXT DEFAULT 'unidades'");
  await garantirColuna(db, 'produtos', 'embalagem TEXT');
  await garantirColuna(db, 'produtos', 'quantidade_medida REAL DEFAULT 0');
  await garantirColuna(db, 'produtos', 'validades_adicionais TEXT');
  await garantirColuna(db, 'produtos', 'lote TEXT');
  await garantirColuna(db, 'produtos', 'observacao TEXT');
  await garantirColuna(db, 'produtos', "status_conferencia TEXT DEFAULT 'pendente'");
  await garantirColuna(db, 'ean_cache', "unidade_medida TEXT DEFAULT 'unidades'");
  await garantirColuna(db, 'ean_cache', 'embalagem TEXT');
  await garantirColuna(db, 'ean_cache', 'quantidade_medida REAL DEFAULT 0');
  await garantirColuna(db, 'historico_produtos', 'tipo_produto TEXT');

  for (const sqlIndice of INDICES_SQLITE) {
    await db.runAsync(sqlIndice);
  }

  const primeiraInstalacaoConcluida = configuracoes[CHAVE_PRIMEIRA_INSTALACAO];
  if (!primeiraInstalacaoConcluida) {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM produtos');
      await db.runAsync('DELETE FROM historico_produtos');
    });
    await AsyncStorage.setItem(CHAVE_PRIMEIRA_INSTALACAO, 'ok');
  }

  await carregarBaseInternaEmbutida();
  
  // 3. Carregar Produtos
  const todosProdutos = await db.getAllAsync('SELECT * FROM produtos') as Produto[];
  setProdutos(todosProdutos);
  await carregarHistorico();
  await sincronizarEstadoNotificacoes();
  const onboardingConcluido = configuracoes[CHAVE_ONBOARDING_CONCLUIDO];
  if (!onboardingConcluido) setShowOnboarding(true);
  
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Não foi possível inicializar a base de dados SQLite.';
  Alert.alert("Erro", mensagem);
} finally {
  setIsLoading(false);
}


}, [abrirBanco, carregarBaseInternaEmbutida, carregarHistorico, garantirColuna, sincronizarEstadoNotificacoes]);

// ==========================================
// INICIALIZAÇÃO: ASYNC STORAGE & SQLITE
// ==========================================
useEffect(() => {
inicializarApp();
}, [inicializarApp]);

const animarSaidaSidebar = useCallback(() => new Promise<void>((resolve) => {
if (fechandoSidebarRef.current) {
  resolve();
  return;
}

fechandoSidebarRef.current = true;

Animated.parallel([
  Animated.timing(deslocamentoSidebar, {
    toValue: 28,
    duration: 220,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadePainelModal, {
    toValue: 0,
    duration: 180,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  }),
]).start(() => {
  fechandoSidebarRef.current = false;
  resolve();
});
}), [deslocamentoSidebar, opacidadePainelModal]);

const fecharMenuLateral = useCallback(async () => {
await animarSaidaSidebar();
setShowMenuLateral(false);
}, [animarSaidaSidebar]);

const executarAposFecharMenuLateral = useCallback(async (acao: () => void | Promise<void>) => {
await fecharMenuLateral();
await acao();
}, [fecharMenuLateral]);

const animarSaidaDialogo = useCallback(() => new Promise<void>((resolve) => {
if (fechandoDialogoRef.current) {
  resolve();
  return;
}

fechandoDialogoRef.current = true;

Animated.parallel([
  Animated.timing(deslocamentoDialogo, {
    toValue: 12,
    duration: 200,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(escalaDialogo, {
    toValue: 0.96,
    duration: 200,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadeDialogo, {
    toValue: 0,
    duration: 160,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  }),
]).start(() => {
  fechandoDialogoRef.current = false;
  resolve();
});
}), [deslocamentoDialogo, escalaDialogo, opacidadeDialogo]);

const fecharConfiguracoes = useCallback(async () => {
await animarSaidaDialogo();
setShowConfig(false);
}, [animarSaidaDialogo]);

const fecharFiltrosAvancados = useCallback(async () => {
await animarSaidaDialogo();
setShowFiltrosAvancados(false);
}, [animarSaidaDialogo]);

const fecharGraficoStatus = useCallback(async () => {
await animarSaidaDialogo();
setShowGraficoStatus(false);
}, [animarSaidaDialogo]);

const fecharDatePickerAdicionalIOS = useCallback(async () => {
await animarSaidaDialogo();
setShowDatePickerAdicional(false);
}, [animarSaidaDialogo]);

const fecharDatePickerIOS = useCallback(async () => {
await animarSaidaDialogo();
setShowDatePicker(false);
}, [animarSaidaDialogo]);

const fecharHistoricoDatePickerIOS = useCallback(async () => {
await animarSaidaDialogo();
setShowHistoricoDatePicker(false);
}, [animarSaidaDialogo]);

const abrirConfiguracoes = useCallback(() => {
setTempLoja(loja);
setTempCodigoLoja(extrairSomenteNumeros(codigoLoja));
setTempRegional(regional);
setTempColaborador(colaborador);
setTempAutoExcluirVencidos(autoExcluirVencidos);
setTempThemePreference(themePreference);
setTempModoAcessibilidade(modoAcessibilidade);
setTempFrequenciaLembreteHoras(frequenciaLembreteHoras);
setTempFrequenciaResumoRiscoHoras(frequenciaResumoRiscoHoras);
setShowConfig(true);
}, [autoExcluirVencidos, codigoLoja, colaborador, frequenciaLembreteHoras, frequenciaResumoRiscoHoras, loja, modoAcessibilidade, regional, themePreference]);

const salvarConfiguracoes = async () => {
try {
const lojaNormalizada = tempLoja.trim().toUpperCase();
const codigoLojaNormalizado = extrairSomenteNumeros(tempCodigoLoja);
const regionalNormalizada = tempRegional.trim().toUpperCase();
const mudouFrequenciaLembrete = tempFrequenciaLembreteHoras !== frequenciaLembreteHoras;
const mudouFrequenciaResumo = tempFrequenciaResumoRiscoHoras !== frequenciaResumoRiscoHoras;
const mudouContextoLoja = lojaNormalizada !== loja || codigoLojaNormalizado !== codigoLoja || regionalNormalizada !== regional;

await AsyncStorage.multiSet([
  [CHAVE_LOJA, lojaNormalizada],
  [CHAVE_CODIGO_LOJA, codigoLojaNormalizado],
  [CHAVE_REGIONAL, regionalNormalizada],
  [CHAVE_COLABORADOR, tempColaborador],
  [CHAVE_FREQUENCIA_LEMBRETE_HORAS, String(tempFrequenciaLembreteHoras)],
  [CHAVE_FREQUENCIA_ALERTA_RISCO_HORAS, String(tempFrequenciaResumoRiscoHoras)],
  [CHAVE_AUTO_EXCLUIR_VENCIDOS, tempAutoExcluirVencidos ? 'true' : 'false'],
  [CHAVE_MODO_TEMA, tempThemePreference],
  [CHAVE_MODO_ACESSIBILIDADE, tempModoAcessibilidade ? 'true' : 'false'],
]);

setLoja(lojaNormalizada);
setCodigoLoja(codigoLojaNormalizado);
setRegional(regionalNormalizada);
setColaborador(tempColaborador);
setAutoExcluirVencidos(tempAutoExcluirVencidos);
setFrequenciaLembreteHoras(tempFrequenciaLembreteHoras);
setFrequenciaResumoRiscoHoras(tempFrequenciaResumoRiscoHoras);
setThemePreference(tempThemePreference);
setModoAcessibilidade(tempModoAcessibilidade);

if (mudouFrequenciaResumo) {
  await AsyncStorage.removeItem(CHAVE_ULTIMO_ALERTA_RISCO);
}

if (notificacoesHabilitadas && (mudouFrequenciaLembrete || mudouContextoLoja)) {
  const reagendado = await agendarLembreteRecorrente(true);
  if (reagendado) {
    exibirNotificacao(`Lembretes atualizados para Loja ${codigoLojaNormalizado || lojaNormalizada} a cada ${tempFrequenciaLembreteHoras}h.`);
  }
}

if (notificacoesHabilitadas && mudouContextoLoja) {
  await enviarNotificacaoLocal(
    'Configuracao de loja atualizada',
    `Novo contexto: Loja ${lojaNormalizada} (${codigoLojaNormalizado || 'SEM CODIGO'}) - Regional ${regionalNormalizada}.`
  );
}

await fecharConfiguracoes();
} catch {
Alert.alert("Erro", "Não foi possível guardar as definições.");
}
};

const limparBancoDeDados = () => {
Alert.alert("Atenção!", "Deseja apagar TODOS os dados da base de dados local?", [
{ text: "Cancelar", style: "cancel" },
{ text: "Apagar Tudo", style: "destructive", onPress: async () => {
try {
setIsLoading(true);
await fecharBancoAtual();
await SQLite.deleteDatabaseAsync('farmacia.db');
cacheEanMemoria.current = {};
setProdutos([]);
setHistorico([]);
await AsyncStorage.removeItem(CHAVE_BASE_INTERNA);
await AsyncStorage.setItem(CHAVE_PRIMEIRA_INSTALACAO, 'ok');
await inicializarApp();
await fecharConfiguracoes();
Alert.alert("Sucesso", "Base SQLite atual foi recriada com sucesso.");
} catch (error) {
const mensagem = error instanceof Error ? error.message : "Falha ao resetar a base SQLite atual.";
Alert.alert("Erro", mensagem);
} finally {
setIsLoading(false);
}
}}
]);
};

// ==========================================
// NOTIFICAÇÃO COM FADE IN/OUT
// ==========================================
const exibirNotificacao = useCallback((mensagem: string) => {
setMensagemNotificacao(mensagem);
setShowNotificacao(true);
opacidadeNotificacao.setValue(0);
deslocamentoNotificacao.setValue(-12);

Animated.sequence([
  Animated.parallel([
    Animated.timing(opacidadeNotificacao, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(deslocamentoNotificacao, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]),
  Animated.delay(3200),
  Animated.parallel([
    Animated.timing(opacidadeNotificacao, {
      toValue: 0,
      duration: 460,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(deslocamentoNotificacao, {
      toValue: -8,
      duration: 460,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]),
]).start(() => {
  setShowNotificacao(false);
});
}, [deslocamentoNotificacao, opacidadeNotificacao]);

const alternarLembretesRecorrentes = useCallback(async () => {
if (Platform.OS === 'web') {
  Alert.alert('Aviso', 'Notificacoes locais nao estao disponiveis na versao web.');
  return;
}

try {
  if (notificacoesHabilitadas) {
    const identificador = await AsyncStorage.getItem(CHAVE_NOTIFICACAO_LEMBRETE);
    if (identificador) {
      await Notifications.cancelScheduledNotificationAsync(identificador);
      await AsyncStorage.removeItem(CHAVE_NOTIFICACAO_LEMBRETE);
    }

    await AsyncStorage.removeItem(CHAVE_ULTIMO_ALERTA_RISCO);
    setNotificacoesHabilitadas(false);
    exibirNotificacao('Lembretes de auditoria desativados.');
    return;
  }

  const lembreteAtivado = await agendarLembreteRecorrente();
  if (lembreteAtivado) {
    exibirNotificacao(`Lembretes ativados. Novo aviso a cada ${frequenciaLembreteHoras}h.`);
    await enviarNotificacaoLocal(
      'Lembretes ativados',
      `Loja ${codigoLoja || loja} com alertas recorrentes a cada ${frequenciaLembreteHoras}h.`
    );
    return;
  }

  Alert.alert('Permissao necessaria', 'Para ativar lembretes, permita notificacoes quando solicitado.');
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Falha ao atualizar os lembretes locais.';
  Alert.alert('Erro', mensagem);
}
}, [agendarLembreteRecorrente, codigoLoja, exibirNotificacao, frequenciaLembreteHoras, loja, notificacoesHabilitadas, enviarNotificacaoLocal]);

// ==========================================
// DATE PICKER PARA VALIDADE
// ==========================================
const abrirDatePicker = () => {
setDataValidadeSelecionada(converterDataParaDate(novaValidade));
setShowDatePicker(true);
};

const confirmarDatePicker = async (novaData: Date) => {
const year = novaData.getFullYear();
const month = String(novaData.getMonth() + 1).padStart(2, '0');
const day = String(novaData.getDate()).padStart(2, '0');
setDataValidadeSelecionada(novaData);
setNovaValidade(`${year}-${month}-${day}`);
if (Platform.OS === 'ios') {
  await fecharDatePickerIOS();
} else {
  setShowDatePicker(false);
}
};

const aoMudarDatePicker = (evento: DateTimePickerEvent, data?: Date) => {
if (evento.type === 'dismissed') {
  if (Platform.OS === 'ios') {
    void fecharDatePickerIOS();
  } else {
    setShowDatePicker(false);
  }
  return;
}

const dataSelecionada = data ?? dataValidadeSelecionada;
setDataValidadeSelecionada(dataSelecionada);

if (Platform.OS === 'android') {
  void confirmarDatePicker(dataSelecionada);
}
};

const abrirDatePickerAdicional = () => {
setDataValidadeAdicionalSelecionada(new Date());
setShowDatePickerAdicional(true);
};

const confirmarDatePickerAdicional = async (novaData: Date) => {
const year = novaData.getFullYear();
const month = String(novaData.getMonth() + 1).padStart(2, '0');
const day = String(novaData.getDate()).padStart(2, '0');
const isoDate = `${year}-${month}-${day}`;
setNovasValidadesAdicionais(prev => prev.includes(isoDate) ? prev : [...prev, isoDate]);
if (Platform.OS === 'ios') {
  await fecharDatePickerAdicionalIOS();
} else {
  setShowDatePickerAdicional(false);
}
};

const aoMudarDatePickerAdicional = (evento: DateTimePickerEvent, data?: Date) => {
if (evento.type === 'dismissed') {
  if (Platform.OS === 'ios') {
    void fecharDatePickerAdicionalIOS();
  } else {
    setShowDatePickerAdicional(false);
  }
  return;
}
const dataSelecionada = data ?? dataValidadeAdicionalSelecionada;
setDataValidadeAdicionalSelecionada(dataSelecionada);
if (Platform.OS === 'android') {
  void confirmarDatePickerAdicional(dataSelecionada);
}
};

const abrirDatePickerHistorico = (alvo: 'inicio' | 'fim') => {
setAlvoDatePickerHistorico(alvo);
setDataHistoricoSelecionada(converterDataParaDate(alvo === 'inicio' ? filtroHistoricoDataInicio : filtroHistoricoDataFim));
setShowHistoricoDatePicker(true);
};

const confirmarDatePickerHistorico = async (novaData: Date) => {
const year = novaData.getFullYear();
const month = String(novaData.getMonth() + 1).padStart(2, '0');
const day = String(novaData.getDate()).padStart(2, '0');
const valorFormatado = `${year}-${month}-${day}`;
setDataHistoricoSelecionada(novaData);

if (alvoDatePickerHistorico === 'inicio') {
  setFiltroHistoricoDataInicio(valorFormatado);
} else {
  setFiltroHistoricoDataFim(valorFormatado);
}

if (Platform.OS === 'ios') {
  await fecharHistoricoDatePickerIOS();
} else {
  setShowHistoricoDatePicker(false);
}
};

const aoMudarDatePickerHistorico = (evento: DateTimePickerEvent, data?: Date) => {
if (evento.type === 'dismissed') {
  if (Platform.OS === 'ios') {
    void fecharHistoricoDatePickerIOS();
  } else {
    setShowHistoricoDatePicker(false);
  }
  return;
}

const dataSelecionada = data ?? dataHistoricoSelecionada;
setDataHistoricoSelecionada(dataSelecionada);

if (Platform.OS === 'android') {
  void confirmarDatePickerHistorico(dataSelecionada);
}
};

// ==========================================
// BUSCA ERP E POLÍTICA DE DESCONTO
// ==========================================
const buscarNaRedeDrogaria = useCallback(async (codigo: string) => {
if (!codigo || codigo === ultimoCodigoBuscado.current || editandoId || buscandoNaApi) return;
setBuscandoNaApi(true); ultimoCodigoBuscado.current = codigo;

try {
  const cadastroLocal = await buscarEanNoCache(codigo);
  if (cadastroLocal) {
    preencherCamposDoProduto(cadastroLocal);
    exibirNotificacao('Produto encontrado na base interna.');
    setBuscandoNaApi(false);
    return;
  }
  
  const fontes = [
    `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`,
    `https://br.openfoodfacts.org/api/v0/product/${codigo}.json`,
  ];
  
  for (const url of fontes) {
    try {
      const response = await fetch(url);
      const data = await response.json() as OpenFoodFactsResponse;
      if (data.status === 1 && data.product && (data.product.product_name || data.product.generic_name)) {
        const cadastroEncontrado = {
          codigo,
          nome: data.product.product_name || data.product.generic_name || '',
          apresentacao: data.product.quantity || '',
          embalagem: inferirTipoEmbalagem(data.product.quantity || '') || undefined,
          custo: 0,
          ...inferirMedidaDaApresentacao(data.product.quantity || ''),
        };

        preencherCamposDoProduto(cadastroEncontrado);
        await salvarEanNoCache(cadastroEncontrado);
        exibirNotificacao('Produto encontrado na busca online.');
        setBuscandoNaApi(false);
        return;
      }
    } catch {
      console.log(`Fonte ${url} indisponível`);
    }
  }
  
  setBuscandoNaApi(false);
} catch (erro) { console.log(erro); } finally { setBuscandoNaApi(false); }


}, [buscarEanNoCache, buscandoNaApi, editandoId, exibirNotificacao, preencherCamposDoProduto, salvarEanNoCache]);

// Gatilho de busca ao digitar EAN
useEffect(() => {
if ([8, 11, 12, 13, 14].includes(novoCodigo.length) && !editandoId) buscarNaRedeDrogaria(novoCodigo);
}, [buscarNaRedeDrogaria, editandoId, novoCodigo]);

// LEMBRETE VISUAL ENQUANTO O APP ESTIVER ABERTO
useEffect(() => {
const intervalo = setInterval(() => {
  exibirNotificacao('Lembrete: revise os produtos com vencimento proximo.');
}, frequenciaLembreteHoras * 60 * 60 * 1000);

return () => clearInterval(intervalo);
}, [exibirNotificacao, frequenciaLembreteHoras]);

const sanitizarTrechoArquivo = (valor: string) => valor
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '_')
  .replace(/^_+|_+$/g, '') || 'arquivo';

const salvarWorkbookEmArquivo = async (workbook: ExcelJS.Workbook, fileName: string) => {
const arquivo = new File(Paths.document, fileName);
const conteudoArray = await workbook.xlsx.writeBuffer();
arquivo.create({ intermediates: true, overwrite: true });
arquivo.write(conteudoArray instanceof Uint8Array ? conteudoArray : new Uint8Array(conteudoArray));
return arquivo;
};

// ==========================================
// EXPORTAÇÃO E IMPORTAÇÃO NATIVA (EXCEL)
// ==========================================
const exportarParaExcel = useCallback(async () => {
if (produtos.length === 0) return Alert.alert("Aviso", "Não há produtos para exportar.");
if (exportandoPlanilha) return;

const dataExportacao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fileName = `Validades_${sanitizarTrechoArquivo(codigoLoja || loja)}_${Date.now()}.xlsx`;

const montarLinhasProdutos = (lista: Produto[]) => [
  ['Loja', 'Codigo_Loja', 'Regional', 'Nome', 'Apresentacao', 'Embalagem', 'Codigo_EAN', 'Validade', 'Validades_Adicionais', 'Status', 'Quantidade', 'Colaborador', 'Status_Conferencia', 'Tipo_Medida', 'Conteudo_Embalagem', 'Observacao'],
  ...lista.map((p: Produto) => {
    const validadePrioritaria = extrairValidadeMaisProxima(p.validade, p.validades_adicionais);
    const adicionais = lerListaJson(p.validades_adicionais).map(formataDataBR).join(' | ');
    return [
      loja || '',
      codigoLoja || '',
      regional || '',
      p.nome || '',
      p.apresentacao || '',
      p.embalagem || inferirTipoEmbalagem(p.apresentacao) || '',
      p.codigo,
      p.validade,
      adicionais,
      obterStatusDesconto(validadePrioritaria).label,
      p.qtd,
      p.colaborador || '',
      p.status_conferencia || 'pendente',
      p.unidade_medida || 'unidades',
      p.quantidade_medida || 0,
      p.observacao || '',
    ];
  }),
];

const resumoExportacaoMap = new Map<string, { colaborador: string; qtd: number; risco: number; markdown: number }>();

for (const produto of produtos) {
  const chaveColaborador = produto.colaborador || 'Sem nome';
  const acumulado = resumoExportacaoMap.get(chaveColaborador) || { colaborador: chaveColaborador, qtd: 0, risco: 0, markdown: 0 };
  const status = obterStatusDesconto(extrairValidadeMaisProxima(produto.validade, produto.validades_adicionais)).tipo;
  acumulado.qtd += produto.qtd;
  if (status === 'retirar' || status === 'vencido') acumulado.risco += produto.qtd;
  if (status === 'markdown') acumulado.markdown += produto.qtd;
  resumoExportacaoMap.set(chaveColaborador, acumulado);
}

const planilhaResumoColaborador = [
  ['Loja', 'Codigo_Loja', 'Regional', 'Colaborador', 'Quantidade_Auditada', 'Risco_Imediato', 'Markdown'],
  ...Array.from(resumoExportacaoMap.values()).sort((a, b) => b.qtd - a.qtd).map((item) => [loja, codigoLoja || '', regional, item.colaborador, item.qtd, item.risco, item.markdown]),
];

const planilhaHistorico = [
  ['Loja', 'Codigo_Loja', 'Regional', 'Data_Hora', 'Acao', 'Nome', 'Codigo', 'Colaborador', 'Detalhes'],
  ...historico.map((item) => [loja, codigoLoja || '', regional, formatarDataHora(item.data_evento), item.acao, item.nome, item.codigo, item.colaborador, item.detalhes]),
];

try {
  setExportandoPlanilha(true);
  const workbook = new ExcelJS.Workbook();
  const worksheetTodos = workbook.addWorksheet('Produtos');
  [
    ['Loja', loja, 'Codigo Loja', codigoLoja || '-', 'Regional', regional, 'Data', dataExportacao],
    [],
    ...montarLinhasProdutos(produtos),
  ].forEach((linha) => worksheetTodos.addRow(linha));

  const worksheetVencidos = workbook.addWorksheet('Vencidos');
  montarLinhasProdutos(produtos.filter((produto) => obterStatusDesconto(extrairValidadeMaisProxima(produto.validade, produto.validades_adicionais)).tipo === 'vencido')).forEach((linha) => worksheetVencidos.addRow(linha));

  const worksheetProximos = workbook.addWorksheet('Proximos');
  montarLinhasProdutos(produtos.filter((produto) => {
    const status = obterStatusDesconto(extrairValidadeMaisProxima(produto.validade, produto.validades_adicionais)).tipo;
    return status === 'retirar' || status === 'markdown';
  })).forEach((linha) => worksheetProximos.addRow(linha));

  const worksheetResumo = workbook.addWorksheet('Resumo_Colaborador');
  planilhaResumoColaborador.forEach((linha) => worksheetResumo.addRow(linha));
  const worksheetHistorico = workbook.addWorksheet('Historico');
  planilhaHistorico.forEach((linha) => worksheetHistorico.addRow(linha));

  const arquivoExportacao = await salvarWorkbookEmArquivo(workbook, fileName);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(arquivoExportacao.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Compartilhar planilha de validades',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }

  exibirNotificacao(`Arquivo XLSX criado! (${produtos.length} produtos)`);
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Não foi possível exportar o ficheiro.';
  Alert.alert("Erro na exportação", mensagem);
} finally {
  setExportandoPlanilha(false);
}


}, [codigoLoja, exibirNotificacao, exportandoPlanilha, historico, loja, produtos, regional]);

const baixarModeloPlanilha = useCallback(async () => {
try {
  const fileName = `Modelo_Importacao_Validades_${Date.now()}.xlsx`;
  const workbook = new ExcelJS.Workbook();

  const worksheetModelo = workbook.addWorksheet('Modelo_Completo');
  [
    ['Nome', 'Codigo_EAN', 'Validade', 'Apresentacao', 'Quantidade', 'Colaborador', 'Lote', 'Observacao', 'Embalagem', 'Tipo_Medida', 'Conteudo_Embalagem', 'Status_Conferencia'],
    ['Dipirona 500mg', '7891234567890', '2026-12-31', 'Caixa com 20 comprimidos', '2', colaborador, 'L123', 'Exemplo de observacao', 'frasco', 'comprimidos', '20', 'pendente'],
  ].forEach((linha) => worksheetModelo.addRow(linha));

  const worksheetMinimo = workbook.addWorksheet('Modelo_Minimo');
  [
    ['Nome', 'Codigo_EAN', 'Validade'],
    ['Paracetamol 750mg', '7890001112223', '2026-10-15'],
  ].forEach((linha) => worksheetMinimo.addRow(linha));

  const worksheetInstrucoes = workbook.addWorksheet('Instrucoes');
  [
    ['Como importar'],
    ['1. A aba Modelo_Completo mostra todas as colunas aceitas.'],
    ['2. A aba Modelo_Minimo funciona apenas com Nome, Codigo_EAN e Validade.'],
    ['3. A ordem das colunas com cabecalho pode ser alterada.'],
    ['4. A validade deve estar em AAAA-MM-DD ou DD/MM/AAAA.'],
    ['5. O app aceita CSV e XLSX.'],
  ].forEach((linha) => worksheetInstrucoes.addRow(linha));

  const arquivoModelo = await salvarWorkbookEmArquivo(workbook, fileName);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(arquivoModelo.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Baixar modelo de importacao',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }

  exibirNotificacao('Modelo de importacao criado com sucesso.');
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Nao foi possivel gerar o modelo de importacao.';
  Alert.alert('Erro', mensagem);
}
}, [colaborador, exibirNotificacao]);

const animarSaidaBottomSheet = useCallback(() => new Promise<void>((resolve) => {
if (fechandoBottomSheetRef.current) {
  resolve();
  return;
}

fechandoBottomSheetRef.current = true;

Animated.parallel([
  Animated.timing(deslocamentoBottomSheet, {
    toValue: 36,
    duration: 220,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadePainelModal, {
    toValue: 0,
    duration: 180,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  }),
]).start(() => {
  fechandoBottomSheetRef.current = false;
  resolve();
});
}), [deslocamentoBottomSheet, opacidadePainelModal]);

const fecharResumoTurno = useCallback(async () => {
await animarSaidaBottomSheet();
setShowResumoTurno(false);
}, [animarSaidaBottomSheet]);

const fecharHistorico = useCallback(async () => {
await animarSaidaBottomSheet();
setShowHistorico(false);
}, [animarSaidaBottomSheet]);

const voltarDaSelecaoImportacao = useCallback(async () => {
await animarSaidaBottomSheet();
setShowImportPreview(false);
setItensImportacaoPreview([]);
setNomeArquivoImportacao('');
setFiltroImportPreview('');
}, [animarSaidaBottomSheet]);

const importarProdutosDaPreview = useCallback(async (listaProdutos: Produto[]) => {
if (importacaoEmAndamentoRef.current) return;

try {
  importacaoEmAndamentoRef.current = true;
  setImportandoPreview(true);
  const db = await abrirBanco();
  await db.withTransactionAsync(async () => {
    for (const p of listaProdutos) {
      const novoIdImportado = gerarId();
      await db.runAsync(
        'INSERT INTO produtos (id, nome, codigo, apresentacao, embalagem, unidade_medida, quantidade_medida, validade, validades_adicionais, custo, qtd, colaborador, lote, observacao, status_conferencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        novoIdImportado, p.nome, p.codigo, p.apresentacao || '', p.embalagem || '', p.unidade_medida || 'unidades', p.quantidade_medida || 0, p.validade, p.validades_adicionais || null, p.custo, p.qtd, p.colaborador, p.lote || '', p.observacao || '', p.status_conferencia || 'pendente'
      );
      await registrarHistorico({
        produto_id: novoIdImportado,
        acao: 'importacao',
        nome: p.nome,
        codigo: p.codigo,
        colaborador: p.colaborador,
        detalhes: `Qtd ${p.qtd} | Val ${p.validade}`,
        tipo_produto: obterTipoProduto(p),
      }, db);
    }
  });

  const todosProdutos = await db.getAllAsync('SELECT * FROM produtos');
  setProdutos(todosProdutos as Produto[]);
  await carregarHistorico();
  await voltarDaSelecaoImportacao();
  Alert.alert('Sucesso', `${listaProdutos.length} produtos importados com sucesso!`);
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Falha ao gravar importação na base de dados.';
  Alert.alert('Erro', mensagem);
} finally {
  importacaoEmAndamentoRef.current = false;
  setImportandoPreview(false);
}
}, [abrirBanco, carregarHistorico, registrarHistorico, voltarDaSelecaoImportacao]);

const importarDeExcel = async () => {
try {
const result = await DocumentPicker.getDocumentAsync({
type: TIPOS_PLANILHA,
copyToCacheDirectory: true
});

  if (result.canceled) return;

  const file = result.assets[0];
  const linhas = await lerPlanilhaComoLinhas(file);
  const novosProdutos: Produto[] = [];
  const inicioDados = linhas.findIndex((linha) => linhaPareceCabecalhoProdutos(linha.map((coluna) => String(coluna || ''))));
  const cabecalhoLinha = inicioDados >= 0 ? linhas[inicioDados] : [];
  const cabecalhos = cabecalhoLinha.map((coluna) => normalizarCabecalho(String(coluna || '')));
  const linhasDados = inicioDados >= 0 ? linhas.slice(inicioDados + 1) : linhas;
  
  for (let i = 0; i < linhasDados.length; i++) {
    const cols = linhasDados[i].map((coluna) => String(coluna || '').trim());
    if (cols.some(Boolean)) {
      const registro = cabecalhos.length
        ? cabecalhos.reduce<Record<string, string>>((acc, cabecalho, index) => {
            acc[cabecalho] = cols[index] || '';
            return acc;
          }, {})
        : {};

      const layoutMinimoSemCabecalho = !cabecalhos.length && cols.length === 3;

      const nome = cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_NOME_PRODUTO) : cols[0];
      const apresentacao = cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_APRESENTACAO) : (layoutMinimoSemCabecalho ? '' : cols[1]);
      const codigoBruto = cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_CODIGO_PRODUTO) : (layoutMinimoSemCabecalho ? cols[1] : cols[2]);
      const codigo = normalizarCodigoImportado(codigoBruto);
      const validade = cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_VALIDADE_PRODUTO) : (layoutMinimoSemCabecalho ? cols[2] : cols[3]);
      if (!nome || !codigo || !validade) continue;

      const validadeNormalizada = normalizarDataISO(validade);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(validadeNormalizada)) continue;

      const medidaInferida = inferirMedidaDaApresentacao(apresentacao);
      const embalagemInferida = inferirTipoEmbalagem(apresentacao);
      const possuiColunaCustoLegada = !cabecalhos.length && cols.length === 8;
      const possuiColunaMedida = !cabecalhos.length && cols.length >= 9;

      novosProdutos.push({
        id: gerarId(), 
        nome,
        apresentacao,
        embalagem: (cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_EMBALAGEM) : '') as TipoEmbalagem || embalagemInferida || undefined,
        codigo,
        unidade_medida: ((cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_UNIDADE) : (possuiColunaMedida ? cols[7] : '')) || medidaInferida.unidade_medida) as UnidadeMedida,
        quantidade_medida: parseNumeroMedida((cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_CONTEUDO) : (possuiColunaMedida ? cols[8] : String(medidaInferida.quantidade_medida))) || String(medidaInferida.quantidade_medida)),
        validade: validadeNormalizada,
        custo: 0,
        qtd: parseInt((cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_QUANTIDADE) : (layoutMinimoSemCabecalho ? '1' : cols[possuiColunaCustoLegada ? 6 : 5])) || '1', 10) || 1,
        colaborador: (cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_COLABORADOR) : (layoutMinimoSemCabecalho ? colaborador : cols[possuiColunaMedida ? 6 : (possuiColunaCustoLegada ? 7 : 6)])) || colaborador,
        lote: cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_LOTE) : '',
        observacao: cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_OBSERVACAO) : '',
        status_conferencia: normalizarStatusConferenciaImportado(cabecalhos.length ? obterValorPorCabecalho(registro, ALIASES_STATUS) : ''),
        validades_adicionais: undefined,
      });
    }
  }
  
  if (novosProdutos.length > 0) {
    setItensImportacaoPreview(novosProdutos);
    setNomeArquivoImportacao(file.name || 'Planilha selecionada');
    setFiltroImportPreview('');
    setShowImportPreview(true);
  } else {
    Alert.alert("Aviso", "Nenhum produto válido encontrado. Verifique se o arquivo CSV/XLSX contém nome, código e validade.");
  }
} catch {
  Alert.alert("Erro", "Falha ao ler o ficheiro.");
}


};

const importarBaseInternaEan = async () => {
try {
const result = await DocumentPicker.getDocumentAsync({
type: TIPOS_PLANILHA,
copyToCacheDirectory: true
});

  if (result.canceled) return;

  const file = result.assets[0];
  const linhas = await lerPlanilhaComoLinhas(file);

  if (linhas.length < 2) {
    Alert.alert('Aviso', 'A base interna precisa ter cabeçalho e pelo menos uma linha de dados.');
    return;
  }

  const cabecalhos = linhas[0].map((coluna) => normalizarCabecalho(coluna));
  const mapaCadastros = new Map<string, CadastroEan>();
  const arquivoAnvisa = cabecalhos.includes('numero_registro_cadastro') && cabecalhos.includes('nome_comercial');

  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].map((coluna) => String(coluna || '').trim());
    if (colunas.length < 2) continue;

    const registro = cabecalhos.reduce<Record<string, string>>((acc, cabecalho, index) => {
      acc[cabecalho] = colunas[index] || '';
      return acc;
    }, {});

    const codigo = normalizarCodigoImportado(obterValorPorCabecalho(registro, [
      'codigo_ean',
      'codigo',
      'ean',
      'gtin',
      'codigo_de_barras',
      'codigodebarras',
      'numero_registro_cadastro',
      'numero_registro',
      'registro',
      'registro_anvisa'
    ]));

    const nome = obterValorPorCabecalho(registro, [
      'nome',
      'descricao',
      'descricao_produto',
      'produto',
      'nome_produto',
      'nome_comercial',
      'nome_tecnico'
    ]);

    const classeRisco = obterValorPorCabecalho(registro, ['classe_risco']);
    const nomeTecnico = obterValorPorCabecalho(registro, ['nome_tecnico']);
    const apresentacao = obterValorPorCabecalho(registro, [
      'apresentacao',
      'apresentacao_comercial',
      'embalagem',
      'descricao_apresentacao'
    ]) || [classeRisco ? `Classe ${classeRisco}` : '', nomeTecnico].filter(Boolean).join(' | ');

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

  const novosCadastros = Array.from(mapaCadastros.values());

  if (novosCadastros.length === 0) {
    Alert.alert('Aviso', 'Nenhum código válido encontrado. Verifique se o arquivo possui colunas de registro/EAN e nome do produto.');
    return;
  }

  const db = await abrirBanco();
  cacheEanMemoria.current = {};

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ean_cache');

    for (const cadastro of novosCadastros) {
      await db.runAsync(
        `INSERT OR REPLACE INTO ean_cache (codigo, nome, apresentacao, embalagem, custo, unidade_medida, quantidade_medida, referencia, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cadastro.codigo,
        cadastro.nome,
        cadastro.apresentacao,
        cadastro.embalagem || inferirTipoEmbalagem(cadastro.apresentacao) || '',
        cadastro.custo,
        cadastro.unidade_medida || 'unidades',
        cadastro.quantidade_medida || 0,
        cadastro.referencia || '',
        Date.now()
      );
      cacheEanMemoria.current[cadastro.codigo] = cadastro;
    }
  });

  await AsyncStorage.setItem(CHAVE_BASE_INTERNA, `manual:${Date.now()}`);

  Alert.alert(
    'Base interna substituída',
    arquivoAnvisa
      ? `${novosCadastros.length} registros foram carregados e substituíram a base interna anterior.\n\nObservação: esse arquivo usa número de registro/cadastro, não EAN comercial.`
      : `${novosCadastros.length} códigos foram carregados e agora formam a nova base interna local.`
  );
} catch (error) {
  const mensagem = error instanceof Error ? error.message : 'Falha ao importar a base interna de EAN.';
  Alert.alert('Erro', mensagem);
}
};

// ==========================================
// AÇÕES CRUD SQLITE
// ==========================================
const acionarCamera = async () => {
if (!permission?.granted) {
const req = await requestPermission();
if (!req.granted) return Alert.alert("Permissão negada", "Precisamos da câmara para ler o EAN.");
}
setIsScanning(true);
};

const lidarComCodigoLido = ({ data }: { data: string }) => {
setIsScanning(false);

setNovoCodigo(data);
buscarNaRedeDrogaria(data);
};

const salvarProduto = async () => {
if (!novoNome || !novoCodigo || !novaValidade || !novaQtd) {
return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios!');
}

const persistir = async () => {
  try {
    const db = await abrirBanco();
    const qtdNum = parseInt(novaQtd, 10) || 1;
    const quantidadeMedidaNum = parseNumeroMedida(novaQuantidadeMedida);
    const embalagemFinal = novaEmbalagem || inferirTipoEmbalagem(novaApresentacao) || '';
    const loteFinal = novoLote.trim();
    const observacaoFinal = novaObservacao.trim();
    const validadeNormalizada = normalizarDataISO(novaValidade);
    const validadesJson = novasValidadesAdicionais.length > 0 ? JSON.stringify(novasValidadesAdicionais) : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(validadeNormalizada)) {
      Alert.alert('Erro', 'A validade precisa estar no formato AAAA-MM-DD ou DD/MM/AAAA.');
      return;
    }

    await db.withTransactionAsync(async () => {
      if (editandoId) {
        await db.runAsync(
          'UPDATE produtos SET nome = ?, codigo = ?, apresentacao = ?, embalagem = ?, unidade_medida = ?, quantidade_medida = ?, validade = ?, validades_adicionais = ?, custo = ?, qtd = ?, colaborador = ?, lote = ?, observacao = ?, status_conferencia = ? WHERE id = ?',
          novoNome.trim(), novoCodigo.trim(), novaApresentacao.trim(), embalagemFinal, novaUnidadeMedida, quantidadeMedidaNum, validadeNormalizada, validadesJson, 0, qtdNum, colaborador, loteFinal, observacaoFinal, novoStatusConferencia, editandoId
        );
        await registrarHistorico({
          produto_id: editandoId,
          acao: 'edicao',
          nome: novoNome.trim(),
          codigo: novoCodigo.trim(),
          colaborador,
          detalhes: `Qtd ${qtdNum} | Val ${validadeNormalizada} | Status ${novoStatusConferencia}`,
          tipo_produto: obterTipoProduto({ embalagem: embalagemFinal as TipoEmbalagem | undefined, unidade_medida: novaUnidadeMedida, apresentacao: novaApresentacao }),
        }, db);
      } else {
        const novoId = gerarId();
        await db.runAsync(
          'INSERT INTO produtos (id, nome, codigo, apresentacao, embalagem, unidade_medida, quantidade_medida, validade, validades_adicionais, custo, qtd, colaborador, lote, observacao, status_conferencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          novoId, novoNome.trim(), novoCodigo.trim(), novaApresentacao.trim(), embalagemFinal, novaUnidadeMedida, quantidadeMedidaNum, validadeNormalizada, validadesJson, 0, qtdNum, colaborador, loteFinal, observacaoFinal, novoStatusConferencia
        );
        await registrarHistorico({
          produto_id: novoId,
          acao: 'cadastro',
          nome: novoNome.trim(),
          codigo: novoCodigo.trim(),
          colaborador,
          detalhes: `Qtd ${qtdNum} | Val ${validadeNormalizada} | Status ${novoStatusConferencia}`,
          tipo_produto: obterTipoProduto({ embalagem: embalagemFinal as TipoEmbalagem | undefined, unidade_medida: novaUnidadeMedida, apresentacao: novaApresentacao }),
        }, db);
      }
    });

    const todosProdutos = await db.getAllAsync('SELECT * FROM produtos') as Produto[];
    setProdutos(todosProdutos);
    await carregarHistorico();
    limparFormulario();
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Não foi possível gravar na base de dados.';
    Alert.alert('Erro', mensagem);
  }
};

const alertasCadastro = gerarAlertasCadastro();
if (alertasCadastro.length > 0) {
  Alert.alert('Conferir cadastro', alertasCadastro.join('\n'), [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Salvar assim', onPress: () => { void persistir(); } },
  ]);
  return;
}

await persistir();


};

const iniciarEdicao = useCallback((p: Produto) => {
setEditandoId(p.id);
setNovoCodigo(p.codigo);
setNovoNome(p.nome);
setNovaApresentacao(p.apresentacao || '');
setNovaEmbalagem(p.embalagem || inferirTipoEmbalagem(p.apresentacao) || '');
setNovaUnidadeMedida(p.unidade_medida || inferirMedidaDaApresentacao(p.apresentacao).unidade_medida);
setNovaQuantidadeMedida(p.quantidade_medida ? String(p.quantidade_medida) : '');
setNovaQtd(p.qtd.toString());
setNovaValidade(p.validade);
const adicionais = lerListaJson(p.validades_adicionais);
setNovasValidadesAdicionais(adicionais);
setNovoLote(p.lote || '');
setNovaObservacao(p.observacao || '');
setNovoStatusConferencia((p.status_conferencia || 'pendente') as StatusConferencia);
setDataValidadeSelecionada(converterDataParaDate(p.validade));
setShowForm(true);
}, []);

const limparFormulario = () => {
setEditandoId(null);
setNovoNome('');
setNovoCodigo('');
setNovaApresentacao('');
setNovaEmbalagem('');
setNovaUnidadeMedida('unidades');
setNovaQuantidadeMedida('');
setNovaValidade('');
setNovasValidadesAdicionais([]);
setNovaQtd('');
setNovoLote('');
setNovaObservacao('');
setNovoStatusConferencia('pendente');
setDataValidadeSelecionada(new Date());
ultimoCodigoBuscado.current = '';
setShowForm(false);
};

const excluirProdutosSilenciosamente = useCallback(async (ids: string[]) => {
if (ids.length === 0) return 0;

const db = await abrirBanco();
const idsSet = new Set(ids);

await db.withExclusiveTransactionAsync(async (txn) => {
  for (const id of ids) {
    await txn.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  }
});

if (editandoId && idsSet.has(editandoId)) {
  limparFormulario();
}

const produtosAtualizados = await db.getAllAsync('SELECT * FROM produtos') as Produto[];
setProdutos(produtosAtualizados);
return ids.length;
}, [abrirBanco, editandoId]);

const removerProduto = useCallback((id: string) => {
Alert.alert("Excluir", "Tem a certeza que deseja remover este produto da base de dados?", [
{ text: "Cancelar", style: "cancel" },
{ text: "Excluir", style: "destructive", onPress: async () => {
try {
await excluirProdutosSilenciosamente([id]);
} catch (error) {
const mensagem = error instanceof Error ? error.message : "Falha ao apagar o produto.";
Alert.alert("Erro", mensagem);
}
}}
]);
}, [excluirProdutosSilenciosamente]);

useEffect(() => {
if (isLoading || !autoExcluirVencidos || produtos.length === 0) return;
if (confirmacaoAutoExclusaoAbertaRef.current) return;

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

const idsNaDataLimite = produtos
  .filter((produto) => {
    const valor = String(produto.validade || '').trim().replace(/^\uFEFF/, '');
    const partesBr = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const validadeIso = /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? valor
      : partesBr
        ? `${partesBr[3]}-${partesBr[2]}-${partesBr[1]}`
        : '';

    return Boolean(validadeIso) && validadeIso <= hojeIso;
  })
  .map((produto) => produto.id);

if (idsNaDataLimite.length === 0) return;
confirmacaoAutoExclusaoAbertaRef.current = true;
Alert.alert(
  'Excluir na data limite',
  `${idsNaDataLimite.length} produto(s) atingiram a data limite. Deseja excluir agora?`,
  [
    {
      text: 'Cancelar',
      style: 'cancel',
      onPress: () => {
        confirmacaoAutoExclusaoAbertaRef.current = false;
      },
    },
    {
      text: 'Excluir',
      style: 'destructive',
      onPress: async () => {
        try {
          const removidos = await excluirProdutosSilenciosamente(idsNaDataLimite);
          if (removidos > 0) {
            exibirNotificacao(`${removidos} produto(s) removido(s) na data limite.`);
          }
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Falha ao excluir os produtos na data limite.';
          Alert.alert('Erro', mensagem);
        } finally {
          confirmacaoAutoExclusaoAbertaRef.current = false;
        }
      },
    },
  ],
  {
    cancelable: true,
    onDismiss: () => {
      confirmacaoAutoExclusaoAbertaRef.current = false;
    },
  },
);
}, [autoExcluirVencidos, excluirProdutosSilenciosamente, exibirNotificacao, isLoading, produtos]);

// ==========================================
// CÁLCULOS DOS KPIS E FILTROS
// ==========================================
const termoBuscaAdiado = useDeferredValue(termoBusca);
const filtroImportPreviewAdiado = useDeferredValue(filtroImportPreview);

const produtosComAnalise = useMemo<ProdutoComAnalise[]>(() => {
return produtos.map((produto) => {
  const validadePrioritaria = extrairValidadeMaisProxima(produto.validade, produto.validades_adicionais);
  const statusValidade = obterStatusDesconto(validadePrioritaria);
  const diasAteValidade = obterDiasAteValidade(validadePrioritaria);
  const embalagemCalculada = produto.embalagem || inferirTipoEmbalagem(produto.apresentacao) || null;
  return {
    ...produto,
    statusValidade,
    diasAteValidade,
    embalagemCalculada,
    totalMedidoCalculado: formatarTotalMedido(produto),
  };
});
}, [produtos]);

const resumoKpis = useMemo(() => {
let totalQtdAuditada = 0;
let qtdRiscoImediato = 0;
let qtdMarkdown = 0;
let qtdVence7 = 0;
let qtdVence15 = 0;
let qtdVence30 = 0;
const resumoColaboradorMap = new Map<string, { colaborador: string; qtd: number; risco: number; markdown: number }>();

for (const produto of produtosComAnalise) {
  totalQtdAuditada += produto.qtd;

  if (produto.diasAteValidade >= 0 && produto.diasAteValidade <= 7) qtdVence7 += produto.qtd;
  if (produto.diasAteValidade >= 0 && produto.diasAteValidade <= 15) qtdVence15 += produto.qtd;
  if (produto.diasAteValidade >= 0 && produto.diasAteValidade <= 30) qtdVence30 += produto.qtd;

  if (produto.statusValidade.tipo === 'retirar' || produto.statusValidade.tipo === 'vencido') {
    qtdRiscoImediato += produto.qtd;
  } else if (produto.statusValidade.tipo === 'markdown') {
    qtdMarkdown += produto.qtd;
  }

  const chaveColaborador = produto.colaborador || 'Sem nome';
  const acumulado = resumoColaboradorMap.get(chaveColaborador) || { colaborador: chaveColaborador, qtd: 0, risco: 0, markdown: 0 };
  acumulado.qtd += produto.qtd;
  if (produto.statusValidade.tipo === 'retirar' || produto.statusValidade.tipo === 'vencido') acumulado.risco += produto.qtd;
  if (produto.statusValidade.tipo === 'markdown') acumulado.markdown += produto.qtd;
  resumoColaboradorMap.set(chaveColaborador, acumulado);
}

return {
  totalQtdAuditada,
  qtdRiscoImediato,
  qtdMarkdown,
  qtdVence7,
  qtdVence15,
  qtdVence30,
  resumoPorColaborador: Array.from(resumoColaboradorMap.values()).sort((a, b) => b.qtd - a.qtd),
};
}, [produtosComAnalise]);

const tiposHistoricoDisponiveis = useMemo(
  () => Array.from(new Set(historico.map((item) => item.tipo_produto || '').filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  [historico]
);

const historicoFiltrado = useMemo(() => historico.filter((item) => {
const dataEvento = new Date(item.data_evento);
dataEvento.setHours(0, 0, 0, 0);

if (filtroHistoricoDataInicio) {
  const dataInicio = converterDataParaDate(filtroHistoricoDataInicio);
  dataInicio.setHours(0, 0, 0, 0);
  if (dataEvento.getTime() < dataInicio.getTime()) return false;
}

if (filtroHistoricoDataFim) {
  const dataFim = converterDataParaDate(filtroHistoricoDataFim);
  dataFim.setHours(0, 0, 0, 0);
  if (dataEvento.getTime() > dataFim.getTime()) return false;
}

if (filtroHistoricoTipo !== 'todos' && (item.tipo_produto || '') !== filtroHistoricoTipo) return false;
return true;
}), [filtroHistoricoDataFim, filtroHistoricoDataInicio, filtroHistoricoTipo, historico]);

const termoImportacaoPreview = filtroImportPreviewAdiado.trim().toLowerCase();
const itensImportacaoPreviewFiltrados = useMemo(() => itensImportacaoPreview.filter((item) => {
if (!termoImportacaoPreview) return true;

const camposBusca = [
  item.nome,
  item.codigo,
  item.apresentacao || '',
  item.colaborador || '',
].map((valor) => valor.toLowerCase());

return camposBusca.some((valor) => valor.includes(termoImportacaoPreview));
}), [itensImportacaoPreview, termoImportacaoPreview]);

const resumoPreviewImportacao = useMemo(() => {
let validos = 0;
let vencidos = 0;

for (const produto of itensImportacaoPreview) {
  if (obterDiasAteValidade(produto.validade) >= 0) {
    validos += 1;
  } else {
    vencidos += 1;
  }
}

return {
  total: itensImportacaoPreview.length,
  validos,
  vencidos,
};
}, [itensImportacaoPreview]);

const produtosFiltrados = useMemo(() => {
const termoBuscaNormalizado = termoBuscaAdiado.trim().toLowerCase();
const filtroColaboradorNormalizado = filtroColaborador.trim().toLowerCase();

return produtosComAnalise.filter((produto) => {
  const correspondeBusca = !termoBuscaNormalizado
    || produto.nome.toLowerCase().includes(termoBuscaNormalizado)
    || produto.codigo.toLowerCase().includes(termoBuscaNormalizado);
  if (!correspondeBusca) return false;

  if (filtroValidade === 'vencidos') return produto.statusValidade.tipo === 'vencido';
  if (filtroValidade === 'proximos') return produto.statusValidade.tipo === 'retirar' || produto.statusValidade.tipo === 'markdown';
  if (filtroValidade === 'no_prazo') return produto.statusValidade.tipo === 'ok';

  if (filtroColaboradorNormalizado && !(produto.colaborador || '').toLowerCase().includes(filtroColaboradorNormalizado)) return false;
  if (filtroStatusConferencia !== 'todos' && (produto.status_conferencia || 'pendente') !== filtroStatusConferencia) return false;
  if (filtroUnidadeMedida !== 'todos' && (produto.unidade_medida || 'unidades') !== filtroUnidadeMedida) return false;
  if (filtroEmbalagem !== 'todos' && (produto.embalagemCalculada || '') !== filtroEmbalagem) return false;

  return true;
}).sort((a, b) => {
  const prioridade = (produto: ProdutoComAnalise) => {
    if (produto.statusValidade.tipo === 'vencido') return 0;
    if (produto.statusValidade.tipo === 'retirar') return 1;
    if (produto.statusValidade.tipo === 'markdown') return 2;
    return 3;
  };

  const prioridadeDiff = prioridade(a) - prioridade(b);
  if (prioridadeDiff !== 0) return prioridadeDiff;
  return a.diasAteValidade - b.diasAteValidade;
});
}, [filtroColaborador, filtroEmbalagem, filtroStatusConferencia, filtroUnidadeMedida, filtroValidade, produtosComAnalise, termoBuscaAdiado]);

const extraDataListaProdutos = useMemo(
  () => ({ modoAcessibilidade, produtoSwipeado, isDark }),
  [isDark, modoAcessibilidade, produtoSwipeado]
);

const totaisMedidosFiltrados = useMemo(() => resumirTotaisMedidos(produtosFiltrados), [produtosFiltrados]);
const { totalQtdAuditada, qtdMarkdown, qtdRiscoImediato, qtdVence7, qtdVence15, qtdVence30, resumoPorColaborador } = resumoKpis;
const totalMedidoPrincipal = totaisMedidosFiltrados[0] || 'Sem medida';
const totaisMedidosSecundarios = totaisMedidosFiltrados.slice(1, 3);
const embalagemAtual = inferirTipoEmbalagem(novaApresentacao);
const embalagemSelecionada = novaEmbalagem || embalagemAtual;
const filtrosAvancadosAtivos = [filtroColaborador, filtroStatusConferencia !== 'todos' ? filtroStatusConferencia : '', filtroUnidadeMedida !== 'todos' ? filtroUnidadeMedida : '', filtroEmbalagem !== 'todos' ? filtroEmbalagem : ''].filter(Boolean).length;

// ==========================================
// NOVOS: GRÁFICO, PDF
// ==========================================

const calcularDadosGrafico = useMemo(() => {
  const stats = { ok: 0, markdown: 0, retirar: 0, vencido: 0 };
  for (const p of produtosFiltrados) {
    stats[p.statusValidade.tipo]++;
  }
  return {
    labels: ['No Prazo', 'Markdown', 'Próximos', 'Vencidos'],
    datasets: [{ data: [stats.ok, stats.markdown, stats.retirar, stats.vencido] }],
  };
}, [produtosFiltrados]);

const exportarResumoPdfComTimestamp = useCallback(async () => {
  if (exportandoPdf) return;
  try {
    setExportandoPdf(true);
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: Arial; padding: 20px; color: #333;">
          <h1 style="text-align: center; color: #2C2E7D;">Resumo do Turno</h1>
          <p style="text-align: center; font-size: 12px; color: #666;">Data: ${dataFormatada} às ${horaFormatada}</p>
          <hr style="border: none; border-top: 2px solid #2C2E7D;" />
          
          <h2 style="color: #2C2E7D; border-bottom: 2px solid #2C2E7D; padding-bottom: 10px;">Informações da Loja</h2>
          <p><strong>Loja:</strong> ${loja}</p>
          <p><strong>Regional:</strong> ${regional}</p>
          <p><strong>Colaborador:</strong> ${colaborador}</p>
          
          <h2 style="color: #2C2E7D; border-bottom: 2px solid #2C2E7D; padding-bottom: 10px; margin-top: 20px;">KPIs do Turno</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f0f0f0; font-weight: bold;">Total Auditado (Qtd)</td>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">${totalQtdAuditada}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f0f0f0; font-weight: bold;">Risco Imediato</td>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f9f9f9; color: #d32f2f; font-weight: bold;">${qtdRiscoImediato}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f0f0f0; font-weight: bold;">Markdown</td>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f9f9f9; color: #f87315; font-weight: bold;">${qtdMarkdown}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f0f0f0; font-weight: bold;">Produtos (Filtro)</td>
              <td style="border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">${produtosFiltrados.length}</td>
            </tr>
          </table>
          
          <h2 style="color: #2C2E7D; border-bottom: 2px solid #2C2E7D; padding-bottom: 10px; margin-top: 20px;">Por Colaborador</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold;">Colaborador</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Auditados</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Risco</th>
            </tr>
            ${resumoPorColaborador.map((item) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.colaborador}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.qtd}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #d32f2f;">${item.risco}</td>
              </tr>
            `).join('')}
          </table>
          
          <hr style="border: none; border-top: 2px solid #2C2E7D; margin-top: 30px;" />
          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">Gerado por App de Validade v${VERSAO_APP}</p>
        </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Resumo do Turno - ${dataFormatada}`,
        UTI: 'com.adobe.pdf',
      });
    }
    
    exibirNotificacao('PDF gerado com sucesso!');
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao gerar PDF';
    Alert.alert('Erro', mensagem);
  } finally {
    setExportandoPdf(false);
  }
}, [exportandoPdf, loja, regional, colaborador, totalQtdAuditada, qtdRiscoImediato, qtdMarkdown, produtosFiltrados.length, resumoPorColaborador, exibirNotificacao]);

const renderAcoesSwipeDireita = useCallback((produto: ProdutoComAnalise) => (
  <View style={styles.swipeActionsWrap}>
    <TouchableOpacity style={[styles.swipeActionBtn, styles.swipeActionEdit]} onPress={() => iniciarEdicao(produto)}>
      <View style={styles.swipeIconBubbleEdit}><Edit2 size={16} /></View>
      <Text style={[styles.swipeActionText, styles.swipeActionTextEdit]}>Editar</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.swipeActionBtn, styles.swipeActionDelete]} onPress={() => removerProduto(produto.id)}>
      <View style={styles.swipeIconBubbleDelete}><Trash2 size={16} /></View>
      <Text style={[styles.swipeActionText, styles.swipeActionTextDelete]}>Excluir</Text>
    </TouchableOpacity>
  </View>
), [iniciarEdicao, removerProduto]);

const renderProdutoItem = useCallback(({ item: p }: { item: ProdutoComAnalise }) => {
  const { possuiMultiplasValidades, badgeTexto, extrasTexto } = obterResumoValidadesExtras(p.validades_adicionais);
  const validadePriorizada = extrairValidadeMaisProxima(p.validade, p.validades_adicionais);
  const statusEmRisco = p.statusValidade.tipo === 'retirar' || p.statusValidade.tipo === 'vencido';
  const mostrarDetalhes = Boolean(p.lote || p.observacao);

  return (
    <Swipeable
      ref={(instancia) => {
        swipeRefs.current[p.id] = instancia;
      }}
      overshootRight={false}
      rightThreshold={36}
      friction={2}
      overshootFriction={8}
      renderRightActions={() => renderAcoesSwipeDireita(p)}
      onSwipeableWillOpen={() => {
        const outroAberto = swipeAbertoRef.current;
        if (outroAberto && outroAberto !== p.id) {
          swipeRefs.current[outroAberto]?.close();
        }
        swipeAbertoRef.current = p.id;
        setProdutoSwipeado(p.id);
        void Haptics.selectionAsync();
      }}
      onSwipeableOpen={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onSwipeableClose={() => {
        if (swipeAbertoRef.current === p.id) swipeAbertoRef.current = null;
        setProdutoSwipeado((atual) => (atual === p.id ? null : atual));
      }}>
      <View style={[styles.cardProduto, isTablet && styles.cardProdutoWide, { backgroundColor: theme.surface, borderColor: theme.border }, produtoSwipeado === p.id && styles.cardProdutoSwipeOpen, modoAcessibilidade && { padding: a11y.cardPad, borderWidth: 2 }]}>
        <View style={[styles.cardTop, isCompact && styles.cardTopCompact]}>
          <View style={styles.cardHeaderInfo}>
            <Text style={[styles.prodNome, { color: theme.text, fontSize: a11y.fNome }]}>{p.nome}</Text>

            <View style={styles.tagsRow}>
              {p.apresentacao ? <View style={styles.tagApres}><Text style={styles.tagApresText}>{p.apresentacao}</Text></View> : null}
              {p.embalagemCalculada ? <View style={styles.tagEmbalagem}><Text style={styles.tagEmbalagemText}>{ROTULOS_TIPO_EMBALAGEM[p.embalagemCalculada]}</Text></View> : null}
              <View style={styles.tagTipo}><Text style={styles.tagTipoText}>{ROTULOS_UNIDADE_MEDIDA[p.unidade_medida || 'unidades']}</Text></View>
              <View style={styles.tagStatusConferencia}><Text style={styles.tagStatusConferenciaText}>{ROTULOS_STATUS_CONFERENCIA[(p.status_conferencia || 'pendente') as StatusConferencia]}</Text></View>
              <View style={[styles.tagColab, { backgroundColor: theme.chipBg, borderColor: theme.border }]}><User size={10} /><Text style={[styles.tagColabText, { color: theme.chipText }]}>{p.colaborador}</Text></View>
            </View>

            <View style={[styles.eanBox, { backgroundColor: theme.eanBg, borderColor: theme.border }]}><Barcode size={14} /><Text style={[styles.prodEan, { color: theme.chipText }]}>{p.codigo}</Text></View>
            {mostrarDetalhes ? (
              <View style={styles.detailList}>
                {p.lote ? <Text style={[styles.detailText, { color: theme.muted }]}>Lote: {p.lote}</Text> : null}
                {p.observacao ? <Text style={[styles.detailText, { color: theme.muted }]}>Obs: {p.observacao}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.cardBottom, isCompact && styles.cardBottomCompact]}>
          <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}><Text style={[styles.infoLabel, { color: theme.muted }]}>QTD</Text><Text style={[styles.infoValue, { color: theme.text, fontSize: a11y.fInfoValue }]}>{p.qtd}</Text></View>
          <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}><Text style={[styles.infoLabel, { color: theme.muted }]}>{p.totalMedidoCalculado ? 'TOTAL MEDIDO' : 'CÓDIGO'}</Text><Text style={[styles.infoValue, { color: theme.text, fontSize: a11y.fInfoValue }]}>{p.totalMedidoCalculado || p.codigo}</Text></View>
        </View>

        <View style={[styles.statusBoxFull, { backgroundColor: p.statusValidade.bg, borderColor: p.statusValidade.border }, modoAcessibilidade && { padding: 16, borderWidth: 2 }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabelTitle, { color: p.statusValidade.cor }, modoAcessibilidade && { fontSize: 13 }]}>VENCIMENTO</Text>
            <Text style={[styles.statusDateValue, { color: p.statusValidade.cor, fontSize: a11y.fStatus }]}>{formataDataBR(validadePriorizada)}</Text>
          </View>
          {possuiMultiplasValidades ? (
            <View style={styles.statusExtrasWrap}>
              <View style={styles.statusExtrasBadge}>
                <Text style={styles.statusExtrasBadgeText}>{badgeTexto}</Text>
              </View>
              <Text style={[styles.statusExtrasText, { color: theme.muted }]}>{extrasTexto}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBigTag, modoAcessibilidade && { padding: 12 }]}>
            {statusEmRisco && <AlertTriangle size={a11y.iconSize} />}
            <Text style={[styles.statusBigTagText, { color: p.statusValidade.cor, fontSize: a11y.fStatusTag }]}>{p.statusValidade.label}</Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}, [a11y, isCompact, isTablet, modoAcessibilidade, produtoSwipeado, renderAcoesSwipeDireita, theme.border, theme.borderSoft, theme.chipBg, theme.chipText, theme.eanBg, theme.muted, theme.surface, theme.surfaceAlt, theme.text]);

const renderListaHeader = (
  <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
      <View style={[styles.kpiCard, { backgroundColor: '#565DF0', width: larguraKpi }, isCompact && styles.kpiCardCompact]}>
        <View style={styles.kpiIconBox}><Package size={24} /></View>
        <Text style={styles.kpiLabel}>TOTAL AUDITADO (QTD)</Text>
        <Text style={styles.kpiValue}>{totalQtdAuditada}</Text>
      </View>
      <View style={[styles.kpiCard, { backgroundColor: '#0F766E', width: larguraKpi }, isCompact && styles.kpiCardCompact]}>
        <View style={styles.kpiIconBox}><Activity size={24} /></View>
        <Text style={styles.kpiLabel}>TOTAL MEDIDO (FILTRO)</Text>
        <Text style={styles.kpiValueCompact}>{totalMedidoPrincipal}</Text>
        {totaisMedidosSecundarios.map((total) => (
          <Text key={total} style={styles.kpiSubvalue}>{total}</Text>
        ))}
        <Text style={styles.kpiHint}>{produtosFiltrados.length} itens visíveis</Text>
      </View>
      <View style={[styles.kpiCard, { backgroundColor: '#F87315', width: larguraKpi }, isCompact && styles.kpiCardCompact]}>
        <View style={styles.kpiIconBox}><Package size={24} /></View>
        <Text style={styles.kpiLabel}>ITENS EM MARKDOWN</Text>
        <Text style={styles.kpiValue}>{qtdMarkdown}</Text>
      </View>
      <TouchableOpacity style={[styles.kpiCard, { backgroundColor: '#ED3D3D', marginRight: 32, width: larguraKpi }, isCompact && styles.kpiCardCompact]} onPress={() => setShowResumoTurno(true)}>
        <View style={styles.kpiIconBox}><AlertTriangle size={24} /></View>
        <Text style={styles.kpiLabel}>RISCO IMEDIATO (QTD)</Text>
        <Text style={styles.kpiValue}>{qtdRiscoImediato}</Text>
        <Text style={styles.kpiHint}>Ver pendências</Text>
      </TouchableOpacity>
    </ScrollView>

    <View style={styles.toolbar}>
      <Text style={[styles.sectionTitle, { color: theme.title }]}>Operação do Dia ({produtosFiltrados.length})</Text>
      <View style={[styles.actionRow, isCompact && styles.actionRowCompact]}>
         <TouchableOpacity style={[styles.btnOutline, { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' }, isCompact && styles.btnOutlineCompact, isTablet && styles.btnOutlineWide]} onPress={() => setShowFiltrosAvancados(true)}>
           <Search size={16} />
           <Text style={[styles.btnOutlineText, { color: '#4338CA' }]}>Filtros Avançados {filtrosAvancadosAtivos ? `(${filtrosAvancadosAtivos})` : ''}</Text>
         </TouchableOpacity>
      </View>
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search size={18} />
        <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar por nome ou EAN..." placeholderTextColor={theme.muted} value={termoBusca} onChangeText={setTermoBusca} />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.chipBg }, filtroValidade === 'todos' && styles.filterChipActive]} onPress={() => setFiltroValidade('todos')}>
          <Text style={[styles.filterChipText, { color: theme.chipText }, filtroValidade === 'todos' && styles.filterChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.chipBg }, filtroValidade === 'no_prazo' && styles.filterChipActive]} onPress={() => setFiltroValidade('no_prazo')}>
          <Text style={[styles.filterChipText, { color: theme.chipText }, filtroValidade === 'no_prazo' && styles.filterChipTextActive]}>No Prazo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.chipBg }, filtroValidade === 'proximos' && styles.filterChipActive]} onPress={() => setFiltroValidade('proximos')}>
          <Text style={[styles.filterChipText, { color: theme.chipText }, filtroValidade === 'proximos' && styles.filterChipTextActive]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filtroValidade === 'vencidos' && styles.filterChipDanger]} onPress={() => setFiltroValidade('vencidos')}>
          <Text style={[styles.filterChipText, filtroValidade === 'vencidos' && styles.filterChipDangerText]}>Vencidos</Text>
        </TouchableOpacity>
      </View>
      {(filtroValidade !== 'todos' || filtrosAvancadosAtivos > 0) && (
        <TouchableOpacity
          style={styles.clearFiltersBtn}
          onPress={() => {
            setFiltroValidade('todos');
            setFiltroColaborador('');
            setFiltroStatusConferencia('todos');
            setFiltroUnidadeMedida('todos');
            setFiltroEmbalagem('todos');
          }}>
          <X size={13} />
          <Text style={styles.clearFiltersBtnText}>Limpar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  </>
);

useEffect(() => {
if (Platform.OS === 'web') return;

const avaliarResumoDeRisco = async () => {
  if (!notificacoesHabilitadas) return;
  if (qtdRiscoImediato <= 0 && qtdVence7 <= 0 && qtdVence15 <= 0) return;

  const ultimoAlerta = await AsyncStorage.getItem(CHAVE_ULTIMO_ALERTA_RISCO);
  const agora = Date.now();
  if (ultimoAlerta && agora - Number(ultimoAlerta) < frequenciaResumoRiscoHoras * 60 * 60 * 1000) return;

  const partes: string[] = [];
  if (qtdRiscoImediato > 0) partes.push(`${qtdRiscoImediato} em acao imediata`);
  if (qtdVence7 > 0) partes.push(`${qtdVence7} vencendo em ate 7 dias`);
  if (qtdVence15 > 0) partes.push(`${qtdVence15} vencendo em ate 15 dias`);

  if (partes.length === 0) return;
  const resumo = partes.join(' • ');

  const tituloAlerta = codigoLoja ? `Produtos em alerta - Loja ${codigoLoja}` : 'Produtos em alerta';
  await enviarNotificacaoLocal(tituloAlerta, `${resumo}. Regional ${regional}.`);
  await AsyncStorage.setItem(CHAVE_ULTIMO_ALERTA_RISCO, String(agora));
};

void avaliarResumoDeRisco();
}, [codigoLoja, enviarNotificacaoLocal, frequenciaResumoRiscoHoras, notificacoesHabilitadas, qtdRiscoImediato, qtdVence7, qtdVence15, regional]);

useEffect(() => {
if (!showMenuLateral) return;

deslocamentoSidebar.setValue(28);
opacidadePainelModal.setValue(0);

Animated.parallel([
  Animated.timing(deslocamentoSidebar, {
    toValue: 0,
    duration: 300,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadePainelModal, {
    toValue: 1,
    duration: 260,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }),
]).start();
}, [deslocamentoSidebar, opacidadePainelModal, showMenuLateral]);

useEffect(() => {
if (!showMenuLateral) return;

const carregarResumoBaseInterna = async () => {
  try {
    const versao = await AsyncStorage.getItem(CHAVE_BASE_INTERNA);
    setVersaoBaseInternaAtual(versao || '');
  } catch {
    setVersaoBaseInternaAtual('');
  }
};

void carregarResumoBaseInterna();
}, [showMenuLateral]);

const algumBottomSheetAberto = showResumoTurno || showHistorico || showImportPreview;
const algumDialogoCentralAberto = showConfig || showFiltrosAvancados || showGraficoStatus || (showDatePickerAdicional && Platform.OS === 'ios') || (showDatePicker && Platform.OS === 'ios') || (showHistoricoDatePicker && Platform.OS === 'ios');

useEffect(() => {
if (!algumBottomSheetAberto) return;

deslocamentoBottomSheet.setValue(36);
opacidadePainelModal.setValue(0);

Animated.parallel([
  Animated.timing(deslocamentoBottomSheet, {
    toValue: 0,
    duration: 320,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadePainelModal, {
    toValue: 1,
    duration: 260,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }),
]).start();
}, [algumBottomSheetAberto, deslocamentoBottomSheet, opacidadePainelModal]);

useEffect(() => {
if (!algumDialogoCentralAberto) return;

deslocamentoDialogo.setValue(12);
escalaDialogo.setValue(0.96);
opacidadeDialogo.setValue(0);

Animated.parallel([
  Animated.timing(deslocamentoDialogo, {
    toValue: 0,
    duration: 240,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(escalaDialogo, {
    toValue: 1,
    duration: 240,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(opacidadeDialogo, {
    toValue: 1,
    duration: 220,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }),
]).start();
}, [algumDialogoCentralAberto, deslocamentoDialogo, escalaDialogo, opacidadeDialogo]);

// ==========================================
// RENDER UI NATIVO
// ==========================================
if (isLoading) {
return (
<LinearGradient colors={['#151B54', '#2A3492', '#3B42CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.splashLoadingWrap}>
  <View style={styles.splashGlowOrb} />
  <View style={styles.splashBrandCard}>
    <Image source={require('../../assets/images/farmacheck.png')} style={styles.splashBrandLogo} resizeMode="contain" />
    <Text style={styles.splashBrandTitle}>FarmaCheck</Text>
  </View>
  <ActivityIndicator size="small" color="#E2E8F0" />
</LinearGradient>
);
}

if (isScanning) {
return (
<SafeAreaView style={styles.cameraContainer}>
<View style={styles.cameraHeader}>
<Text style={styles.cameraTitle}>Aponte para o EAN</Text>
<TouchableOpacity onPress={() => setIsScanning(false)} style={styles.btnFecharCamera}><X /></TouchableOpacity>
</View>
<CameraView
style={styles.camera}
onBarcodeScanned={lidarComCodigoLido}
barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a"] }}
/>
<View style={styles.cameraOverlay}>
<View style={styles.cameraTarget} />
</View>
</SafeAreaView>
);
}

return (
<SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
  
  {/* NOTIFICAÇÃO COM FADE */}
  {showNotificacao && (
    <Animated.View style={[styles.notificacao, { opacity: opacidadeNotificacao, transform: [{ translateY: deslocamentoNotificacao }] }]}> 
      <Bell size={16} />
      <Text style={styles.notificacaoText}>{mensagemNotificacao}</Text>
    </Animated.View>
  )}

  {/* HEADER */}
  <View style={[styles.header, isCompact && styles.headerCompact, isTablet && styles.headerWide, { backgroundColor: theme.headerBg }]}>
    <View style={[styles.headerLeft, isCompact && styles.headerLeftCompact]}>
      <TouchableOpacity style={styles.headerIconButton} onPress={() => setShowMenuLateral(true)}>
        <Warehouse size={isCompact ? 28 : 32} />
      </TouchableOpacity>
      <View style={styles.headerTextWrap}>
        <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>FARMACHECK</Text>
        <View style={[styles.badgesWrap, isCompact && styles.badgesWrapCompact]}>
          <View style={[styles.badgeTop, { backgroundColor: theme.headerPanelBg, borderColor: theme.headerPanelBorder }]}><Text style={styles.badgeTopText}>Lj: {loja}</Text></View>
          <View style={[styles.badgeTop, { backgroundColor: theme.headerPanelBg, borderColor: theme.headerPanelBorder }]}><Text style={styles.badgeTopText}>Cod: {codigoLoja || '-'}</Text></View>
          <View style={[styles.badgeTop, { backgroundColor: theme.headerPanelBg, borderColor: theme.headerPanelBorder }]}><Text style={styles.badgeTopText}>Reg: {regional}</Text></View>
        </View>
      </View>
    </View>
    <View style={[styles.colabBox, isCompact && styles.colabBoxCompact, isTablet && styles.colabBoxWide, { backgroundColor: theme.headerPanelBg, borderColor: theme.headerPanelBorder }]}>
      <Text style={styles.colabLabel}>COLABORADOR:</Text>
      <Text style={styles.colabName}>{colaborador || 'Sem Nome'}</Text>
    </View>
  </View>

  <FlatList
    style={[styles.content, { backgroundColor: theme.background }]}
    contentContainerStyle={[styles.contentContainer, isTablet && styles.contentContainerWide]}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    data={produtosFiltrados}
    renderItem={renderProdutoItem}
    keyExtractor={(item) => item.id}
    extraData={extraDataListaProdutos}
    ListHeaderComponent={renderListaHeader}
    ListFooterComponent={<View style={{height: 88}} />}
    removeClippedSubviews={Platform.OS === 'android'}
    initialNumToRender={10}
    maxToRenderPerBatch={12}
    updateCellsBatchingPeriod={50}
    windowSize={7}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={recarregarProdutos} colors={['#565DF0']} tintColor="#565DF0" />
    }
  />

  {/* FAB - Botão Flutuante */}
  <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
    <Plus size={32} />
  </TouchableOpacity>

  {/* MODAL: FORMULÁRIO DE REGISTO */}
  <Modal visible={showForm} animationType="fade" presentationStyle="formSheet" onRequestClose={limparFormulario}>
    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.modalHeader, isCompact && styles.modalHeaderCompact, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}> 
        <View style={[styles.modalHeadingWrap, isCompact && styles.modalHeadingWrapCompact]}>
          {editandoId ? <Edit size={isCompact ? 24 : 28}/> : <Activity size={isCompact ? 24 : 28}/>}
          <Text numberOfLines={2} style={[styles.modalTitle, isCompact && styles.modalTitleCompact, {color: editandoId ? '#F97316' : theme.title}]}>{editandoId ? 'Editar Produto' : 'Novo Registo'}</Text>
        </View>
        <TouchableOpacity onPress={limparFormulario} style={[styles.btnCloseModal, { backgroundColor: theme.closeBg }]}><X size={isCompact ? 22 : 24} /></TouchableOpacity>
      </View>
      
      <ScrollView style={[styles.formBody, isTablet && styles.formBodyWide]} contentContainerStyle={styles.formBodyContent} keyboardShouldPersistTaps="handled">
        {buscandoNaApi && <Text style={[styles.buscando, { color: '#60A5FA' }]}>Buscando dados na internet...</Text>}

        <Text style={[styles.label, { color: theme.muted }]}>CÓDIGO DE BARRAS (EAN)</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novoCodigo} onChangeText={setNovoCodigo} keyboardType="numeric" placeholder="Digite ou bipe..." placeholderTextColor={theme.muted} maxLength={14} />
          <TouchableOpacity style={[styles.btnCamera, isCompact && styles.btnCameraCompact]} onPress={() => { void acionarCamera(); }}><Camera size={24}/></TouchableOpacity>
        </View>
        <Text style={[styles.autoSearchHint, { color: isDark ? '#93C5FD' : '#4338CA' }]}>Ao bipar ou digitar o EAN, o app consulta a base interna automaticamente antes da busca online.</Text>

        <Text style={[styles.label, { color: theme.muted }]}>NOME DO PRODUTO *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novoNome} onChangeText={setNovoNome} placeholder="Ex: Dipirona 500mg" placeholderTextColor={theme.muted} />

        <Text style={[styles.label, { color: theme.muted }]}>APRESENTAÇÃO</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novaApresentacao} onChangeText={setNovaApresentacao} placeholder="Ex: 30 comprimidos / 120 ml / 20 g" placeholderTextColor={theme.muted} />
        {embalagemSelecionada ? (
          <>
            <Text style={[styles.label, { color: theme.muted }]}>EMBALAGEM IDENTIFICADA</Text>
            <View style={styles.packagePreview}>
              <Text style={styles.packagePreviewText}>{ROTULOS_TIPO_EMBALAGEM[embalagemSelecionada as TipoEmbalagem]}</Text>
            </View>
          </>
        ) : null}

        <Text style={[styles.label, {color: '#B91C1C'}]}>MEDIDA PARA CÁLCULO *</Text>
        <View style={styles.measureOptionsWrap}>
          {OPCOES_UNIDADE_MEDIDA.map((opcao) => (
            <TouchableOpacity
              key={opcao.valor}
              style={[styles.measureChip, novaUnidadeMedida === opcao.valor && styles.measureChipActive]}
              onPress={() => setNovaUnidadeMedida(opcao.valor)}>
              <Text style={[styles.measureChipText, novaUnidadeMedida === opcao.valor && styles.measureChipTextActive]}>{opcao.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.measureHint, { color: theme.subtle }]}>A embalagem fica separada. Ex.: frasco com 120 ml continua calculando em ml.</Text>

        <Text style={[styles.label, { color: theme.muted }]}>CONTEÚDO POR EMBALAGEM</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novaQuantidadeMedida} onChangeText={setNovaQuantidadeMedida} keyboardType="decimal-pad" placeholder="Ex: 30, 120, 20" placeholderTextColor={theme.muted} />

        <Text style={[styles.label, { color: theme.muted }]}>STATUS DE CONFERÊNCIA</Text>
        <View style={styles.measureOptionsWrap}>
          {(['pendente', 'conferido', 'resolvido'] as StatusConferencia[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.measureChip, novoStatusConferencia === status && styles.measureChipActive]}
              onPress={() => setNovoStatusConferencia(status)}>
              <Text style={[styles.measureChipText, novoStatusConferencia === status && styles.measureChipTextActive]}>{ROTULOS_STATUS_CONFERENCIA[status]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.muted }]}>OBSERVAÇÃO</Text>
        <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novaObservacao} onChangeText={setNovaObservacao} placeholder="Observações do item" placeholderTextColor={theme.muted} multiline numberOfLines={3} />

        <Text style={[styles.label, { color: theme.muted }]}>QUANTIDADE *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={novaQtd} onChangeText={setNovaQtd} keyboardType="number-pad" placeholder="1" placeholderTextColor={theme.muted} />

        <Text style={[styles.label, { color: theme.muted }]}>VALIDADE *</Text>
        <TouchableOpacity style={[styles.dateField, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={abrirDatePicker}>
          <Text style={[styles.dateFieldText, { color: theme.text }, !novaValidade && styles.dateFieldPlaceholder, !novaValidade && { color: theme.muted }]}>{novaValidade ? formataDataBR(novaValidade) : 'Selecionar no calendário'}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.muted, marginTop: 16 }]}>VALIDADES EXTRAS</Text>
        {novasValidadesAdicionais.map((v, idx) => (
          <View key={idx} style={[styles.validadeAdicionalRow, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.validadeAdicionalText, { color: theme.text }]}>{formataDataBR(v)}</Text>
            <TouchableOpacity onPress={() => setNovasValidadesAdicionais(prev => prev.filter((_, i) => i !== idx))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.btnAddValidade, { borderColor: theme.border }]} onPress={abrirDatePickerAdicional}>
          <Plus size={16} color="#565DF0" />
          <Text style={styles.btnAddValidadeText}>Adicionar validade extra</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnSalvar, {backgroundColor: editandoId ? '#F97316' : '#565DF0'}]} onPress={salvarProduto}>
          <Check size={24}/>
          <Text style={styles.btnSalvarText}>{editandoId ? 'Atualizar DB' : 'Gravar no SQLite'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  </Modal>

  {/* MODAL: CONFIGURAÇÕES */}
  <Modal visible={showConfig} transparent={true} animationType="fade" onRequestClose={fecharConfiguracoes}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharConfiguracoes} />
      <Animated.View style={[styles.dialogBox, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
           <Text style={[styles.dialogTitle, { color: theme.title }]}>Definições</Text>
           <TouchableOpacity onPress={fecharConfiguracoes}><X/></TouchableOpacity>
        </View>
        

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: theme.muted }]}>NOME DO COLABORADOR</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={tempColaborador} onChangeText={setTempColaborador} placeholderTextColor={theme.muted} />

          <View style={[styles.row, isCompact && { flexDirection: 'column' }]}>
            <View style={{ flex: 1, marginRight: isCompact ? 0 : 10 }}>
            <Text style={[styles.label, { color: theme.muted }]}>LOJA ATUAL</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={tempLoja} onChangeText={setTempLoja} autoCapitalize="characters" placeholderTextColor={theme.muted} />
          </View>
            <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>CÓDIGO DA LOJA</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={tempCodigoLoja} onChangeText={(valor) => setTempCodigoLoja(extrairSomenteNumeros(valor))} keyboardType="number-pad" placeholder="Ex: 102" placeholderTextColor={theme.muted} />
          </View>
        </View>

          <View style={[styles.row, isCompact && { flexDirection: 'column' }]}>
            <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>REGIONAL</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={tempRegional} onChangeText={setTempRegional} autoCapitalize="characters" placeholderTextColor={theme.muted} />
          </View>
        </View>

        <Text style={[styles.label, { color: theme.muted }]}>APARÊNCIA</Text>
        <View style={styles.measureOptionsWrap}>
          {([
            ['system', 'Sistema'],
            ['light', 'Claro'],
            ['dark', 'Escuro'],
          ] as [ThemePreference, string][]).map(([modo, rotulo]) => {
            const ativo = tempThemePreference === modo;
            return (
              <TouchableOpacity
                key={modo}
                style={[
                  styles.measureChip,
                  { backgroundColor: theme.chipBg, borderColor: theme.border },
                  ativo && styles.measureChipActive,
                ]}
                onPress={() => setTempThemePreference(modo)}>
                <Text
                  style={[
                    styles.measureChipText,
                    { color: theme.chipText },
                    ativo && styles.measureChipTextActive,
                  ]}>
                  {rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.muted }]}>ACESSIBILIDADE</Text>
        <TouchableOpacity style={[styles.configOptionCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} activeOpacity={0.85} onPress={() => setTempModoAcessibilidade((v) => !v)}>
          <View style={styles.configOptionTextWrap}>
            <Text style={[styles.configOptionTitle, { color: theme.text }]}>Modo de acessibilidade</Text>
            <Text style={[styles.configOptionDescription, { color: theme.muted }]}>
              Aumenta o texto, o espaçamento e o contraste dos cards para facilitar a leitura.
            </Text>
          </View>
          <View style={[styles.configToggle, tempModoAcessibilidade && styles.configToggleActive]}>
            <View style={[styles.configToggleThumb, tempModoAcessibilidade && styles.configToggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.muted }]}>EXCLUSÃO AUTOMÁTICA</Text>
        <TouchableOpacity style={[styles.configOptionCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} activeOpacity={0.85} onPress={() => setTempAutoExcluirVencidos((estadoAtual) => !estadoAtual)}>
          <View style={styles.configOptionTextWrap}>
            <Text style={[styles.configOptionTitle, { color: theme.text }]}>Excluir na data limite</Text>
            <Text style={[styles.configOptionDescription, { color: theme.muted }]}>
              Quando ativado, produtos com validade hoje ou anterior entram em fila de exclusão ao abrir o app ou atualizar a lista, com confirmação antes de remover.
            </Text>
          </View>
          <View style={[styles.configToggle, tempAutoExcluirVencidos && styles.configToggleActive]}>
            <View style={[styles.configToggleThumb, tempAutoExcluirVencidos && styles.configToggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.muted }]}>FREQUÊNCIA DE NOTIFICAÇÕES</Text>
        <Text style={[styles.configOptionDescription, { color: theme.muted, marginBottom: 8 }]}>Lembrete recorrente</Text>
        <View style={styles.measureOptionsWrap}>
          {OPCOES_FREQUENCIA_LEMBRETE_HORAS.map((horas) => {
            const ativo = tempFrequenciaLembreteHoras === horas;
            return (
              <TouchableOpacity
                key={`lembrete-${horas}`}
                style={[
                  styles.measureChip,
                  { backgroundColor: theme.chipBg, borderColor: theme.border },
                  ativo && styles.measureChipActive,
                ]}
                onPress={() => setTempFrequenciaLembreteHoras(horas)}>
                <Text style={[styles.measureChipText, { color: theme.chipText }, ativo && styles.measureChipTextActive]}>{horas}h</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.configOptionDescription, { color: theme.muted, marginBottom: 8 }]}>Resumo de risco</Text>
        <View style={styles.measureOptionsWrap}>
          {OPCOES_FREQUENCIA_ALERTA_RISCO_HORAS.map((horas) => {
            const ativo = tempFrequenciaResumoRiscoHoras === horas;
            return (
              <TouchableOpacity
                key={`risco-${horas}`}
                style={[
                  styles.measureChip,
                  { backgroundColor: theme.chipBg, borderColor: theme.border },
                  ativo && styles.measureChipActive,
                ]}
                onPress={() => setTempFrequenciaResumoRiscoHoras(horas)}>
                <Text style={[styles.measureChipText, { color: theme.chipText }, ativo && styles.measureChipTextActive]}>{horas}h</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.btnDialogAction} onPress={salvarConfiguracoes}>
          <Text style={styles.btnDialogActionText}>Guardar Alterações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnDialogAction, styles.btnDialogSecondary]} onPress={fecharConfiguracoes}>
          <Text style={styles.btnDialogSecondaryText}>Fechar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDialogDanger} onPress={limparBancoDeDados}>
          <Text style={styles.btnDialogDangerText}>Apagar Base de Dados (SQLite)</Text>
        </TouchableOpacity>
          </ScrollView>
      </Animated.View>
    </View>
  </Modal>

  <Modal visible={showMenuLateral} transparent={true} animationType="fade" onRequestClose={fecharMenuLateral}>
    <View style={[styles.sidebarOverlay, { backgroundColor: theme.sidebarOverlay }]}>
      <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={fecharMenuLateral} />
      <Animated.View style={[styles.sidebarPanel, { backgroundColor: theme.surface, opacity: opacidadePainelModal, transform: [{ translateX: deslocamentoSidebar }] }]}> 
        <View style={styles.sidebarHeader}>
          <View>
            <Text style={[styles.sidebarTitle, { color: theme.text }]}>Menu</Text>
            <Text style={[styles.sidebarSubtitle, { color: theme.muted }]}>Acesso rápido e gestão</Text>
          </View>
          <TouchableOpacity onPress={fecharMenuLateral} style={[styles.btnCloseModal, { backgroundColor: theme.closeBg }]}><X size={20} /></TouchableOpacity>
        </View>

        <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarScrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sidebarSectionTitle}>OPERAÇÃO</Text>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' }]}
          onPress={() => { void executarAposFecharMenuLateral(() => setShowResumoTurno(true)); }}>
          <Activity size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#1D4ED8' }]}>Resumo do Turno</Text>
            <Text style={styles.sidebarActionSubtitle}>Pendências e alertas de vencimento</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#A78BFA', backgroundColor: '#F3E8FF', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(() => setShowGraficoStatus(true)); }}>
          <TrendingUp size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#6D28D9' }]}>Gráfico de Status</Text>
            <Text style={styles.sidebarActionSubtitle}>Visualizar distribuição de vencimentos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#F87171', backgroundColor: '#FEE2E2', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(exportarResumoPdfComTimestamp); }}
          disabled={exportandoPdf}>
          <Download size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#991B1B' }]}>Exportar PDF</Text>
            <Text style={styles.sidebarActionSubtitle}>{exportandoPdf ? 'Gerando...' : 'Resumo com timestamp'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(() => setShowHistorico(true)); }}>
          <Bell size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#1D4ED8' }]}>Histórico</Text>
            <Text style={styles.sidebarActionSubtitle}>Últimas alterações registradas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: notificacoesHabilitadas ? '#FCA5A5' : '#86EFAC', backgroundColor: notificacoesHabilitadas ? '#FEF2F2' : '#F0FDF4', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(alternarLembretesRecorrentes); }}>
          <Bell size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: notificacoesHabilitadas ? '#991B1B' : '#166534' }]}>{notificacoesHabilitadas ? 'Desativar Lembretes' : 'Ativar Lembretes'}</Text>
            <Text style={styles.sidebarActionSubtitle}>{notificacoesHabilitadas ? `Interrompe notificacoes a cada ${frequenciaLembreteHoras}h` : `Solicita permissao e ativa lembretes a cada ${frequenciaLembreteHoras}h`}</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sidebarSectionTitle, { marginTop: 18 }]}>DADOS</Text>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#34D399', backgroundColor: '#ECFDF5' }]}
          onPress={() => { void executarAposFecharMenuLateral(exportarParaExcel); }}>
          <Download size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#047857' }]}>Salvar Interno</Text>
            <Text style={styles.sidebarActionSubtitle}>Exporta relatório XLSX para compartilhar</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#FCD34D', backgroundColor: '#FFFBEB', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(baixarModeloPlanilha); }}>
          <Download size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#92400E' }]}>Baixar Modelo</Text>
            <Text style={styles.sidebarActionSubtitle}>Gera planilha modelo para importação</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(importarDeExcel); }}>
          <Upload size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#1D4ED8' }]}>Importar Produtos</Text>
            <Text style={styles.sidebarActionSubtitle}>Importa CSV/XLSX para o banco local</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#C084FC', backgroundColor: '#FAF5FF', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(importarBaseInternaEan); }}>
          <Upload size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#6B21A8' }]}>Importar Base EAN</Text>
            <Text style={styles.sidebarActionSubtitle}>Atualiza a base interna local manualmente</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sidebarAction, { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF', marginTop: 12 }]}
          onPress={() => { void executarAposFecharMenuLateral(abrirConfiguracoes); }}>
          <Edit2 size={18} />
          <View style={styles.sidebarActionTextWrap}>
            <Text style={[styles.sidebarActionTitle, { color: '#3730A3' }]}>Configurações</Text>
            <Text style={styles.sidebarActionSubtitle}>Loja, colaborador e preferências</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sidebarSectionTitle, { marginTop: 18, color: theme.muted }]}>SISTEMA</Text>
        <View style={[styles.sidebarInfoCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}>
          <Text style={[styles.sidebarInfoLine, { color: theme.text }]}>App: v{VERSAO_APP}</Text>
          <Text style={[styles.sidebarInfoLine, { color: theme.text }]}>Base interna: {formatarResumoBaseInterna(versaoBaseInternaAtual)}</Text>
        </View>

        </ScrollView>
      </Animated.View>
    </View>
  </Modal>

  {/* MODAL: RESUMO TURNO */}
  <Modal visible={showResumoTurno} transparent={true} animationType="fade" onRequestClose={fecharResumoTurno}>
    <View style={[styles.overlayBottomModal, { backgroundColor: theme.bottomOverlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharResumoTurno} />
      <Animated.View style={[styles.bottomSheet, isCompact && styles.bottomSheetCompact, isTablet && styles.bottomSheetWide, { backgroundColor: theme.surface, opacity: opacidadePainelModal, transform: [{ translateY: deslocamentoBottomSheet }] }] }>
        <View style={styles.dialogHeader}>
           <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
             <View style={{backgroundColor:'#EEF0FF', padding:8, borderRadius:12}}><Bell/></View>
             <Text style={[styles.dialogTitle, { color: theme.title }]}>Resumo do Turno</Text>
           </View>
           <TouchableOpacity onPress={fecharResumoTurno}><X/></TouchableOpacity>
        </View>
        <Text style={[styles.hintText, { color: theme.muted }]}>PENDÊNCIAS NA ÁREA DE VENDAS:</Text>
        
        <View style={styles.row}>
           <View style={[styles.resumeCard, {backgroundColor:'#FEF2F2', borderColor:'#FECACA'}]}>
             <Text style={[styles.resumeNum, {color: '#EF4444'}]}>{qtdRiscoImediato}</Text>
             <Text style={[styles.resumeLabel, {color: '#B91C1C'}]}>A RETIRAR</Text>
           </View>
           <View style={[styles.resumeCard, {backgroundColor:'#FFF7ED', borderColor:'#FED7AA'}]}>
             <Text style={[styles.resumeNum, {color: '#F87315'}]}>{qtdMarkdown}</Text>
             <Text style={[styles.resumeLabel, {color: '#C2410C'}]}>REMARCAR</Text>
           </View>
        </View>

        <Text style={[styles.hintText, { color: theme.muted }]}>ALERTAS DE VENCIMENTO:</Text>
        <View style={styles.rowWrap}>
          <View style={[styles.resumeMiniCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.resumeMiniNum, { color: '#1D4ED8' }]}>{qtdVence7}</Text>
            <Text style={[styles.resumeMiniLabel, { color: '#1E40AF' }]}>EM 7 DIAS</Text>
          </View>
          <View style={[styles.resumeMiniCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={[styles.resumeMiniNum, { color: '#B45309' }]}>{qtdVence15}</Text>
            <Text style={[styles.resumeMiniLabel, { color: '#92400E' }]}>EM 15 DIAS</Text>
          </View>
          <View style={[styles.resumeMiniCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={[styles.resumeMiniNum, { color: '#15803D' }]}>{qtdVence30}</Text>
            <Text style={[styles.resumeMiniLabel, { color: '#166534' }]}>EM 30 DIAS</Text>
          </View>
        </View>

        <Text style={[styles.hintText, { color: theme.muted }]}>RESUMO POR COLABORADOR:</Text>
        {resumoPorColaborador.slice(0, 5).map((item) => (
          <View key={item.colaborador} style={[styles.summaryRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}>
            <Text style={[styles.summaryName, { color: theme.text }]}>{item.colaborador}</Text>
            <Text style={[styles.summaryMeta, { color: theme.subtle }]}>Qtd {item.qtd} | Risco {item.risco} | Markdown {item.markdown}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  </Modal>

  <Modal visible={showFiltrosAvancados} transparent={true} animationType="fade" onRequestClose={fecharFiltrosAvancados}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharFiltrosAvancados} />
      <Animated.View style={[styles.dialogBox, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>Filtros Avançados</Text>
          <TouchableOpacity onPress={fecharFiltrosAvancados}><X/></TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.muted }]}>COLABORADOR</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} value={filtroColaborador} onChangeText={setFiltroColaborador} placeholder="Filtrar por colaborador" placeholderTextColor={theme.muted} />

        <Text style={[styles.label, { color: theme.muted }]}>STATUS DE CONFERÊNCIA</Text>
        <View style={styles.measureOptionsWrap}>
          <TouchableOpacity style={[styles.measureChip, filtroStatusConferencia === 'todos' && styles.measureChipActive]} onPress={() => setFiltroStatusConferencia('todos')}><Text style={[styles.measureChipText, filtroStatusConferencia === 'todos' && styles.measureChipTextActive]}>Todos</Text></TouchableOpacity>
          {(['pendente', 'conferido', 'resolvido'] as StatusConferencia[]).map((status) => (
            <TouchableOpacity key={status} style={[styles.measureChip, filtroStatusConferencia === status && styles.measureChipActive]} onPress={() => setFiltroStatusConferencia(status)}><Text style={[styles.measureChipText, filtroStatusConferencia === status && styles.measureChipTextActive]}>{ROTULOS_STATUS_CONFERENCIA[status]}</Text></TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.muted }]}>MEDIDA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChipScroll}>
          <View style={styles.quickChipRow}>
            <TouchableOpacity style={[styles.quickChip, filtroUnidadeMedida === 'todos' && styles.quickChipActive]} onPress={() => setFiltroUnidadeMedida('todos')}><Text style={[styles.quickChipText, filtroUnidadeMedida === 'todos' && styles.quickChipTextActive]}>Todos</Text></TouchableOpacity>
            {OPCOES_UNIDADE_MEDIDA.map((opcao) => (
              <TouchableOpacity key={opcao.valor} style={[styles.quickChip, filtroUnidadeMedida === opcao.valor && styles.quickChipActive]} onPress={() => setFiltroUnidadeMedida(opcao.valor)}><Text style={[styles.quickChipText, filtroUnidadeMedida === opcao.valor && styles.quickChipTextActive]}>{opcao.label}</Text></TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[styles.label, { color: theme.muted }]}>EMBALAGEM</Text>
        <View style={styles.measureOptionsWrap}>
          <TouchableOpacity style={[styles.measureChip, filtroEmbalagem === 'todos' && styles.measureChipActive]} onPress={() => setFiltroEmbalagem('todos')}><Text style={[styles.measureChipText, filtroEmbalagem === 'todos' && styles.measureChipTextActive]}>Todos</Text></TouchableOpacity>
          {(Object.keys(ROTULOS_TIPO_EMBALAGEM) as TipoEmbalagem[]).map((embalagem) => (
            <TouchableOpacity key={embalagem} style={[styles.measureChip, filtroEmbalagem === embalagem && styles.measureChipActive]} onPress={() => setFiltroEmbalagem(embalagem)}><Text style={[styles.measureChipText, filtroEmbalagem === embalagem && styles.measureChipTextActive]}>{ROTULOS_TIPO_EMBALAGEM[embalagem]}</Text></TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnDialogAction} onPress={fecharFiltrosAvancados}>
          <Text style={styles.btnDialogActionText}>Aplicar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDialogDanger} onPress={() => {
          setFiltroColaborador('');
          setFiltroStatusConferencia('todos');
          setFiltroUnidadeMedida('todos');
          setFiltroEmbalagem('todos');
        }}>
          <Text style={styles.btnDialogDangerText}>Limpar Filtros</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  <Modal visible={showHistorico} transparent={true} animationType="fade" onRequestClose={fecharHistorico}>
    <View style={[styles.overlayBottomModal, { backgroundColor: theme.bottomOverlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharHistorico} />
      <Animated.View style={[styles.bottomSheet, isCompact && styles.bottomSheetCompact, isTablet && styles.bottomSheetWide, { backgroundColor: theme.surface, opacity: opacidadePainelModal, transform: [{ translateY: deslocamentoBottomSheet }] }] }>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>Histórico</Text>
          <TouchableOpacity onPress={fecharHistorico}><X/></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
        <Text style={[styles.label, { color: theme.muted }]}>PERÍODO</Text>
        <View style={styles.historyDateRangeRow}>
          <View style={styles.historyDateRangeField}>
            <Text style={[styles.historyDateFieldLabel, { color: theme.muted }]}>Início</Text>
            <TouchableOpacity style={[styles.dateField, isCompact && styles.dateFieldCompact, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => abrirDatePickerHistorico('inicio')}>
              <Text style={[styles.dateFieldText, { color: theme.text }, !filtroHistoricoDataInicio && styles.dateFieldPlaceholder, !filtroHistoricoDataInicio && { color: theme.muted }]}>
                {filtroHistoricoDataInicio ? formataDataBR(filtroHistoricoDataInicio) : 'Data inicial'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyDateRangeField}>
            <Text style={[styles.historyDateFieldLabel, { color: theme.muted }]}>Fim</Text>
            <TouchableOpacity style={[styles.dateField, isCompact && styles.dateFieldCompact, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => abrirDatePickerHistorico('fim')}>
              <Text style={[styles.dateFieldText, { color: theme.text }, !filtroHistoricoDataFim && styles.dateFieldPlaceholder, !filtroHistoricoDataFim && { color: theme.muted }]}>
                {filtroHistoricoDataFim ? formataDataBR(filtroHistoricoDataFim) : 'Data final'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {filtroHistoricoDataInicio || filtroHistoricoDataFim ? (
          <TouchableOpacity style={styles.historyDateClearBtn} onPress={() => {
            setFiltroHistoricoDataInicio('');
            setFiltroHistoricoDataFim('');
          }}>
            <Text style={styles.historyDateClearText}>Limpar período</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.label, { color: theme.muted }]}>TIPO DE PRODUTO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChipScroll}>
          <View style={styles.quickChipRow}>
            <TouchableOpacity style={[styles.quickChip, filtroHistoricoTipo === 'todos' && styles.quickChipActive]} onPress={() => setFiltroHistoricoTipo('todos')}>
              <Text style={[styles.quickChipText, filtroHistoricoTipo === 'todos' && styles.quickChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {tiposHistoricoDisponiveis.map((tipo) => (
              <TouchableOpacity key={tipo} style={[styles.quickChip, filtroHistoricoTipo === tipo && styles.quickChipActive]} onPress={() => setFiltroHistoricoTipo(tipo)}>
                <Text style={[styles.quickChipText, filtroHistoricoTipo === tipo && styles.quickChipTextActive]}>{tipo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={styles.historyList}>
          {historicoFiltrado.map((item) => (
            <View key={item.id} style={[styles.historyCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>{item.acao.toUpperCase()} • {item.nome}</Text>
              <Text style={[styles.historyText, { color: theme.subtle }]}>{item.codigo}</Text>
              {item.tipo_produto ? <Text style={[styles.historyText, { color: theme.subtle }]}>Tipo: {item.tipo_produto}</Text> : null}
              <Text style={[styles.historyText, { color: theme.subtle }]}>{item.detalhes}</Text>
              <Text style={[styles.historyMeta, { color: theme.muted }]}>{item.colaborador} • {formatarDataHora(item.data_evento)}</Text>
            </View>
          ))}
          {historicoFiltrado.length === 0 ? <Text style={[styles.hintText, { color: theme.muted }]}>Nenhum registro encontrado para os filtros selecionados.</Text> : null}
        </View>
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>

  <Modal visible={showImportPreview} transparent={true} animationType="fade" onRequestClose={voltarDaSelecaoImportacao}>
    <View style={[styles.overlayBottomModal, { backgroundColor: theme.bottomOverlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={voltarDaSelecaoImportacao} />
      <Animated.View style={[styles.bottomSheet, isCompact && styles.bottomSheetCompact, isTablet && styles.bottomSheetWide, { backgroundColor: theme.surface, opacity: opacidadePainelModal, transform: [{ translateY: deslocamentoBottomSheet }] }] }>
        <View style={styles.dialogHeader}>
          <View style={styles.previewHeaderTextWrap}>
            <Text style={[styles.dialogTitle, { color: theme.title }]}>Previa da Importacao</Text>
            <Text style={[styles.previewFileName, { color: theme.muted }]}>{nomeArquivoImportacao}</Text>
          </View>
          <TouchableOpacity onPress={voltarDaSelecaoImportacao}><X/></TouchableOpacity>
        </View>

        <View style={[styles.previewStatsRow, isCompact && styles.previewStatsRowCompact]}>
          <View style={[styles.previewStatCard, isCompact && styles.previewStatCardCompact, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}> 
            <Text style={[styles.previewStatValue, { color: '#3730A3' }]}>{resumoPreviewImportacao.total}</Text>
            <Text style={[styles.previewStatLabel, { color: '#4338CA' }]}>TOTAL</Text>
          </View>
          <View style={[styles.previewStatCard, isCompact && styles.previewStatCardCompact, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}> 
            <Text style={[styles.previewStatValue, { color: '#15803D' }]}>{resumoPreviewImportacao.validos}</Text>
            <Text style={[styles.previewStatLabel, { color: '#166534' }]}>VALIDOS</Text>
          </View>
          <View style={[styles.previewStatCard, isCompact && styles.previewStatCardCompact, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}> 
            <Text style={[styles.previewStatValue, { color: '#DC2626' }]}>{resumoPreviewImportacao.vencidos}</Text>
            <Text style={[styles.previewStatLabel, { color: '#B91C1C' }]}>VENCIDOS</Text>
          </View>
        </View>

        <TextInput
          style={[styles.input, styles.previewSearchInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={filtroImportPreview}
          onChangeText={setFiltroImportPreview}
          placeholder="Buscar por nome, EAN, apresentacao ou setor"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.previewResultText, { color: theme.muted }]}>
          {itensImportacaoPreviewFiltrados.length} de {itensImportacaoPreview.length} itens visiveis
        </Text>

        <ScrollView style={styles.importPreviewList}>
          {itensImportacaoPreviewFiltrados.slice(0, 30).map((item) => {
            const diasValidade = obterDiasAteValidade(item.validade);
            const estaValido = diasValidade >= 0;

            return (
              <View key={item.id} style={[styles.importPreviewCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft }]}>
                <View style={styles.importPreviewTop}>
                  <Text style={[styles.importPreviewTitle, { color: theme.text }]}>{item.nome}</Text>
                  <View style={[styles.importPreviewBadge, estaValido ? styles.importPreviewBadgeOk : styles.importPreviewBadgeExpired]}>
                    <Text style={[styles.importPreviewBadgeText, estaValido ? styles.importPreviewBadgeTextOk : styles.importPreviewBadgeTextExpired]}>
                      {estaValido ? 'Dentro da validade' : 'Vencido'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.importPreviewMeta, { color: theme.subtle }]}>EAN: {item.codigo}</Text>
                <Text style={[styles.importPreviewMeta, { color: theme.subtle }]}>Validade: {formataDataBR(item.validade)}</Text>
                {item.apresentacao ? <Text style={[styles.importPreviewMeta, { color: theme.subtle }]}>Apresentacao: {item.apresentacao}</Text> : null}
              </View>
            );
          })}
          {itensImportacaoPreviewFiltrados.length === 0 ? (
            <Text style={[styles.hintText, { color: theme.muted }]}>Nenhum item encontrado para esse filtro.</Text>
          ) : null}
          {itensImportacaoPreviewFiltrados.length > 30 ? (
            <Text style={[styles.hintText, { color: theme.muted }]}>Mostrando os primeiros 30 itens do resultado filtrado.</Text>
          ) : null}
        </ScrollView>

        <TouchableOpacity
          style={[styles.btnDialogAction, isCompact && styles.btnDialogActionCompact, importandoPreview && styles.buttonDisabled]}
          onPress={() => { void importarProdutosDaPreview(itensImportacaoPreview); }}
          disabled={importandoPreview}>
          <Text style={styles.btnDialogActionText}>{importandoPreview ? 'Importando...' : 'Importar Todos'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnDialogAction, styles.btnDialogSecondary, isCompact && styles.btnDialogActionCompact, importandoPreview && styles.buttonDisabled]}
          onPress={() => {
            const validos = itensImportacaoPreview.filter((produto) => obterDiasAteValidade(produto.validade) >= 0);
            if (validos.length === 0) {
              Alert.alert('Aviso', 'Nenhum produto dentro da validade foi encontrado para importar.');
              return;
            }
            void importarProdutosDaPreview(validos);
          }}
          disabled={importandoPreview}>
          <Text style={styles.btnDialogSecondaryText}>{importandoPreview ? 'Importando...' : 'Importar So Validos'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnDialogDanger, isCompact && styles.btnDialogDangerCompact, importandoPreview && styles.buttonDisabled]} onPress={voltarDaSelecaoImportacao} disabled={importandoPreview}>
          <Text style={styles.btnDialogDangerText}>Voltar para tela inicial</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  <Modal visible={showDatePickerAdicional && Platform.OS === 'ios'} transparent={true} animationType="fade" onRequestClose={fecharDatePickerAdicionalIOS}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharDatePickerAdicionalIOS} />
      <Animated.View style={[styles.datePickerDialog, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>Validade extra</Text>
          <TouchableOpacity onPress={fecharDatePickerAdicionalIOS}><X/></TouchableOpacity>
        </View>
        <DateTimePicker
          value={dataValidadeAdicionalSelecionada}
          mode="date"
          display="spinner"
          onChange={aoMudarDatePickerAdicional}
        />
        <TouchableOpacity style={styles.btnDialogAction} onPress={() => { void confirmarDatePickerAdicional(dataValidadeAdicionalSelecionada); }}>
          <Text style={styles.btnDialogActionText}>Confirmar Data</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  {showDatePickerAdicional && Platform.OS === 'android' ? (
    <DateTimePicker
      value={dataValidadeAdicionalSelecionada}
      mode="date"
      display="default"
      onChange={aoMudarDatePickerAdicional}
    />
  ) : null}

  <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent={true} animationType="fade" onRequestClose={fecharDatePickerIOS}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharDatePickerIOS} />
      <Animated.View style={[styles.datePickerDialog, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>Selecionar validade</Text>
          <TouchableOpacity onPress={fecharDatePickerIOS}><X/></TouchableOpacity>
        </View>
        <DateTimePicker
          value={dataValidadeSelecionada}
          mode="date"
          display="spinner"
          onChange={aoMudarDatePicker}
        />
        <TouchableOpacity style={styles.btnDialogAction} onPress={() => { void confirmarDatePicker(dataValidadeSelecionada); }}>
          <Text style={styles.btnDialogActionText}>Confirmar Data</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  {showDatePicker && Platform.OS === 'android' ? (
    <DateTimePicker
      value={dataValidadeSelecionada}
      mode="date"
      display="default"
      onChange={aoMudarDatePicker}
    />
  ) : null}

  <Modal visible={showHistoricoDatePicker && Platform.OS === 'ios'} transparent={true} animationType="fade" onRequestClose={fecharHistoricoDatePickerIOS}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharHistoricoDatePickerIOS} />
      <Animated.View style={[styles.datePickerDialog, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>{alvoDatePickerHistorico === 'inicio' ? 'Data inicial' : 'Data final'}</Text>
          <TouchableOpacity onPress={fecharHistoricoDatePickerIOS}><X/></TouchableOpacity>
        </View>
        <DateTimePicker
          value={dataHistoricoSelecionada}
          mode="date"
          display="spinner"
          onChange={aoMudarDatePickerHistorico}
        />
        <TouchableOpacity style={styles.btnDialogAction} onPress={() => { void confirmarDatePickerHistorico(dataHistoricoSelecionada); }}>
          <Text style={styles.btnDialogActionText}>Confirmar Data</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  {/* MODAL: ONBOARDING */}
  <Modal
    visible={showOnboarding}
    animationType="fade"
    onRequestClose={async () => {
      await AsyncStorage.setItem(CHAVE_ONBOARDING_CONCLUIDO, 'ok');
      setShowOnboarding(false);
    }}>
    <SafeAreaView style={styles.onboardingContainer}>
      <View style={[styles.onboardingInner, isCompact && styles.onboardingInnerCompact]}>
        <View style={styles.onboardingHero}>
          <Text style={[styles.onboardingEmoji, isCompact && styles.onboardingEmojiCompact]}>{ONBOARDING_STEPS[onboardingStep].emoji}</Text>
          <Text style={[styles.onboardingTitle, isCompact && styles.onboardingTitleCompact]}>
            {ONBOARDING_STEPS[onboardingStep].titulo}
          </Text>
          <Text style={[styles.onboardingDescription, isCompact && styles.onboardingDescriptionCompact]}>
            {ONBOARDING_STEPS[onboardingStep].descricao}
          </Text>
        </View>

        <View style={[styles.onboardingDotsRow, isCompact && styles.onboardingDotsRowCompact]}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === onboardingStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === onboardingStep ? '#565DF0' : '#334155',
              }}
            />
          ))}
        </View>

        <View style={styles.onboardingActionsWrap}>
          <TouchableOpacity
            style={[styles.onboardingActionPrimary, isCompact && styles.onboardingActionPrimaryCompact]}
            onPress={async () => {
              if (onboardingStep < ONBOARDING_STEPS.length - 1) {
                setOnboardingStep((s) => s + 1);
              } else {
                await AsyncStorage.setItem(CHAVE_ONBOARDING_CONCLUIDO, 'ok');
                setShowOnboarding(false);
              }
            }}>
            <Text style={styles.onboardingActionPrimaryText}>
              {onboardingStep < ONBOARDING_STEPS.length - 1 ? 'Próximo' : 'Começar'}
            </Text>
          </TouchableOpacity>

          {onboardingStep > 0 ? (
            <TouchableOpacity
              style={styles.onboardingActionSecondary}
              onPress={() => setOnboardingStep((s) => s - 1)}>
              <Text style={styles.onboardingActionSecondaryText}>Anterior</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.onboardingActionSecondary}
              onPress={async () => {
                await AsyncStorage.setItem(CHAVE_ONBOARDING_CONCLUIDO, 'ok');
                setShowOnboarding(false);
              }}>
              <Text style={styles.onboardingActionSecondaryText}>Pular</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  </Modal>

  {/* MODAL: GRÁFICO DE STATUS */}
  <Modal visible={showGraficoStatus} transparent={true} animationType="fade" onRequestClose={fecharGraficoStatus}>
    <View style={[styles.overlayModal, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharGraficoStatus} />
      <Animated.View style={[styles.dialogBox, styles.chartDialog, { backgroundColor: theme.surface, opacity: opacidadeDialogo, transform: [{ translateY: deslocamentoDialogo }, { scale: escalaDialogo }] }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: theme.title }]}>Distribuição de Vencimentos</Text>
          <TouchableOpacity onPress={fecharGraficoStatus}><X/></TouchableOpacity>
        </View>
        
        <ScrollView style={styles.chartScroll}>
          {calcularDadosGrafico.datasets[0].data.length > 0 ? (
            <View style={[styles.chartBody, isCompact && styles.chartBodyCompact]}>
              <BarChart
                data={calcularDadosGrafico}
                width={chartWidth}
                height={300}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.surface,
                  backgroundGradientFrom: theme.surface,
                  backgroundGradientTo: theme.surface,
                  color: () => '#565DF0',
                  labelColor: () => theme.muted,
                  barPercentage: 0.7,
                }}
                style={{ borderRadius: 8, marginVertical: 8 }}
                showValuesOnTopOfBars
              />
              
              <View style={{ marginTop: 20, gap: 12 }}>
                <View style={[styles.infoBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={{ color: '#166534', fontSize: modoAcessibilidade ? 16 : 14, fontWeight: 'bold' }}>NO PRAZO</Text>
                  <Text style={{ color: '#15803D', fontSize: 24, fontWeight: 'bold' }}>{calcularDadosGrafico.datasets[0].data[0]}</Text>
                </View>
                <View style={[styles.infoBox, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
                  <Text style={{ color: '#92400E', fontSize: modoAcessibilidade ? 16 : 14, fontWeight: 'bold' }}>MARKDOWN</Text>
                  <Text style={{ color: '#B45309', fontSize: 24, fontWeight: 'bold' }}>{calcularDadosGrafico.datasets[0].data[1]}</Text>
                </View>
                <View style={[styles.infoBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Text style={{ color: '#B91C1C', fontSize: modoAcessibilidade ? 16 : 14, fontWeight: 'bold' }}>PRÓXIMOS</Text>
                  <Text style={{ color: '#DC2626', fontSize: 24, fontWeight: 'bold' }}>{calcularDadosGrafico.datasets[0].data[2]}</Text>
                </View>
                <View style={[styles.infoBox, { backgroundColor: '#F0F0F0', borderColor: '#B3B3B3' }]}>
                  <Text style={{ color: '#6B7280', fontSize: modoAcessibilidade ? 16 : 14, fontWeight: 'bold' }}>VENCIDOS</Text>
                  <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: 'bold' }}>{calcularDadosGrafico.datasets[0].data[3]}</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={[styles.hintText, { color: theme.muted, textAlign: 'center', marginVertical: 40 }]}>Não há produtos para exibir</Text>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.btnDialogAction} onPress={fecharGraficoStatus}>
          <Text style={styles.btnDialogActionText}>Fechar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>

  {showHistoricoDatePicker && Platform.OS === 'android' ? (
    <DateTimePicker
      value={dataHistoricoSelecionada}
      mode="date"
      display="default"
      onChange={aoMudarDatePickerHistorico}
    />
  ) : null}

</SafeAreaView>


);
}

// ==========================================
// ESTILOS NATIVOS
// ==========================================
const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F4F6F8' },
center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

notificacao: { position: 'absolute', top: Platform.OS === 'ios' ? 12 : 10, left: 14, right: 14, zIndex: 30, backgroundColor: '#565DF0', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 14, shadowColor: '#312E81', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 8 },
notificacaoText: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 },

header: { backgroundColor: '#2C2E7D', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
headerCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
headerWide: { paddingHorizontal: 28 },
headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
headerLeftCompact: { alignItems: 'flex-start' },
headerIconButton: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 8, borderRadius: 18 },
headerTextWrap: { justifyContent: 'center' },
headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
headerTitleCompact: { fontSize: 16 },
badgesWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, flexWrap: 'wrap' },
badgesWrapCompact: { marginTop: 8 },
badgeTop: { backgroundColor: '#1E205B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
badgeTopText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

colabBox: { backgroundColor: '#1E205B', padding: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
colabBoxCompact: { width: '100%' },
colabBoxWide: { minWidth: 220 },
colabLabel: { color: '#A5B4FC', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
colabName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

content: { flex: 1 },
contentContainer: { padding: 16, paddingBottom: 110 },
contentContainerWide: { width: '100%', maxWidth: 1080, alignSelf: 'center' },

kpiScroll: { marginBottom: 20, overflow: 'visible' },
kpiCard: { padding: 20, borderRadius: 20, width: 220, marginRight: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
kpiCardCompact: { padding: 16, marginRight: 12 },
kpiIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
kpiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
kpiValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
kpiValueCompact: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
kpiSubvalue: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '800', marginTop: 4 },
kpiHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 8 },

toolbar: { marginBottom: 16 },
sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A1C5A', marginBottom: 12 },
actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
actionRowCompact: { gap: 8 },
btnOutline: { minWidth: '30%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
btnOutlineCompact: { minWidth: '48%' },
btnOutlineWide: { minWidth: '22%' },
btnOutlineText: { fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
searchInput: { flex: 1, padding: 12, fontSize: 16, color: '#1F2937' },
filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#E5E7EB' },
filterChipActive: { backgroundColor: '#DBEAFE' },
filterChipDanger: { backgroundColor: '#FEE2E2' },
filterChipText: { color: '#4B5563', fontWeight: '800', fontSize: 15 },
filterChipTextActive: { color: '#1D4ED8' },
filterChipDangerText: { color: '#B91C1C' },
clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#FECACA' },
clearFiltersBtnText: { color: '#B91C1C', fontSize: 14, fontWeight: '800' },
quickChipScroll: { marginBottom: 8 },
quickChipRow: { flexDirection: 'row', gap: 8 },
quickChip: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
quickChipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
quickChipText: { color: '#4B5563', fontSize: 14, fontWeight: '800' },
quickChipTextActive: { color: '#1D4ED8' },

cardProduto: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
cardProdutoSwipeOpen: { borderColor: '#93C5FD' },
cardProdutoWide: { padding: 20 },
swipeActionsWrap: { width: 170, marginBottom: 16, marginLeft: 10, flexDirection: 'row', alignItems: 'stretch', gap: 8 },
swipeActionBtn: { flex: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1 },
swipeActionEdit: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
swipeActionDelete: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
swipeIconBubbleEdit: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
swipeIconBubbleDelete: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
swipeActionText: { fontSize: 13, fontWeight: '800', color: '#374151' },
swipeActionTextEdit: { color: '#1D4ED8' },
swipeActionTextDelete: { color: '#B91C1C' },
cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
cardTopCompact: { flexDirection: 'column', gap: 12 },
cardHeaderInfo: { flex: 1 },
prodNome: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 6 },
tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
tagApres: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
tagApresText: { color: '#B91C1C', fontSize: 13, fontWeight: 'bold' },
tagEmbalagem: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
tagEmbalagemText: { color: '#047857', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
tagTipo: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' },
tagTipoText: { color: '#3730A3', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
tagStatusConferencia: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
tagStatusConferenciaText: { color: '#92400E', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
tagColab: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 4 },
tagColabText: { color: '#4B5563', fontSize: 12, fontWeight: 'bold' },
eanBox: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 6 },
prodEan: { fontSize: 14, color: '#4B5563', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: 'bold' },
detailList: { marginTop: 8, gap: 2 },
detailText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },

actions: { flexDirection: 'column', gap: 8, marginLeft: 12 },
actionsCompact: { flexDirection: 'row', marginLeft: 0 },
actionBtn: { padding: 10, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },

cardBottom: { flexDirection: 'row', gap: 8, marginBottom: 12 },
cardBottomCompact: { flexDirection: 'column' },
infoBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
infoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
infoValue: { fontSize: 18, color: '#111827', fontWeight: '900' },

statusBoxFull: { padding: 12, borderRadius: 16, borderWidth: 1, marginTop: 4 },
statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
statusLabelTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
statusDateValue: { fontSize: 16, fontWeight: '900' },
statusExtrasWrap: { marginBottom: 8, gap: 6 },
statusExtrasBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4 },
statusExtrasBadgeText: { fontSize: 12, fontWeight: '800', color: '#1F2937' },
statusExtrasText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
statusBigTag: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
statusBigTagText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },

fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#565DF0', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#565DF0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },

modalContainer: { flex: 1, backgroundColor: '#F4F6F8' },
modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
modalHeaderCompact: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'flex-start' },
modalHeadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 },
modalHeadingWrapCompact: { paddingRight: 0 },
modalTitle: { fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
modalTitleCompact: { fontSize: 18, lineHeight: 23 },
btnCloseModal: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
formBody: { paddingHorizontal: 24, paddingTop: 18 },
formBodyWide: { width: '100%', maxWidth: 760, alignSelf: 'center' },
formBodyContent: { paddingBottom: 60 },
label: { fontSize: 14, fontWeight: '900', color: '#6B7280', marginBottom: 8, marginTop: 20, letterSpacing: 0.5 },
input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
presentationPreview: { backgroundColor: '#FFF7ED', borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA', padding: 14 },
presentationPreviewText: { color: '#9A3412', fontSize: 14, fontWeight: '700' },
packagePreview: { backgroundColor: '#ECFDF5', borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', padding: 14 },
packagePreviewText: { color: '#047857', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
measureOptionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
measureChip: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
measureChipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
measureChipText: { color: '#4B5563', fontSize: 14, fontWeight: '800' },
measureChipTextActive: { color: '#1D4ED8' },
measureHint: { color: '#475569', fontSize: 14, marginTop: 10, lineHeight: 20, fontWeight: '600' },
inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
dateField: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, minHeight: 58, justifyContent: 'center' },
dateFieldCompact: { minHeight: 52, padding: 14 },
dateFieldText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
dateFieldPlaceholder: { color: '#9CA3AF' },
historyDateRangeRow: { flexDirection: 'column', gap: 10 },
historyDateRangeField: { width: '100%' },
historyDateFieldLabel: { color: '#64748B', fontSize: 13, fontWeight: '800', marginBottom: 8 },
historyDateClearBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#F8FAFC', borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8 },
historyDateClearText: { color: '#475569', fontSize: 13, fontWeight: '800' },
row: { flexDirection: 'row', alignItems: 'center' },
rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
autoSearchHint: { color: '#4338CA', fontSize: 14, marginTop: 10, fontWeight: '700', lineHeight: 20 },
  validadeAdicionalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6 },
  validadeAdicionalText: { fontSize: 14, fontWeight: '600' },
  btnAddValidade: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 12, justifyContent: 'center', marginBottom: 4 },
  btnAddValidadeText: { color: '#565DF0', fontSize: 14, fontWeight: '700' },
btnCamera: { backgroundColor: '#565DF0', width: 60, height: 60, borderRadius: 16, marginLeft: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
btnCameraCompact: { width: 52, height: 52, marginLeft: 8 },
btnSalvar: { flexDirection: 'row', padding: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 60, elevation: 4 },
btnSalvarText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
buscando: { color: '#565DF0', fontSize: 14, marginTop: 6, fontWeight: 'bold' },

overlayModal: { flex: 1, backgroundColor: 'rgba(26, 28, 90, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
dialogBox: { backgroundColor: '#fff', width: '100%', maxWidth: 760, borderRadius: 24, padding: 24, maxHeight: '90%' },
datePickerDialog: { backgroundColor: '#fff', width: '100%', maxWidth: 560, borderRadius: 24, padding: 24 },
dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
dialogTitle: { fontSize: 20, fontWeight: '900', color: '#1A1C5A', textTransform: 'uppercase' },
chartDialog: { maxHeight: '85%' },
chartScroll: { paddingHorizontal: 0 },
chartBody: { padding: 16 },
chartBodyCompact: { paddingHorizontal: 8, paddingVertical: 12 },
configOptionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, backgroundColor: '#F8FAFC', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 4 },
configOptionTextWrap: { flex: 1 },
configOptionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', marginBottom: 4 },
configOptionDescription: { color: '#475569', fontSize: 14, fontWeight: '600', lineHeight: 20 },
configToggle: { width: 54, height: 32, borderRadius: 999, backgroundColor: '#CBD5E1', padding: 4, justifyContent: 'center' },
configToggleActive: { backgroundColor: '#60A5FA' },
configToggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
configToggleThumbActive: { alignSelf: 'flex-end' },
sidebarOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', flexDirection: 'row', justifyContent: 'flex-end' },
sidebarBackdrop: { flex: 1 },
sidebarPanel: { width: '82%', maxWidth: 340, backgroundColor: '#FFFFFF', padding: 20, paddingTop: 56, shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 12, maxHeight: '100%' },
sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
sidebarTitle: { color: '#111827', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
sidebarSubtitle: { color: '#6B7280', fontSize: 13, fontWeight: '600', marginTop: 4 },
sidebarScroll: { flexGrow: 0 },
sidebarScrollContent: { paddingBottom: 28 },
sidebarSectionTitle: { color: '#64748B', fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
sidebarAction: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14 },
sidebarActionTextWrap: { flex: 1 },
sidebarActionTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
sidebarActionSubtitle: { color: '#6B7280', fontSize: 13, fontWeight: '600', marginTop: 2 },
sidebarInfoCard: { marginTop: 2, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', padding: 12, gap: 6 },
sidebarInfoLine: { color: '#334155', fontSize: 13, fontWeight: '700' },
btnDialogAction: { backgroundColor: '#565DF0', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
btnDialogActionCompact: { marginTop: 14, paddingVertical: 14, paddingHorizontal: 12 },
btnDialogActionText: { color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
btnDialogSecondary: { backgroundColor: '#EEF2FF', marginTop: 10 },
btnDialogSecondaryText: { color: '#3730A3', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
btnDialogDanger: { padding: 16, alignItems: 'center', marginTop: 8 },
btnDialogDangerCompact: { marginTop: 4, paddingVertical: 14 },
btnDialogDangerText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
buttonDisabled: { opacity: 0.6 },

overlayBottomModal: { flex: 1, backgroundColor: 'rgba(26, 28, 90, 0.5)', justifyContent: 'flex-end' },
bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '92%' },
bottomSheetCompact: { padding: 18, paddingBottom: 28 },
bottomSheetWide: { width: '100%', maxWidth: 760, alignSelf: 'center' },
hintText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold', marginBottom: 16 },
previewHeaderTextWrap: { flex: 1, paddingRight: 12 },
previewFileName: { color: '#64748B', fontSize: 13, fontWeight: '700', marginTop: 4 },
previewStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
previewStatsRowCompact: { flexWrap: 'wrap', gap: 8 },
previewStatCard: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
previewStatCardCompact: { minWidth: '48%' },
previewStatValue: { fontSize: 24, fontWeight: '900' },
previewStatLabel: { fontSize: 12, fontWeight: '900', marginTop: 4, letterSpacing: 0.6 },
previewSearchInput: { marginBottom: 10 },
previewResultText: { color: '#64748B', fontSize: 13, fontWeight: '700', marginBottom: 12 },
importPreviewList: { maxHeight: 340 },
importPreviewCard: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
importPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
importPreviewTitle: { flex: 1, color: '#111827', fontSize: 14, fontWeight: '900' },
importPreviewMeta: { color: '#4B5563', fontSize: 13, fontWeight: '700', marginTop: 2 },
importPreviewBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
importPreviewBadgeOk: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
importPreviewBadgeExpired: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
importPreviewBadgeText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
importPreviewBadgeTextOk: { color: '#166534' },
importPreviewBadgeTextExpired: { color: '#B91C1C' },
resumeCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginRight: 8 },
resumeNum: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
resumeLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
resumeMiniCard: { width: '31%', minWidth: 96, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
resumeMiniNum: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
resumeMiniLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
summaryRow: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
summaryName: { color: '#0F172A', fontSize: 14, fontWeight: '900', marginBottom: 4 },
summaryMeta: { color: '#475569', fontSize: 13, fontWeight: '700' },
historyList: { marginTop: 12 },
historyCard: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
historyTitle: { color: '#0F172A', fontSize: 13, fontWeight: '900', marginBottom: 4 },
historyText: { color: '#475569', fontSize: 13, fontWeight: '700', marginBottom: 2 },
historyMeta: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 4 },

cameraContainer: { flex: 1, backgroundColor: '#000' },
cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
cameraTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
btnFecharCamera: { backgroundColor: '#EF4444', padding: 12, borderRadius: 24 },
camera: { flex: 1 },
cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
cameraTarget: { width: 250, height: 150, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16 },

onboardingContainer: { flex: 1, backgroundColor: '#1A1C5A' },
onboardingInner: { flex: 1, padding: 28, justifyContent: 'space-between', width: '100%', maxWidth: 760, alignSelf: 'center' },
onboardingInnerCompact: { paddingHorizontal: 16, paddingVertical: 20 },
onboardingHero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
onboardingEmoji: { fontSize: 72, marginBottom: 28 },
onboardingEmojiCompact: { fontSize: 58, marginBottom: 22 },
onboardingTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 16, lineHeight: 30 },
onboardingTitleCompact: { fontSize: 20, lineHeight: 28 },
onboardingDescription: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 24, fontWeight: '600' },
onboardingDescriptionCompact: { fontSize: 14, lineHeight: 22 },
onboardingDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
onboardingDotsRowCompact: { marginBottom: 18 },
onboardingActionsWrap: { gap: 10 },
onboardingActionPrimary: { backgroundColor: '#565DF0', padding: 18, borderRadius: 16, alignItems: 'center' },
onboardingActionPrimaryCompact: { paddingVertical: 14 },
onboardingActionPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
onboardingActionSecondary: { padding: 14, alignItems: 'center' },
onboardingActionSecondaryText: { color: '#64748B', fontWeight: '700', fontSize: 14 },

splashLoadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, paddingHorizontal: 24 },
splashGlowOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(147, 197, 253, 0.16)' },
splashBrandCard: { alignItems: 'center', gap: 10 },
splashBrandLogo: { width: 126, height: 126 },
splashBrandTitle: { color: '#E2E8F0', fontSize: 28, fontWeight: '900', letterSpacing: 0.6 },

 
});
