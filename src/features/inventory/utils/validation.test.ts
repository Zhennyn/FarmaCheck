import { describe, expect, it } from '@jest/globals';
import { validateInventoryEntry } from './validation';

describe('inventory validation', () => {
  it('returns warning for bisnaga with wrong unit', () => {
    const result = validateInventoryEntry({
      presentation: 'Bisnaga 20 g',
      unit: 'ml',
      measureQuantity: '20',
    });

    expect(result.some((message) => message.includes('Bisnaga'))).toBe(true);
  });

  it('returns warning when quantitative unit has empty package measure', () => {
    const result = validateInventoryEntry({
      presentation: 'Frasco',
      unit: 'ml',
      measureQuantity: '',
    });

    expect(result.some((message) => message.includes('Package measure is empty'))).toBe(true);
  });

  it('returns no warnings for coherent entry', () => {
    const result = validateInventoryEntry({
      presentation: 'Frasco 120 ml',
      unit: 'ml',
      measureQuantity: '120',
    });

    expect(result).toEqual([]);
  });
});
