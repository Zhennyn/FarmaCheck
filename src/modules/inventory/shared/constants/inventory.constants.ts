import type { StatusConferencia, TipoEmbalagem, UnidadeMedida } from '../../domain/models/product.model';

export const OPCOES_UNIDADE_MEDIDA: { valor: UnidadeMedida; label: string }[] = [
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

export const ROTULOS_UNIDADE_MEDIDA: Record<UnidadeMedida, string> = {
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

export const ROTULOS_TIPO_EMBALAGEM: Record<TipoEmbalagem, string> = {
  frasco: 'frasco',
  bisnaga: 'bisnaga',
  envelope: 'envelope',
  spray: 'spray',
  ampola: 'ampola',
};

export const ROTULOS_STATUS_CONFERENCIA: Record<StatusConferencia, string> = {
  pendente: 'pendente',
  conferido: 'conferido',
  resolvido: 'resolvido',
};
