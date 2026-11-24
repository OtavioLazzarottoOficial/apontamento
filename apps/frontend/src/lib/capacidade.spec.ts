import { describe, expect, it } from 'vitest';
import { analisarCapacidade } from './capacidade.ts';

describe('capacidade planejada', () => {
  it('usa jornada de 8h48 e compara tempo das peças somado ao setup', () => {
    const resultado = analisarCapacidade([{ necessaria: 1, tempoUnitarioSegundos: 24000, tempoSetupSegundos: 1800 }], 80);
    expect(resultado).toEqual({ tempoPecas: 24000, tempoSetup: 1800, capacidade: 25344, carga: 25800, excesso: 456 });
  });
  it('aplica a eficiência e não aponta excesso no limite exato', () => {
    expect(analisarCapacidade([{ necessaria: 1, tempoUnitarioSegundos: 26928, tempoSetupSegundos: 0 }], 85).excesso).toBe(0);
    expect(analisarCapacidade([], 85).capacidade).toBe(26928);
  });
});
