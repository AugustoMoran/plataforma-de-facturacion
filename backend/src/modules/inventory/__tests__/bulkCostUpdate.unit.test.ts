import {
  applyCostIncreaseKeepingRealMargin,
  deriveEffectiveMargin,
  recalculatePriceKeepingMargin,
} from '../services/inventoryService';

describe('aumento masivo de costo', () => {
  it('sube costo y precio exactamente el % indicado (ej. 5%)', () => {
    const result = applyCostIncreaseKeepingRealMargin(1000, 1815, 5, 21);

    expect(result.newCostPrice).toBe(1050);
    expect(result.newPrice).toBe(1905.75);
  });

  it('no usa el margen guardado en 0: mantiene el margen real del precio actual', () => {
    // Precio real implica ~50% de margen; si se usara margin=0 el precio nuevo sería 127.05 (incorrecto)
    const cost = 100;
    const price = 181.5;
    const iva = 21;
    const storedMarginWrong = 0;

    const buggyIfStoredMargin = recalculatePriceKeepingMargin(cost * 1.05, storedMarginWrong, iva);
    expect(buggyIfStoredMargin).toBe(127.05);

    const fixed = applyCostIncreaseKeepingRealMargin(cost, price, 5, iva);
    expect(fixed.newCostPrice).toBe(105);
    expect(fixed.newPrice).toBe(190.58);
    expect(fixed.margin).toBeCloseTo(50, 1);
  });

  it('deriveEffectiveMargin calcula el margen implícito', () => {
    expect(deriveEffectiveMargin(100, 181.5, 21)).toBeCloseTo(50, 1);
  });

  it('acepta aumentos fraccionarios', () => {
    const result = applyCostIncreaseKeepingRealMargin(200, 363, 12.5, 21);
    expect(result.newCostPrice).toBe(225);
    expect(result.newPrice).toBe(408.38);
  });
});
