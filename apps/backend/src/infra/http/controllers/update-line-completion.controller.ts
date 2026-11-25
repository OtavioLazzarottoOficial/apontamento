import { ReportPresenter } from '../presenters/report-presenter.ts';
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
import { UpdateLineCompletionUseCase } from '../../../domain/sequencing/application/usecases/update-line-completion-usecase.ts';
import { VersionConflictError } from '../../../domain/sequencing/application/usecases/errors/version-conflict-error.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const inteiro = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const schema = z.object({
  versaoEsperada: inteiro.positive(),
  concluida: z.boolean(),
});
const indiceSchema = z.string().regex(/^\d+$/).transform(Number).pipe(inteiro);

@Controller('/relatorios')
export class UpdateLineCompletionController {
  constructor(private readonly change: UpdateLineCompletionUseCase) {}

  @Patch(':id/linhas/:indice/conclusao')
  @UseGuards(EditPermissionGuard)
  async handle(
    @Param('id') id: string,
    @Param('indice', new ZodValidationPipe(indiceSchema)) indice: number,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const resultado = await this.change.execute({ id, indice, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof VersionConflictError)
        throw new ConflictException(resultado.value.message);
      throw new NotFoundException(resultado.value.message);
    }
    return ReportPresenter.toHTTP(resultado.value.report);
  }
}
