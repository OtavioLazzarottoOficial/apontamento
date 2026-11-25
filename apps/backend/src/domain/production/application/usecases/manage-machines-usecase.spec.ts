import { describe, expect, it } from 'vitest';
import { ManageMachinesUseCase } from './manage-machines-usecase.ts';
import { MachinesRepository } from '../repositories/machines-repository.ts';
import type { Machine } from '../../enterprise/machine.ts';
class InMemoryMachinesRepository extends MachinesRepository {
  items: Machine[] = [];
  async list() {
    return this.items;
  }
  async create(machine: Machine) {
    this.items.push(machine);
  }
  async update(machine: Machine) {
    this.items[this.items.findIndex((item) => item.id.equals(machine.id))] =
      machine;
  }
}
describe('machine registration and PDF identification', () => {
  it('identifies the title despite case and whitespace differences', async () => {
    const useCase = new ManageMachinesUseCase(new InMemoryMachinesRepository());
    const created = await useCase.create(
      'Furadeira manual',
      'PO Furadeira Nanxing',
    );
    expect(created.isRight()).toBe(true);
    expect((await useCase.identify('  po  furadeira nanxing  '))?.name).toBe(
      'Furadeira manual',
    );
    expect(await useCase.identify('Outro PDF')).toBeNull();
    expect(
      (await useCase.create('Outra', 'po furadeira nanxing')).isLeft(),
    ).toBe(true);
  });
  it('supports explicit selection and updates without changing identity', async () => {
    const useCase = new ManageMachinesUseCase(new InMemoryMachinesRepository());
    const result = await useCase.create('Corte', 'PO Corte');
    if (result.isLeft()) throw result.value;
    const id = result.value.id.toString();
    expect((await useCase.identify('unknown', id))?.name).toBe('Corte');
    expect((await useCase.update(id, 'Corte 2', 'PO Corte 2')).isRight()).toBe(
      true,
    );
    expect((await useCase.identify('PO Corte 2'))?.id.toString()).toBe(id);
    expect(await useCase.identify('PO Corte')).toBeNull();
  });
});
