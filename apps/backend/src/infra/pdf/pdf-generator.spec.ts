import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { identifySequencingLines } from './identify-sequencing-lines.ts';
import {
  Report,
  type ReportValue,
} from '../../domain/sequencing/enterprise/report.ts';
import { UpdateReportUseCase } from '../../domain/sequencing/application/usecases/update-report-usecase.ts';
import { UpdateReportLineUseCase } from '../../domain/sequencing/application/usecases/update-report-line-usecase.ts';
import { PdfExtractor } from './pdf-extractor.ts';
import { PdfGenerator } from './pdf-generator.ts';
import { PdfReportPageSummaryUpdater } from './pdf-report-page-summary-updater.ts';
import { PdfReportDocumentEditor } from './pdf-report-document-editor.ts';

describe('geração de PDF editado', () => {
  it('preserva as páginas e inclui os valores editados e recalculados', async () => {
    const original = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const extrator = new PdfExtractor();
    const paginas = await extrator.extrair(original);
    const linhas = identifySequencingLines(paginas);
    const conteudo = {
      pdfBase64: original.toString('base64'),
      paginas,
      linhas,
    } as unknown as { [key: string]: ReportValue };
    const relatorio = Report.create({ content: conteudo, version: 1 });
    const repo = new InMemoryReportsRepository();
    repo.items.push(relatorio);
    const sut = new UpdateReportLineUseCase(
      repo,
      new UpdateReportUseCase(repo),
      new PdfReportDocumentEditor(new PdfReportPageSummaryUpdater()),
    );
    const resultado = await sut.execute({
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      necessaria: 390,
      realizada: 20,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
    });
    expect(resultado.isRight()).toBe(true);
    const pdf = await new PdfGenerator(extrator).gerar(repo.items[0]);
    if (process.env.PDF_QA_PATH) await writeFile(process.env.PDF_QA_PATH, pdf);
    const extraido = await extrator.extrair(pdf);
    expect(extraido).toHaveLength(5);
    expect(extraido.every((pagina) => pagina.trechos.length === 0)).toBe(true);
  });
});
