import { isValidPaywayEmail } from '../services/paywayService';

describe('paywayService', () => {
  describe('isValidPaywayEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidPaywayEmail('cliente@test.com')).toBe(true);
      expect(isValidPaywayEmail('  compras@ososoundmusic.com  ')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidPaywayEmail('')).toBe(false);
      expect(isValidPaywayEmail('sin-arroba.com')).toBe(false);
      expect(isValidPaywayEmail('Juan Perez')).toBe(false);
    });
  });
});
