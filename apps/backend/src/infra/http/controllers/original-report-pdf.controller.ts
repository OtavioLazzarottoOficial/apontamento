import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { GetReportUseCase } from '../../../domain/sequencing/application/usecases/get-report-usecase.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';

@Controller('/relatorios')
export class OriginalReportPdfController {
  constructor(private readonly getReport: GetReportUseCase) {}

  @Get(':id/original')
  @UseGuards(ExistingUserGuard)
  @Header('Content-Type', 'application/pdf')
  @Header(
    'Content-Disposition',
    'inline; filename="sequenciamento-original.pdf"',
  )
  @Header('Cache-Control', 'private, no-store')
  async handle(@Param('id') id: string) {
    const result = await this.getReport.execute(id);
    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }
    const source = result.value.report.content.pdfBase64;
    if (typeof source !== 'string' || !source) {
      throw new NotFoundException(
        'O PDF original não está disponível neste relatório.',
      );
    }
    const pdf = Buffer.from(source, 'base64');
    if (pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new NotFoundException(
        'O PDF original não está disponível neste relatório.',
      );
    }
    return new StreamableFile(pdf);
  }
}
