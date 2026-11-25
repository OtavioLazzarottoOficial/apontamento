import { ReportPresenter } from '../presenters/report-presenter.ts';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetReportUseCase } from '../../../domain/sequencing/application/usecases/get-report-usecase.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';

@Controller('/relatorios')
export class GetReportController {
  constructor(private readonly getReport: GetReportUseCase) {}

  @Get(':id')
  @UseGuards(ExistingUserGuard)
  async handle(@Param('id') id: string) {
    const resultado = await this.getReport.execute(id);
    if (resultado.isLeft()) {
      throw new NotFoundException(resultado.value.message);
    }
    return ReportPresenter.toHTTP(resultado.value.report);
  }
}
