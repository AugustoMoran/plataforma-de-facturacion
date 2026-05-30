import { productsService } from '../../../src/modules/products/products.service';

describe('ProductsService - Price Calculations', () => {
  describe('calculatePublicPrice', () => {
    it('should calculate public price with IVA and profit margin', () => {
      // Cost: 100, IVA: 21%, Profit: 30%
      // costWithIva = 100 * 1.21 = 121
      // publicPrice = 121 * 1.30 = 157.30
      const price = productsService.calculatePublicPrice(100, 21, 30);
      expect(price).toBe(157.30);
    });

    it('should calculate price with 0% profit margin', () => {
      // Cost: 100, IVA: 10.5%, Profit: 0%
      // publicPrice = 100 * 1.105 * 1.0 = 110.5
      const price = productsService.calculatePublicPrice(100, 10.5, 0);
      expect(price).toBe(110.5);
    });

    it('should handle zero cost', () => {
      const price = productsService.calculatePublicPrice(0, 21, 30);
      expect(price).toBe(0);
    });

    it('should handle zero IVA', () => {
      // Cost: 200, IVA: 0%, Profit: 50%
      // publicPrice = 200 * 1.0 * 1.5 = 300
      const price = productsService.calculatePublicPrice(200, 0, 50);
      expect(price).toBe(300);
    });
  });

  describe('calculateProfitPercentage', () => {
    it('should calculate profit percentage from public price', () => {
      // Cost: 100, IVA: 21%, publicPrice: 157.30
      // costWithIva = 121
      // profit% = (157.30 - 121) / 121 * 100 = 30%
      const profit = productsService.calculateProfitPercentage(100, 21, 157.30);
      expect(profit).toBeCloseTo(30, 1);
    });

    it('should return 0 if public price equals cost with IVA', () => {
      const profit = productsService.calculateProfitPercentage(100, 21, 121);
      expect(profit).toBe(0);
    });

    it('should handle zero cost', () => {
      const profit = productsService.calculateProfitPercentage(0, 21, 100);
      expect(profit).toBe(0);
    });

    it('should calculate negative profit when price is below cost', () => {
      // This shouldn't happen in practice but should be handled
      const profit = productsService.calculateProfitPercentage(100, 0, 50);
      expect(profit).toBeLessThan(0);
    });
  });
});
