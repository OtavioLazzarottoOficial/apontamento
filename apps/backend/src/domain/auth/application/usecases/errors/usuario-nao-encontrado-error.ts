export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super('Usuário não encontrado ou não pode ser alterado.');
  }
}
