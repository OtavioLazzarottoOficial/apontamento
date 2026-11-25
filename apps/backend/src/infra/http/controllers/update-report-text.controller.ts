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
import { UpdateReportTextUseCase } from '../../../domain/sequencing/application/usecases/update-report-text-usecase.ts';
import { VersionConflictError } from '../../../domain/sequencing/application/usecases/errors/version-conflict-error.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const inteiro = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const schema = z.object({
  versaoEsperada: inteiro.positive(),
  pagina: inteiro.positive(),
  indice: inteiro,
  texto: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[\x20-\x7E\xA0-\xFF]+$/),
});

@Controller('/relatorios')
export class UpdateReportTextController {
  constructor(private readonly change: UpdateReportTextUseCase) {}

  @Patch(':id/texto')
  @UseGuards(EditPermissionGuard)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const resultado = await this.change.execute({ id, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof VersionConflictError)
        throw new ConflictException(resultado.value.message);
      throw new NotFoundException(resultado.value.message);
    }
    const response = ReportPresenter.toHTTP(resultado.value.report);
    if (!response.conteudo.paginas) {
      throw new BadRequestException('Conteúdo inválido.');
    }
    return response;
  }
}
