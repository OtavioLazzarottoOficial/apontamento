import { MachinesRepository } from '../../src/domain/production/application/repositories/machines-repository.ts';
import type { Machine } from '../../src/domain/production/enterprise/machine.ts';

export class InMemoryMachinesRepository extends MachinesRepository {
  items: Machine[] = [];

  async list() {
    return this.items;
  }
  async create(machine: Machine) {
    this.items.push(machine);
  }
  async update(machine: Machine) {
    const index = this.items.findIndex((item) => item.id.equals(machine.id));
    if (index >= 0) this.items[index] = machine;
  }
}
