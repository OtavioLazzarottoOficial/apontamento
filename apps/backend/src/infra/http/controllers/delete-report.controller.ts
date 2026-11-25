import {
  Body,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { DeleteReportUseCase } from '../../../domain/sequencing/application/usecases/delete-report-usecase.ts';
import { ReportNotFoundError } from '../../../domain/sequencing/application/usecases/errors/report-not-found-error.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
const schema = z.object({ expectedVersion: z.number().int().positive() });
@Controller('/relatorios')
export class DeleteReportController {
  constructor(private readonly deleteReport: DeleteReportUseCase) {}
  @Delete(':id')
  @UseGuards(EditPermissionGuard)
  @HttpCode(204)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.deleteReport.execute(id, body.expectedVersion);
    if (result.isLeft()) {
      if (result.value instanceof ReportNotFoundError)
        throw new NotFoundException(result.value.message);
      throw new ConflictException(result.value.message);
    }
  }
}
