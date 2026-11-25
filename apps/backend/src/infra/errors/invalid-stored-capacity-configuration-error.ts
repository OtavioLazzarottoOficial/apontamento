export class InvalidStoredCapacityConfigurationError extends Error {
  constructor() {
    super('A configuração de capacidade armazenada é inválida.');
  }
}
