import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { MachinesRepository } from '../../../../domain/production/application/repositories/machines-repository.ts';
import { Machine } from '../../../../domain/production/enterprise/machine.ts';
import { PrismaService } from '../prisma.service.ts';
@Injectable()
export class PrismaMachinesRepository extends MachinesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async list() {
    return (
      await this.prisma.machine.findMany({ orderBy: { name: 'asc' } })
    ).map((item) =>
      Machine.create(
        { name: item.name, pdfTitle: item.pdfTitle },
        new UniqueEntityID(item.id),
      ),
    );
  }
  async update(machine: Machine) {
    await this.prisma.machine.update({
      where: { id: machine.id.toString() },
      data: { name: machine.name, pdfTitle: machine.pdfTitle },
    });
  }
  async create(machine: Machine) {
    await this.prisma.machine.create({
      data: {
        id: machine.id.toString(),
        name: machine.name,
        pdfTitle: machine.pdfTitle,
      },
    });
  }
}
