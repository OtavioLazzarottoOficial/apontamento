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
    const result = await this.getReport.execute(id);
    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }
    return ReportPresenter.toHTTP(result.value.report);
  }
}
