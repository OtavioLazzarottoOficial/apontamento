import { SequencingLineObjectValue } from '../../domain/sequencing/enterprise/value-objects/sequencing-line-object-value.ts';
import type { SequencingSummary } from '../../domain/sequencing/enterprise/services/summarize-sequencing.ts';
import { Sequencing } from '../../domain/sequencing/enterprise/sequencing.ts';
import { UniqueEntityID } from '../../core/entities/unique-entity-id.ts';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { left, right, type Either } from '../../core/either.ts';
import type { ReportDocument } from '../../domain/sequencing/application/models/report-document.ts';
import {
  LegacyReportDocument,
  type LegacyReportValue,
} from './legacy-report-document.ts';
import { ProductionOrderLineObjectValue } from '../../domain/sequencing/enterprise/value-objects/production-order-line-object-value.ts';
import { calculateAreaInHundredths } from '../../domain/sequencing/enterprise/services/calculate-area.ts';
import { InvalidLineValuesError } from '../../domain/sequencing/enterprise/errors/invalid-line-values-error.ts';
import { LineNotFoundError } from '../../domain/sequencing/application/usecases/errors/line-not-found-error.ts';
import {
  ReportDocumentEditor,
  type ReportLineChanges,
} from '../../domain/sequencing/application/services/report-document-editor.ts';
import { PdfReportPageSummaryUpdater } from './pdf-report-page-summary-updater.ts';

const reference = z.object({
  pagina: z.number().int().positive(),
  indice: z.number().int().nonnegative(),
});
const linhaSchema = z
  .object({
    ordem: z.string(),
    dataEntrega: z.string(),
    programacao: z.string(),
    lote: z.string(),
    comprimentoMm: z.string(),
    larguraMm: z.string(),
    area: z.number(),
    pendente: z.number(),
    anterior: z.number(),
    pecasPorCiclo: z.number(),
    necessaria: z.number(),
    realizada: z.number(),
    saldo: z.number(),
    tempoSetupSegundos: z.number(),
    tempoUnitarioSegundos: z.number(),
    tempoProducaoSegundos: z.number(),
    camposTexto: z.object({
      ordem: z.array(reference),
      produto: z.array(reference),
      componente: z.array(reference),
      dimensoes: z.array(reference),
    }),
    campos: z.object({
      area: reference,
      pendente: reference,
      anterior: reference,
      pecasPorCiclo: reference,
      necessaria: reference,
      realizada: reference,
      saldo: reference,
      tempoSetup: reference,
      tempoUnitario: reference,
      tempoProducao: reference,
    }),
  })
  .passthrough();
const conteudoSchema = z
  .object({
    linhas: z.array(linhaSchema),
    paginas: z.array(
      z
        .object({
          numero: z.number(),
          largura: z.number(),
          trechos: z.array(
            z
              .object({ texto: z.string(), x: z.number(), y: z.number() })
              .passthrough(),
          ),
        })
        .passthrough(),
    ),
  })
  .passthrough();

function formatPdfTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

const textReference = z.object({
  pagina: z.number().int(),
  indice: z.number().int(),
});
const textSchema = z
  .object({
    linhas: z.array(
      z
        .object({
          ordem: z.string(),
          camposTexto: z.object({
            ordem: z.array(textReference),
            produto: z.array(textReference),
            componente: z.array(textReference),
            dimensoes: z.array(textReference),
          }),
        })
        .passthrough(),
    ),
    paginas: z.array(
      z
        .object({
          numero: z.number(),
          trechos: z.array(z.object({ texto: z.string() }).passthrough()),
        })
        .passthrough(),
    ),
  })
  .passthrough();

@Injectable()
export class PdfReportDocumentEditor extends ReportDocumentEditor {
  constructor(
    private readonly pageSummaryUpdater: PdfReportPageSummaryUpdater,
  ) {
    super();
  }

  updateMachine(
    content: ReportDocument,
    machineId: string | null,
  ): ReportDocument {
    return new LegacyReportDocument({
      ...LegacyReportDocument.dataOf(content),
      machineId,
    });
  }

