import {
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ManageMachinesUseCase } from '../../../domain/production/application/usecases/manage-machines-usecase.ts';
import { ReportsRepository } from '../../../domain/sequencing/application/repositories/reports-repository.ts';
import { UpdateReportUseCase } from '../../../domain/sequencing/application/usecases/update-report-usecase.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { ReportPresenter } from '../presenters/report-presenter.ts';
const schema = z.object({
  machineId: z.string().min(1).nullable(),
  expectedVersion: z.number().int().positive(),
});
@Controller('/relatorios')
export class AssociateReportMachineController {
  constructor(
    private readonly machines: ManageMachinesUseCase,
    private readonly reports: ReportsRepository,
    private readonly update: UpdateReportUseCase,
  ) {}
  @Patch(':id/maquina')
  @UseGuards(EditPermissionGuard)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const machine =
      body.machineId === null
        ? null
        : await this.machines.identify('', body.machineId);
    if (body.machineId !== null && !machine)
      throw new NotFoundException('Máquina não encontrada.');
    const report = await this.reports.findById(id);
    if (!report) throw new NotFoundException('Relatório não encontrado.');
    const result = await this.update.execute({
      id,
      expectedVersion: body.expectedVersion,
      content: { ...report.content, machineId: machine?.id.toString() ?? null },
    });
    if (result.isLeft()) throw new ConflictException(result.value.message);
    return ReportPresenter.toHTTP(result.value.report);
  }
}
