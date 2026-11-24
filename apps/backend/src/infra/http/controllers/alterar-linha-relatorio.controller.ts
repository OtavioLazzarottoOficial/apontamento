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
import { AlterarLinhaRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/alterar-linha-relatorio-usecase.ts';
import { LinhaNaoEncontradaError } from '../../../domain/sequenciamento/application/usecases/errors/linha-nao-encontrada-error.ts';
import { ConflitoDeVersaoError } from '../../../domain/sequenciamento/application/usecases/errors/conflito-de-versao-error.ts';
import { RelatorioNaoEncontradoError } from '../../../domain/sequenciamento/application/usecases/errors/relatorio-nao-encontrado-error.ts';
import { PermissaoEditarGuard } from '../../auth/permissao-editar.guard.ts';
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
export class AlterarLinhaRelatorioController {
  constructor(private readonly alterar: AlterarLinhaRelatorioUseCase) {}

  @Patch(':id/linhas/:indice')
  @UseGuards(PermissaoEditarGuard)
  async handle(
    @Param('id') id: string,
    @Param('indice', new ZodValidationPipe(indiceSchema)) indice: number,
    @Body(new ZodValidationPipe(schema)) body: Body,
  ) {
    const resultado = await this.alterar.execute({ id, indice, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof ConflitoDeVersaoError)
        throw new ConflictException(resultado.value.message);
      if (
        resultado.value instanceof RelatorioNaoEncontradoError ||
        resultado.value instanceof LinhaNaoEncontradaError
      )
        throw new NotFoundException(resultado.value.message);
      throw new BadRequestException(resultado.value.message);
    }
    const relatorio = resultado.value.relatorio;
    const { pdfBase64: _pdfBase64, ...conteudo } = relatorio.conteudo;
    return {
      id: relatorio.id.toString(),
      versao: relatorio.versao,
      conteudo,
    };
  }
}
