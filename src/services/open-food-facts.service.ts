import { inferMeasureFromPresentation, inferPackageType } from '../modules/inventory';
import type { CadastroEan } from '../types/inventory';

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: string;
    generic_name?: string;
    quantity?: string;
  };
};

const SOURCES = [
  'https://world.openfoodfacts.org/api/v0/product',
  'https://br.openfoodfacts.org/api/v0/product',
] as const;

export const findProductByEan = async (ean: string): Promise<CadastroEan | null> => {
  for (const source of SOURCES) {
    try {
      const response = await fetch(`${source}/${ean}.json`);
      const data = (await response.json()) as OpenFoodFactsResponse;

      if (data.status === 1 && data.product && (data.product.product_name || data.product.generic_name)) {
        const presentation = data.product.quantity || '';
        return {
          codigo: ean,
          nome: data.product.product_name || data.product.generic_name || '',
          apresentacao: presentation,
          embalagem: inferPackageType(presentation) || undefined,
          custo: 0,
          ...inferMeasureFromPresentation(presentation),
        };
      }
    } catch {
      // Ignore failing source and try the next endpoint.
    }
  }

  return null;
};
