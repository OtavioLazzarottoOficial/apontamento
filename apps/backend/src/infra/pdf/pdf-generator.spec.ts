import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { identifySequencingLines } from './identify-sequencing-lines.ts';
import { ReportSnapshot } from '../../domain/sequencing/application/models/report-snapshot.ts';
import {
  LegacyReportDocument,
  type LegacyReportValue,
} from './legacy-report-document.ts';
import { UpdateReportUseCase } from '../../domain/sequencing/application/usecases/update-report-usecase.ts';
import { UpdateReportLineUseCase } from '../../domain/sequencing/application/usecases/update-report-line-usecase.ts';
import { PdfExtractor } from './pdf-extractor.ts';
import { PdfGenerator } from './pdf-generator.ts';
import { PdfReportPageSummaryUpdater } from './pdf-report-page-summary-updater.ts';
import { PdfReportDocumentEditor } from './pdf-report-document-editor.ts';

describe('edited PDF generation', () => {
  it('preserves pages and includes edited and recalculated values', async () => {
    const original = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const extrator = new PdfExtractor();
    const paginas = await extrator.extract(original);
    const linhas = identifySequencingLines(paginas);
    const conteudo = {
      pdfBase64: original.toString('base64'),
      paginas,
      linhas,
    } as unknown as { [key: string]: LegacyReportValue };
    const relatorio = ReportSnapshot.create({
      content: new LegacyReportDocument(conteudo),
      version: 1,
    });
    const repo = new InMemoryReportsRepository();
    repo.items.push(relatorio);
    const sut = new UpdateReportLineUseCase(
      repo,
      new UpdateReportUseCase(repo),
      new PdfReportDocumentEditor(new PdfReportPageSummaryUpdater()),
    );
    const resultado = await sut.execute({
      id: relatorio.id.toString(),
      index: 0,
      expectedVersion: 1,
      requiredQuantity: 390,
      completedQuantity: 20,
      unitTimeSeconds: 40,
      setupTimeSeconds: 40,
    });
    expect(resultado.isRight()).toBe(true);
    const pdf = await new PdfGenerator(extrator).generate(repo.items[0]);
    if (process.env.PDF_QA_PATH) await writeFile(process.env.PDF_QA_PATH, pdf);
    const extraido = await extrator.extract(pdf);
    expect(extraido).toHaveLength(5);
    expect(extraido.every((pagina) => pagina.trechos.length === 0)).toBe(true);
  });
});
