export class DadosRelatorioInvalidosError extends Error {
  constructor() {
    super('O conteúdo armazenado do relatório é inválido.');
  }
}
