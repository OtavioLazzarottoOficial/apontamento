export class ReportNotFoundError extends Error {
  constructor() {
    super('Relatório não encontrado.');
  }
}
