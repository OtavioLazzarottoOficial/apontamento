export class MachineNotFoundError extends Error {
  constructor() {
    super('Máquina não encontrada.');
  }
}
