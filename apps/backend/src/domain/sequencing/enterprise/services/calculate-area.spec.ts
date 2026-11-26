import { describe, expect, it } from 'vitest';
import { calculateAreaInHundredths } from './calculate-area.ts';

describe('area in square meters', () => {
  it('converts millimeters and rounds to two decimal places', () => {
    expect(calculateAreaInHundredths('351', '298', 390)).toBe(4079);
    expect(calculateAreaInHundredths('1144', '300', 130)).toBe(4462);
    expect(calculateAreaInHundredths('1290.5', '412', 10)).toBe(532);
  });
  it('rejects invalid dimensions or quantities', () => {
    expect(calculateAreaInHundredths('invalido', '300', 1)).toBeNull();
    expect(calculateAreaInHundredths('100', '300', 1.5)).toBeNull();
  });
});
