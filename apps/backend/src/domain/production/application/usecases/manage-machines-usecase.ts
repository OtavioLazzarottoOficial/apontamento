import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { Machine } from '../../enterprise/machine.ts';
import { MachinesRepository } from '../repositories/machines-repository.ts';

export function normalizeMachineTitle(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}
@Injectable()
export class ManageMachinesUseCase {
  constructor(private readonly machines: MachinesRepository) {}
  async list() {
    return this.machines.list();
  }
  async create(
    name: string,
    pdfTitle?: string,
  ): Promise<Either<Error, Machine>> {
    const normalized = normalizeMachineTitle(pdfTitle ?? name);
    const existing = await this.machines.list();
    if (
      existing.some(
        (machine) => normalizeMachineTitle(machine.pdfTitle) === normalized,
      )
    )
      return left(new Error('Esta identificação de PDF já está cadastrada.'));
    const machine = Machine.create({
      name: name.trim(),
      pdfTitle: (pdfTitle ?? name).trim(),
    });
    await this.machines.create(machine);
    return right(machine);
  }
  async update(
    id: string,
    name: string,
    pdfTitle?: string,
  ): Promise<Either<Error, Machine>> {
    const existing = await this.machines.list();
    const current = existing.find((machine) => machine.id.toString() === id);
    if (!current) return left(new Error('Máquina não encontrada.'));
    if (
      existing.some(
        (machine) =>
          machine.id.toString() !== id &&
          normalizeMachineTitle(machine.pdfTitle) ===
            normalizeMachineTitle(pdfTitle ?? current.pdfTitle),
      )
    )
      return left(new Error('Esta identificação de PDF já está cadastrada.'));
    const machine = Machine.create(
      { name: name.trim(), pdfTitle: (pdfTitle ?? current.pdfTitle).trim() },
      current.id,
    );
    await this.machines.update(machine);
    return right(machine);
  }
  async identify(title: string, machineId?: string) {
    const machines = await this.machines.list();
    if (machineId)
      return (
        machines.find((machine) => machine.id.toString() === machineId) ?? null
      );
    const matches = machines.filter(
      (machine) =>
        normalizeMachineTitle(machine.pdfTitle) ===
        normalizeMachineTitle(title),
    );
    return matches.length === 1 ? matches[0] : null;
  }
}
