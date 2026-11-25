import { Injectable } from '@nestjs/common';
import type { Machine } from '../../enterprise/machine.ts';
@Injectable()
export abstract class MachinesRepository {
  abstract list(): Promise<Machine[]>;
  abstract create(machine: Machine): Promise<void>;
  abstract update(machine: Machine): Promise<void>;
}
