export class LinhaNaoEncontradaError extends Error {
  constructor() {
    super('Linha do relatório não encontrada.');
  }
}
