import type { TipoEmbalagem, UnidadeMedida } from '../../../types/inventory';
import { ROTULOS_UNIDADE_MEDIDA } from '../constants';
import { inferMeasureFromPresentation, inferPackageType, parseMeasureNumber } from './measurement';

export type InventoryValidationInput = {
  presentation: string;
  unit: UnidadeMedida;
  measureQuantity: string;
};

export const validateInventoryEntry = (input: InventoryValidationInput): string[] => {
  const warnings: string[] = [];
  const inferredPackage = inferPackageType(input.presentation);
  const inferredUnit = inferMeasureFromPresentation(input.presentation).unidade_medida;

  if (inferredPackage === 'frasco' && !['ml', 'gotas', 'g', 'unidades'].includes(input.unit)) {
    warnings.push('Frasco normally uses ml, gotas, g or unidades.');
  }

  if (inferredPackage === 'bisnaga' && input.unit !== 'g') {
    warnings.push('Bisnaga usually uses g as unit.');
  }

  if (input.presentation && inferredUnit !== 'unidades' && inferredUnit !== input.unit) {
    warnings.push(
      `Presentation suggests ${ROTULOS_UNIDADE_MEDIDA[inferredUnit]}, but selected unit is ${ROTULOS_UNIDADE_MEDIDA[input.unit]}.`
    );
  }

  if (['ml', 'g', 'gotas'].includes(input.unit) && !parseMeasureNumber(input.measureQuantity)) {
    warnings.push('Package measure is empty for a quantitative unit.');
  }

  return warnings;
};

export const resolveProductType = (payload: {
  embalagem?: TipoEmbalagem;
  unidade_medida?: UnidadeMedida;
  apresentacao?: string;
}) => {
  const pack = payload.embalagem || inferPackageType(payload.apresentacao) || '';
  if (pack) return pack;

  return payload.unidade_medida || inferMeasureFromPresentation(payload.apresentacao).unidade_medida;
};
