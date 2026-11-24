import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CriarRelatorioUseCase } from '../../../domain/sequenciamento/application/usecases/criar-relatorio-usecase.ts';
import { identificarLinhasSequenciamento } from '../../../domain/sequenciamento/enterprise/identificar-linhas-sequenciamento.ts';
import { PermissaoEditarGuard } from '../../auth/permissao-editar.guard.ts';
import { ExtratorPdf } from '../../pdf/extrator-pdf.ts';

@Controller('/relatorios')
export class ImportarRelatorioController {
  constructor(
    private readonly extrator: ExtratorPdf,
    private readonly criarRelatorio: CriarRelatorioUseCase,
  ) {}

  @Post('importar')
  @UseGuards(PermissaoEditarGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async handle(@UploadedFile() arquivo?: Express.Multer.File) {
    if (
      !arquivo ||
      arquivo.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      throw new BadRequestException('Selecione um arquivo PDF válido.');
    }

    let paginas;
    try {
      paginas = await this.extrator.extrair(arquivo.buffer);
    } catch {
      throw new BadRequestException(
        'Não foi possível ler o PDF. Verifique se o arquivo está íntegro e sem senha.',
      );
    }
    if (!paginas.some((pagina) => pagina.trechos.length > 0)) {
      throw new BadRequestException(
        'O PDF não contém texto selecionável. PDFs digitalizados ainda não são suportados.',
      );
    }

    let linhas;
    try {
      linhas = identificarLinhasSequenciamento(paginas);
      if (linhas.length === 0) {
        throw new Error(
          'Nenhuma ordem de produção foi encontrada no formato esperado.',
        );
      }
    } catch (erro) {
      throw new BadRequestException(
        erro instanceof Error
          ? erro.message
          : 'Formato de relatório não reconhecido.',
      );
    }

    const resultado = await this.criarRelatorio.execute({
      conteudo: {
        nome: arquivo.originalname,
        pdfBase64: arquivo.buffer.toString('base64'),
        linhas: linhas.map((linha) => ({
          ...linha,
          camposTexto: {
            ordem: linha.camposTexto.ordem.map((ref) => ({ ...ref })),
            produto: linha.camposTexto.produto.map((ref) => ({ ...ref })),
            componente: linha.camposTexto.componente.map((ref) => ({ ...ref })),
            dimensoes: linha.camposTexto.dimensoes.map((ref) => ({ ...ref })),
          },
          campos: {
            area: { ...linha.campos.area },
            pendente: { ...linha.campos.pendente },
            anterior: { ...linha.campos.anterior },
            pecasPorCiclo: { ...linha.campos.pecasPorCiclo },
            necessaria: { ...linha.campos.necessaria },
            realizada: { ...linha.campos.realizada },
            saldo: { ...linha.campos.saldo },
            tempoSetup: { ...linha.campos.tempoSetup },
            tempoUnitario: { ...linha.campos.tempoUnitario },
            tempoProducao: { ...linha.campos.tempoProducao },
          },
        })),
        paginas: paginas.map((pagina) => ({
          numero: pagina.numero,
          largura: pagina.largura,
          altura: pagina.altura,
          trechos: pagina.trechos.map((trecho) => ({ ...trecho })),
        })),
      },
    });
    if (resultado.isLeft()) {
      throw new Error('Falha inesperada ao criar relatório.');
    }
    return {
      id: resultado.value.relatorio.id.toString(),
      versao: resultado.value.relatorio.versao,
    };
  }
}
