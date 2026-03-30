export type UnidadeMedida =
  | 'unidades'
  | 'comprimidos'
  | 'capsulas'
  | 'drageas'
  | 'ml'
  | 'g'
  | 'gotas'
  | 'ampolas'
  | 'envelopes'
  | 'bisnagas'
  | 'frascos'
  | 'sprays';

export type TipoEmbalagem = 'frasco' | 'bisnaga' | 'envelope' | 'spray' | 'ampola';

export type StatusConferencia = 'pendente' | 'conferido' | 'resolvido';

export type TipoFiltro = 'todos' | 'proximos' | 'no_prazo' | 'vencidos';

export type ThemePreference = 'system' | 'light' | 'dark';

export type StatusValidadeInfo = {
  tipo: 'ok' | 'markdown' | 'retirar' | 'vencido';
  label: string;
  cor: string;
  bg: string;
  border: string;
};

export type Produto = {
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

export type ProdutoComAnalise = Produto & {
  diasAteValidade: number;
  statusValidade: StatusValidadeInfo;
  embalagemCalculada: TipoEmbalagem | null;
  totalMedidoCalculado: string | null;
};

export type CadastroEan = {
  codigo: string;
  nome: string;
  apresentacao: string;
  custo: number;
  embalagem?: TipoEmbalagem;
  unidade_medida?: UnidadeMedida;
  quantidade_medida?: number;
  referencia?: string;
};

export type HistoricoRegistro = {
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
