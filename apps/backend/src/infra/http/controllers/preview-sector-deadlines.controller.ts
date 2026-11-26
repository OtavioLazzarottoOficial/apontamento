import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { readDeadlineSpreadsheet } from '../../spreadsheets/read-deadline-spreadsheet.ts';

@Controller('/prazos')
export class PreviewSectorDeadlinesController {
  @Post('planilha/preview')
  @UseGuards(EditPermissionGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async preview(
    @UploadedFile() file?: Express.Multer.File,
    @Body('ano') rawYear?: string,
  ) {
    const year = Number(rawYear);
    if (
      !file ||
      !file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.buffer.subarray(0, 2).toString() !== 'PK'
    ) {
      throw new BadRequestException(
        'Selecione uma planilha Excel .xlsx válida.',
      );
    }
    if (!Number.isInteger(year) || year < 1900 || year > 9999)
      throw new BadRequestException(
        'Informe o ano das datas sem ano na planilha.',
      );
    try {
      return await readDeadlineSpreadsheet(file.buffer, year);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('Não foi possível identificar') ||
          error.message.startsWith('Nenhum lote') ||
          error.message.startsWith('Planilha excede'))
      )
        throw new BadRequestException(error.message);
      throw new BadRequestException(
        'Não foi possível ler a planilha. Verifique se o arquivo está íntegro e sem senha.',
      );
    }
  }
}
