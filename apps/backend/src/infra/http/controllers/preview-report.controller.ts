import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetReportUseCase } from '../../../domain/sequencing/application/usecases/get-report-usecase.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';
import { PdfGenerator } from '../../pdf/pdf-generator.ts';

@Controller('/relatorios')
export class PreviewReportController {
  constructor(
    private readonly get: GetReportUseCase,
    private readonly generator: PdfGenerator,
  ) {}

  @Get(':id/preview')
  @UseGuards(ExistingUserGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.get.execute(id);
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    return {
      paginas: await this.generator.gerarPreview(resultado.value.report),
    };
  }
}
