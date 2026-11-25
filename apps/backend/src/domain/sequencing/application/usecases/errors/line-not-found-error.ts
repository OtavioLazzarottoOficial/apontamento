export class LineNotFoundError extends Error {
  constructor() {
    super('Linha do relatório não encontrada.');
  }
}
