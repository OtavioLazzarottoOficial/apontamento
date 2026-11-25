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
    const resultado = await this.change.execute({ id, indice, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof VersionConflictError)
        throw new ConflictException(resultado.value.message);
      if (
        resultado.value instanceof ReportNotFoundError ||
        resultado.value instanceof LineNotFoundError
      )
        throw new NotFoundException(resultado.value.message);
      throw new BadRequestException(resultado.value.message);
    }
    return ReportPresenter.toHTTP(resultado.value.report);
  }
}
