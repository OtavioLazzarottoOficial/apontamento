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
import { AlterarTextoRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/alterar-texto-relatorio-usecase.ts';
import { ConflitoDeVersaoError } from '../../../domain/sequenciamento/application/usecases/errors/conflito-de-versao-error.ts';
import { PermissaoEditarGuard } from '../../auth/permissao-editar.guard.ts';
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
export class AlterarTextoRelatorioController {
  constructor(private readonly alterar: AlterarTextoRelatorioUseCase) {}

  @Patch(':id/texto')
  @UseGuards(PermissaoEditarGuard)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const resultado = await this.alterar.execute({ id, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof ConflitoDeVersaoError)
        throw new ConflictException(resultado.value.message);
      throw new NotFoundException(resultado.value.message);
    }
    const relatorio = resultado.value.relatorio;
    const { pdfBase64: _pdfBase64, ...conteudo } = relatorio.conteudo;
    if (!conteudo.paginas) throw new BadRequestException('Conteúdo inválido.');
    return { id: relatorio.id.toString(), versao: relatorio.versao, conteudo };
  }
}
