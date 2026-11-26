import { ReportPresenter } from '../presenters/report-presenter.ts';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { UpdateReportLineUseCase } from '../../../domain/sequencing/application/usecases/update-report-line-usecase.ts';
import { LineNotFoundError } from '../../../domain/sequencing/application/usecases/errors/line-not-found-error.ts';
import { VersionConflictError } from '../../../domain/sequencing/application/usecases/errors/version-conflict-error.ts';
import { ReportNotFoundError } from '../../../domain/sequencing/application/usecases/errors/report-not-found-error.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const inteiro = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const schema = z.object({
  versaoEsperada: inteiro.positive(),
  necessaria: inteiro,
  realizada: inteiro,
  tempoUnitarioSegundos: inteiro,
  tempoSetupSegundos: inteiro,
  dimensoes: z.string().min(1).max(100).optional(),
  pendente: inteiro.optional(),
  anterior: inteiro.optional(),
  pecasPorCiclo: inteiro.optional(),
});
const indiceSchema = z.string().regex(/^\d+$/).transform(Number).pipe(inteiro);
type Body = z.infer<typeof schema>;

@Controller('/relatorios')
export class UpdateReportLineController {
  constructor(private readonly change: UpdateReportLineUseCase) {}

  @Patch(':id/linhas/:indice')
  @UseGuards(EditPermissionGuard)
  async handle(
    @Param('id') id: string,
    @Param('indice', new ZodValidationPipe(indiceSchema)) indice: number,
    @Body(new ZodValidationPipe(schema)) body: Body,
  ) {
    const result = await this.change.execute({
      id,
      index: indice,
      expectedVersion: body.versaoEsperada,
      requiredQuantity: body.necessaria,
      completedQuantity: body.realizada,
      unitTimeSeconds: body.tempoUnitarioSegundos,
      setupTimeSeconds: body.tempoSetupSegundos,
      dimensions: body.dimensoes,
      pendingQuantity: body.pendente,
      previousActivity: body.anterior,
      piecesPerCycle: body.pecasPorCiclo,
    });
    if (result.isLeft()) {
      if (result.value instanceof VersionConflictError)
        throw new ConflictException(result.value.message);
      if (
        result.value instanceof ReportNotFoundError ||
        result.value instanceof LineNotFoundError
      )
        throw new NotFoundException(result.value.message);
      throw new BadRequestException(result.value.message);
    }
    return ReportPresenter.toHTTP(result.value.report);
  }
}
