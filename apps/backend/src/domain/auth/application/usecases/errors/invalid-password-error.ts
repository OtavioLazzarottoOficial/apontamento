export class InvalidPasswordError extends Error {
  constructor() {
    super(
      'A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes em UTF-8.',
    );
  }
}
