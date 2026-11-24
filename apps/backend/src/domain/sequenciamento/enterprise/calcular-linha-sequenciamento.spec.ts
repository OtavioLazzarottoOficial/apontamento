import { describe, expect, it } from 'vitest';
import { calcularLinhaSequenciamento } from './calcular-linha-sequenciamento.ts';

describe('calcularLinhaSequenciamento', () => {
  const valores = {
    quantidadeNecessaria: 130,
    quantidadeRealizada: 30,
    tempoPorPecaEmSegundos: 40,
    tempoSetupEmSegundos: 60,
  };
  it('calcula saldo e soma o setup ao tempo das peças', () => {
    const resultado = calcularLinhaSequenciamento(valores);
    expect(resultado.isRight()).toBe(true);
    expect(resultado.value).toEqual({
      saldo: 100,
      tempoProducaoEmSegundos: 5260,
    });
  });
  it('mantém tempo de produção quando a quantidade já foi realizada', () => {
    expect(
      calcularLinhaSequenciamento({ ...valores, quantidadeRealizada: 130 })
        .value,
    ).toEqual({ saldo: 0, tempoProducaoEmSegundos: 5260 });
  });
  it.each([
    { quantidadeRealizada: 131 },
    { quantidadeNecessaria: 1.5 },
    { quantidadeRealizada: -1 },
    { tempoSetupEmSegundos: -1 },
  ])('rejeita valores inválidos: %o', (alteracao) => {
    expect(
      calcularLinhaSequenciamento({ ...valores, ...alteracao }).isLeft(),
    ).toBe(true);
  });
});
