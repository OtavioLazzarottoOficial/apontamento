export class VersionConflictError extends Error {
  constructor() {
    super(
      'O relatório foi alterado por outra pessoa. Recarregue os dados antes de salvar.',
    );
  }
}
