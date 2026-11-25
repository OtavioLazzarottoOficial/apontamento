import {
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetReportUseCase } from '../../../domain/sequencing/application/usecases/get-report-usecase.ts';
import { ExportPermissionGuard } from '../../auth/export-permission.guard.ts';

@Controller('/relatorios')
export class ExportReportController {
  constructor(private readonly get: GetReportUseCase) {}

  @Get(':id/exportar')
  @UseGuards(ExportPermissionGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.get.execute(id);
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    if (!resultado.value.report.content.resumos) {
      throw new ConflictException(
        'Salve uma linha para recalcular o relatório antes de exportar.',
      );
    }
    throw new ConflictException(
      'Exportação temporariamente indisponível: falta definir e aplicar o recálculo da serraria.',
    );
  }
}
