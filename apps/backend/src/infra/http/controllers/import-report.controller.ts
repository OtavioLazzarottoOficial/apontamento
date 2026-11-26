import { LegacyReportDocument } from '../../pdf/legacy-report-document.ts';
import { ManageMachinesUseCase } from '../../../domain/production/application/usecases/manage-machines-usecase.ts';
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
import { CreateReportUseCase } from '../../../domain/sequencing/application/usecases/create-report-usecase.ts';
import { identifySequencingLines } from '../../pdf/identify-sequencing-lines.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { PdfExtractor } from '../../pdf/pdf-extractor.ts';

@Controller('/relatorios')
export class ImportReportController {
  constructor(
    private readonly extractor: PdfExtractor,
    private readonly createReport: CreateReportUseCase,
    private readonly machines: ManageMachinesUseCase,
  ) {}

  @Post('importar')
  @UseGuards(EditPermissionGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async handle(
    @UploadedFile() arquivo?: Express.Multer.File,
    @Body('machineId') machineId?: string,
  ) {
    if (typeof machineId !== 'string' || !machineId.trim()) {
      throw new BadRequestException(
        'Selecione uma máquina cadastrada antes de importar o PDF.',
      );
    }
    const machine = await this.machines.identify('', machineId);
    if (!machine) {
      throw new BadRequestException(
        'A máquina selecionada não foi encontrada.',
      );
    }
    if (
      !arquivo ||
      arquivo.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      throw new BadRequestException('Selecione um arquivo PDF válido.');
    }

    let pages;
    try {
      pages = await this.extractor.extract(arquivo.buffer);
    } catch {
      throw new BadRequestException(
        'Não foi possível ler o PDF. Verifique se o arquivo está íntegro e sem senha.',
      );
    }
    if (!pages.some((page) => page.trechos.length > 0)) {
      throw new BadRequestException(
        'O PDF não contém texto selecionável. PDFs digitalizados ainda não são suportados.',
      );
    }

    let lines;
    try {
      lines = identifySequencingLines(pages);
      if (lines.length === 0) {
        throw new Error(
          'Nenhuma ordem de produção foi encontrada no formato esperado.',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Formato de relatório não reconhecido.',
      );
    }

    const result = await this.createReport.execute({
      content: new LegacyReportDocument({
        nome: arquivo.originalname,
        machineId: machine.id.toString(),
        pdfBase64: arquivo.buffer.toString('base64'),
        linhas: lines.map((line) => ({
          ...line,
          camposTexto: {
            ordem: line.camposTexto.ordem.map((ref) => ({ ...ref })),
            produto: line.camposTexto.produto.map((ref) => ({ ...ref })),
            componente: line.camposTexto.componente.map((ref) => ({ ...ref })),
            dimensoes: line.camposTexto.dimensoes.map((ref) => ({ ...ref })),
          },
          campos: {
            area: { ...line.campos.area },
            pendente: { ...line.campos.pendente },
            anterior: { ...line.campos.anterior },
            pecasPorCiclo: { ...line.campos.pecasPorCiclo },
            necessaria: { ...line.campos.necessaria },
            realizada: { ...line.campos.realizada },
            saldo: { ...line.campos.saldo },
            tempoSetup: { ...line.campos.tempoSetup },
            tempoUnitario: { ...line.campos.tempoUnitario },
            tempoProducao: { ...line.campos.tempoProducao },
          },
        })),
        paginas: pages.map((page) => ({
          numero: page.numero,
          largura: page.largura,
          altura: page.altura,
          trechos: page.trechos.map((fragment) => ({ ...fragment })),
        })),
      }),
    });
    if (result.isLeft()) {
      throw new Error('Falha inesperada ao criar relatório.');
    }
    return {
      id: result.value.report.id.toString(),
      versao: result.value.report.version,
    };
  }
}
