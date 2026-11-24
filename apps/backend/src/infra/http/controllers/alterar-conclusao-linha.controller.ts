import { Body, ConflictException, Controller, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AlterarConclusaoLinhaUseCase } from '../../../domain/sequenciamento/application/usecases/alterar-conclusao-linha-usecase.ts';
import { ConflitoDeVersaoError } from '../../../domain/sequenciamento/application/usecases/errors/conflito-de-versao-error.ts';
import { PermissaoEditarGuard } from '../../auth/permissao-editar.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const inteiro = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const schema = z.object({ versaoEsperada: inteiro.positive(), concluida: z.boolean() });
const indiceSchema = z.string().regex(/^\d+$/).transform(Number).pipe(inteiro);

@Controller('/relatorios')
export class AlterarConclusaoLinhaController {
  constructor(private readonly alterar: AlterarConclusaoLinhaUseCase) {}

  @Patch(':id/linhas/:indice/conclusao')
  @UseGuards(PermissaoEditarGuard)
  async handle(@Param('id') id: string, @Param('indice', new ZodValidationPipe(indiceSchema)) indice: number, @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>) {
    const resultado = await this.alterar.execute({ id, indice, ...body });
    if (resultado.isLeft()) {
      if (resultado.value instanceof ConflitoDeVersaoError) throw new ConflictException(resultado.value.message);
      throw new NotFoundException(resultado.value.message);
    }
    const relatorio = resultado.value.relatorio;
    const { pdfBase64: _pdfBase64, ...conteudo } = relatorio.conteudo;
    return { id: relatorio.id.toString(), versao: relatorio.versao, conteudo };
  }
}
