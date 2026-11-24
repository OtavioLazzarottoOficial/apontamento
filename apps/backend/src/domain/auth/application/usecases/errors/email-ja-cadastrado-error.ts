export class EmailJaCadastradoError extends Error {
  constructor() {
    super('Este e-mail já está cadastrado.');
  }
}
