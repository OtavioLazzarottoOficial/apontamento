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
import { AssociateReportMachineUseCase } from '../../../domain/sequencing/application/usecases/associate-report-machine-usecase.ts';
import { VersionConflictError } from '../../../domain/sequencing/application/usecases/errors/version-conflict-error.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { ReportPresenter } from '../presenters/report-presenter.ts';
const schema = z.object({
  machineId: z.string().min(1).nullable(),
  expectedVersion: z.number().int().positive(),
});
@Controller('/relatorios')
export class AssociateReportMachineController {
  constructor(private readonly associate: AssociateReportMachineUseCase) {}
  @Patch(':id/maquina')
  @UseGuards(EditPermissionGuard)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.associate.execute({
      id,
      machineId: body.machineId,
      expectedVersion: body.expectedVersion,
    });
    if (result.isLeft()) {
      if (result.value instanceof VersionConflictError)
        throw new ConflictException(result.value.message);
      throw new NotFoundException(result.value.message);
    }
    return ReportPresenter.toHTTP(result.value.report);
  }
}
