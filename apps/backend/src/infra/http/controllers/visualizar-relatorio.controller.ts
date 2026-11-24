import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ObterRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/obter-relatorio-usecase.ts';
import { UsuarioExistenteGuard } from '../../auth/usuario-existente.guard.ts';
import { GeradorPdf } from '../../pdf/gerador-pdf.ts';

@Controller('/relatorios')
export class VisualizarRelatorioController {
  constructor(
    private readonly obter: ObterRelatorioUseCase,
    private readonly gerador: GeradorPdf,
  ) {}

  @Get(':id/preview')
  @UseGuards(UsuarioExistenteGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.obter.execute(id);
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    return {
      paginas: await this.gerador.gerarPreview(resultado.value.relatorio),
    };
  }
}
