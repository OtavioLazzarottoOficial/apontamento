export class InvalidEfficiencyError extends Error {
  constructor() {
    super('A eficiência deve ser um número inteiro entre 1 e 100.');
  }
}