  updateText(
    content: ReportDocument,
    page: number,
    index: number,
    text: string,
  ): Either<LineNotFoundError, { content: ReportDocument }> {
    const document = textSchema.parse(
      structuredClone(LegacyReportDocument.dataOf(content)),
    );
    const allowed = document.linhas.some((line) =>
      [
        ...line.camposTexto.ordem,
        ...line.camposTexto.produto,
        ...line.camposTexto.componente,
      ].some((ref) => ref.pagina === page && ref.indice === index),
    );
    const fragment = document.paginas.find((item) => item.numero === page)
      ?.trechos[index];
    if (!allowed || !fragment) return left(new LineNotFoundError());
    fragment.texto = text;
    for (const line of document.linhas) {
      if (
        line.camposTexto.ordem.some(
          (ref) => ref.pagina === page && ref.indice === index,
        )
      )
        line.ordem = text;
    }
    return right({
      content: new LegacyReportDocument(
        document as unknown as Record<string, LegacyReportValue>,
      ),
    });
  }

  updateCompletion(
    content: ReportDocument,
    index: number,
    completed: boolean,
  ): Either<LineNotFoundError, { content: ReportDocument }> {
    const document = z
      .object({ linhas: z.array(z.object({}).passthrough()) })
      .passthrough()
      .parse(structuredClone(LegacyReportDocument.dataOf(content)));
    const line = document.linhas[index];
    if (!line) return left(new LineNotFoundError());
    line.concluida = completed;
    return right({
      content: new LegacyReportDocument(
        document as Record<string, LegacyReportValue>,
      ),
    });
  }

