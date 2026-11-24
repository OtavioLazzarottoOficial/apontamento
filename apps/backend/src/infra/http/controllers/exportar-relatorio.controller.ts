import {
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ObterRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/obter-relatorio-usecase.ts';
import { PermissaoExportarGuard } from '../../auth/permissao-exportar.guard.ts';

@Controller('/relatorios')
export class ExportarRelatorioController {
  constructor(private readonly obter: ObterRelatorioUseCase) {}

  @Get(':id/exportar')
  @UseGuards(PermissaoExportarGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.obter.execute(id);
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    if (!resultado.value.relatorio.conteudo.resumos) {
      throw new ConflictException(
        'Salve uma linha para recalcular o relatório antes de exportar.',
      );
    }
    throw new ConflictException(
      'Exportação temporariamente indisponível: falta definir e aplicar o recálculo da serraria.',
    );
  }
}
