export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Este e-mail já está cadastrado.');
  }
}