  updateLine(
    content: ReportDocument,
    changes: ReportLineChanges,
    calculation: ProductionOrderLineObjectValue,
    reportId: string,
  ): Either<
    InvalidLineValuesError | LineNotFoundError,
    { content: ReportDocument }
  > {
    const legacyContent = conteudoSchema.parse(
      structuredClone(LegacyReportDocument.dataOf(content)),
    );
    const storedLine = legacyContent.linhas[changes.index];
    if (!storedLine) return left(new LineNotFoundError());
    if (changes.dimensions !== undefined) {
      const parsedDimensions =
        /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*\d+(?:[.,]\d+)?$/i.exec(
          changes.dimensions.trim(),
        );
      if (
        !parsedDimensions ||
        calculateAreaInHundredths(
          parsedDimensions[1],
          parsedDimensions[2],
          changes.requiredQuantity,
        ) === null
      ) {
        return left(new InvalidLineValuesError());
      }
      const ref = storedLine.camposTexto.dimensoes.find((item) => {
        const textValue = legacyContent.paginas.find(
          (pdfPage) => pdfPage.numero === item.pagina,
        )?.trechos[item.indice]?.texto;
        return (
          textValue &&
          /^\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*x/i.test(textValue.trim())
        );
      });
      const documentFragment =
        ref &&
        legacyContent.paginas.find((pdfPage) => pdfPage.numero === ref.pagina)
          ?.trechos[ref.indice];
      if (!documentFragment)
        throw new Error('Campo de dimensões não encontrado.');
      documentFragment.texto = changes.dimensions.trim();
      storedLine.comprimentoMm = parsedDimensions[1];
      storedLine.larguraMm = parsedDimensions[2];
    }
    Object.assign(storedLine, {
      necessaria: changes.requiredQuantity,
      realizada: changes.completedQuantity,
      tempoUnitarioSegundos: changes.unitTimeSeconds,
      tempoSetupSegundos: changes.setupTimeSeconds,
      saldo: calculation.balance,
      tempoProducaoSegundos: calculation.productionTimeSeconds,
      pendente: changes.pendingQuantity ?? storedLine.pendente,
      anterior: changes.previousActivity ?? storedLine.anterior,
      pecasPorCiclo: changes.piecesPerCycle ?? storedLine.pecasPorCiclo,
    });
    function updateFragment(ref: z.infer<typeof reference>, textValue: string) {
      const documentFragment = legacyContent.paginas.find(
        (pdfPage) => pdfPage.numero === ref.pagina,
      )?.trechos[ref.indice];
      if (!documentFragment)
        throw new Error(
          'Referência de campo inválida no relatório armazenado.',
        );
      documentFragment.texto = textValue;
    }
    updateFragment(
      storedLine.campos.necessaria,
      changes.requiredQuantity.toFixed(2).replace('.', ','),
    );
    updateFragment(
      storedLine.campos.realizada,
      changes.completedQuantity.toFixed(2).replace('.', ','),
    );
    updateFragment(
      storedLine.campos.saldo,
      calculation.balance.toFixed(2).replace('.', ','),
    );
    updateFragment(
      storedLine.campos.tempoSetup,
      formatPdfTime(changes.setupTimeSeconds),
    );
    updateFragment(
      storedLine.campos.tempoUnitario,
      formatPdfTime(changes.unitTimeSeconds),
    );
    updateFragment(
      storedLine.campos.tempoProducao,
      formatPdfTime(calculation.productionTimeSeconds),
    );
    updateFragment(storedLine.campos.pendente, String(storedLine.pendente));
    updateFragment(
      storedLine.campos.anterior,
      storedLine.anterior.toFixed(2).replace('.', ','),
    );
    updateFragment(
      storedLine.campos.pecasPorCiclo,
      String(storedLine.pecasPorCiclo),
    );
    const domainLines: SequencingLineObjectValue[] = [];
    for (const item of legacyContent.linhas) {
      if (
        calculateAreaInHundredths(
          item.comprimentoMm,
          item.larguraMm,
          item.necessaria,
        ) === null
      ) {
        throw new Error('Dimensões inválidas no relatório armazenado.');
      }
      const line = SequencingLineObjectValue.create({
        deliveryDate: item.dataEntrega,
        schedule: item.programacao,
        batch: item.lote,
        lengthMm: item.comprimentoMm,
        widthMm: item.larguraMm,
        requiredQuantity: item.necessaria,
        completedQuantity: item.realizada,
        unitTimeSeconds: item.tempoUnitarioSegundos,
        setupTimeSeconds: item.tempoSetupSegundos,
      });
      if (line.isLeft()) return left(line.value);
      domainLines.push(line.value);
      item.area = line.value.areaInHundredths / 100;
      item.saldo = line.value.balance;
      item.tempoProducaoSegundos = line.value.productionTimeSeconds;
      updateFragment(item.campos.area, item.area.toFixed(2).replace('.', ','));
      updateFragment(
        item.campos.saldo,
        item.saldo.toFixed(2).replace('.', ','),
      );
      updateFragment(
        item.campos.tempoProducao,
        formatPdfTime(item.tempoProducaoSegundos),
      );
    }
    const summaries = Sequencing.create(
      { lines: domainLines },
      new UniqueEntityID(reportId),
    ).summarize();
    const toStoredSummary = (summary: SequencingSummary) => ({
      necessaria: summary.requiredQuantity,
      realizada: summary.completedQuantity,
      saldo: summary.balance,
      tempoProducaoSegundos: summary.productionTimeSeconds,
    });
    const porData = Object.fromEntries(
      Object.entries(summaries.byDate).map(([key, value]) => [
        key,
        toStoredSummary(value),
      ]),
    );
    const porLote = Object.fromEntries(
      Object.entries(summaries.byBatch).map(([key, value]) => [
        key,
        toStoredSummary(value),
      ]),
    );
    const total = toStoredSummary(summaries.total);
    this.pageSummaryUpdater.updateSummaries(legacyContent.paginas, {
      porData,
      porLote,
      total,
    });
    this.pageSummaryUpdater.updateSubtotals(
      legacyContent.paginas,
      legacyContent.linhas,
    );
    legacyContent.resumos = { porData, porLote, total };
    return right({
      content: new LegacyReportDocument(
        legacyContent as unknown as Record<string, LegacyReportValue>,
      ),
    });
  }
}
