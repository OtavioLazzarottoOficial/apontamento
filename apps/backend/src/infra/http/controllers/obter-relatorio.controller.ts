import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ObterRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/obter-relatorio-usecase.ts';
import { UsuarioExistenteGuard } from '../../auth/usuario-existente.guard.ts';

@Controller('/relatorios')
export class ObterRelatorioController {
  constructor(private readonly obterRelatorio: ObterRelatorioUseCase) {}

  @Get(':id')
  @UseGuards(UsuarioExistenteGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.obterRelatorio.execute(id);
    if (resultado.isLeft()) {
      throw new NotFoundException(resultado.value.message);
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
