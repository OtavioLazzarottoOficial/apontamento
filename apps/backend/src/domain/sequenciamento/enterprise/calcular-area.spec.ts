import { describe, expect, it } from 'vitest';
import { calcularAreaEmCentesimos } from './calcular-area.ts';

describe('área em m²', () => {
  it('converte milímetros e arredonda para duas casas', () => {
    expect(calcularAreaEmCentesimos('351', '298', 390)).toBe(4079);
    expect(calcularAreaEmCentesimos('1144', '300', 130)).toBe(4462);
    expect(calcularAreaEmCentesimos('1290.5', '412', 10)).toBe(532);
  });
  it('rejeita dimensões ou quantidades inválidas', () => {
    expect(calcularAreaEmCentesimos('invalido', '300', 1)).toBeNull();
    expect(calcularAreaEmCentesimos('100', '300', 1.5)).toBeNull();
  });
});
