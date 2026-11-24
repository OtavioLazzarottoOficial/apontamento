export class RelatorioNaoEncontradoError extends Error {
  constructor() {
    super('Relatório não encontrado.');
  }
}
