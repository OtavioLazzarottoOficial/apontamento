import { left, right, type Either } from '../../../core/either.ts';
import { ValoresLinhaInvalidosError } from './errors/valores-linha-invalidos-error.ts';

export interface ValoresLinhaSequenciamento {
  quantidadeNecessaria: number;
  quantidadeRealizada: number;
  tempoPorPecaEmSegundos: number;
  tempoSetupEmSegundos: number;
}

export function calcularLinhaSequenciamento(
  valores: ValoresLinhaSequenciamento,
): Either<
  ValoresLinhaInvalidosError,
  { saldo: number; tempoProducaoEmSegundos: number }
> {
  const numeros = [
    valores.quantidadeNecessaria,
    valores.quantidadeRealizada,
    valores.tempoPorPecaEmSegundos,
    valores.tempoSetupEmSegundos,
  ];
  if (
    numeros.some((numero) => !Number.isSafeInteger(numero) || numero < 0) ||
    valores.quantidadeRealizada > valores.quantidadeNecessaria
  ) {
    return left(new ValoresLinhaInvalidosError());
  }
  const tempoProducaoEmSegundos =
    valores.quantidadeNecessaria * valores.tempoPorPecaEmSegundos +
    valores.tempoSetupEmSegundos;
  if (!Number.isSafeInteger(tempoProducaoEmSegundos)) {
    return left(new ValoresLinhaInvalidosError());
  }
  return right({
    saldo: valores.quantidadeNecessaria - valores.quantidadeRealizada,
    tempoProducaoEmSegundos,
  });
}
