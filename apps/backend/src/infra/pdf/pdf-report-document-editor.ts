import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { left, right, type Either } from '../../core/either.ts';
import type { ReportValue } from '../../domain/sequencing/enterprise/report.ts';
import { ProductionOrderLine } from '../../domain/sequencing/enterprise/value-objects/production-order-line.ts';
import { calculateAreaInHundredths } from '../../domain/sequencing/enterprise/services/calculate-area.ts';
import { InvalidLineValuesError } from '../../domain/sequencing/enterprise/errors/invalid-line-values-error.ts';
import { LineNotFoundError } from '../../domain/sequencing/application/usecases/errors/line-not-found-error.ts';
import {
  ReportDocumentEditor,
  type ReportLineChanges,
} from '../../domain/sequencing/application/services/report-document-editor.ts';
import { PdfReportPageSummaryUpdater } from './pdf-report-page-summary-updater.ts';

const referencia = z.object({
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
      ordem: z.array(referencia),
      produto: z.array(referencia),
      componente: z.array(referencia),
      dimensoes: z.array(referencia),
    }),
    campos: z.object({
      area: referencia,
      pendente: referencia,
      anterior: referencia,
      pecasPorCiclo: referencia,
      necessaria: referencia,
      realizada: referencia,
      saldo: referencia,
      tempoSetup: referencia,
      tempoUnitario: referencia,
      tempoProducao: referencia,
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

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return [horas, minutos, segundos % 60]
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

  updateText(
    content: Record<string, ReportValue>,
    page: number,
    index: number,
    text: string,
  ): Either<LineNotFoundError, { content: Record<string, ReportValue> }> {
    const document = textSchema.parse(structuredClone(content));
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
      content: document as unknown as Record<string, ReportValue>,
    });
  }

  updateCompletion(
    content: Record<string, ReportValue>,
    index: number,
    completed: boolean,
  ): Either<LineNotFoundError, { content: Record<string, ReportValue> }> {
    const document = z
      .object({ linhas: z.array(z.object({}).passthrough()) })
      .passthrough()
      .parse(structuredClone(content));
    const line = document.linhas[index];
    if (!line) return left(new LineNotFoundError());
    line.concluida = completed;
    return right({ content: document as Record<string, ReportValue> });
  }

  updateLine(
    content: Record<string, ReportValue>,
    changes: ReportLineChanges,
    calculation: ProductionOrderLine,
  ): Either<
    InvalidLineValuesError | LineNotFoundError,
    { content: Record<string, ReportValue> }
  > {
    const conteudo = conteudoSchema.parse(structuredClone(content));
    const linha = conteudo.linhas[changes.index];
    if (!linha) return left(new LineNotFoundError());
    if (changes.dimensions !== undefined) {
      const dimensoes =
        /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*\d+(?:[.,]\d+)?$/i.exec(
          changes.dimensions.trim(),
        );
      if (
        !dimensoes ||
        calculateAreaInHundredths(
          dimensoes[1],
          dimensoes[2],
          changes.requiredQuantity,
        ) === null
      ) {
        return left(new InvalidLineValuesError());
      }
      const ref = linha.camposTexto.dimensoes.find((item) => {
        const texto = conteudo.paginas.find(
          (pagina) => pagina.numero === item.pagina,
        )?.trechos[item.indice]?.texto;
        return (
          texto &&
          /^\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*x/i.test(texto.trim())
        );
      });
      const trecho =
        ref &&
        conteudo.paginas.find((pagina) => pagina.numero === ref.pagina)
          ?.trechos[ref.indice];
      if (!trecho) throw new Error('Campo de dimensões não encontrado.');
      trecho.texto = changes.dimensions.trim();
      linha.comprimentoMm = dimensoes[1];
      linha.larguraMm = dimensoes[2];
    }
    Object.assign(linha, {
      necessaria: changes.requiredQuantity,
      realizada: changes.completedQuantity,
      tempoUnitarioSegundos: changes.unitTimeSeconds,
      tempoSetupSegundos: changes.setupTimeSeconds,
      saldo: calculation.balance,
      tempoProducaoSegundos: calculation.productionTimeSeconds,
      pendente: changes.pendingQuantity ?? linha.pendente,
      anterior: changes.previousActivity ?? linha.anterior,
      pecasPorCiclo: changes.piecesPerCycle ?? linha.pecasPorCiclo,
    });
    function atualizarTrecho(ref: z.infer<typeof referencia>, texto: string) {
      const trecho = conteudo.paginas.find(
        (pagina) => pagina.numero === ref.pagina,
      )?.trechos[ref.indice];
      if (!trecho)
        throw new Error(
          'Referência de campo inválida no relatório armazenado.',
        );
      trecho.texto = texto;
    }
    atualizarTrecho(
      linha.campos.necessaria,
      changes.requiredQuantity.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.realizada,
      changes.completedQuantity.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.saldo,
      calculation.balance.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.tempoSetup,
      formatarTempo(changes.setupTimeSeconds),
    );
    atualizarTrecho(
      linha.campos.tempoUnitario,
      formatarTempo(changes.unitTimeSeconds),
    );
    atualizarTrecho(
      linha.campos.tempoProducao,
      formatarTempo(calculation.productionTimeSeconds),
    );
    atualizarTrecho(linha.campos.pendente, String(linha.pendente));
    atualizarTrecho(
      linha.campos.anterior,
      linha.anterior.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(linha.campos.pecasPorCiclo, String(linha.pecasPorCiclo));
    const porData: Record<
      string,
      {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      }
    > = {};
    const porLote: Record<
      string,
      {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      }
    > = {};
    const total = {
      necessaria: 0,
      realizada: 0,
      saldo: 0,
      tempoProducaoSegundos: 0,
    };
    for (const item of conteudo.linhas) {
      const areaEmCentesimos = calculateAreaInHundredths(
        item.comprimentoMm,
        item.larguraMm,
        item.necessaria,
      );
      if (areaEmCentesimos === null) {
        throw new Error('Dimensões inválidas no relatório armazenado.');
      }
      item.area = areaEmCentesimos / 100;
      atualizarTrecho(item.campos.area, item.area.toFixed(2).replace('.', ','));
      const resultado = ProductionOrderLine.create({
        requiredQuantity: item.necessaria,
        completedQuantity: item.realizada,
        unitTimeSeconds: item.tempoUnitarioSegundos,
        setupTimeSeconds: item.tempoSetupSegundos,
      });
      if (resultado.isLeft()) {
        return left(resultado.value);
      }
      item.saldo = resultado.value.balance;
      item.tempoProducaoSegundos = resultado.value.productionTimeSeconds;
      atualizarTrecho(
        item.campos.saldo,
        item.saldo.toFixed(2).replace('.', ','),
      );
      atualizarTrecho(
        item.campos.tempoProducao,
        formatarTempo(item.tempoProducaoSegundos),
      );
      const data = (porData[item.dataEntrega] ??= {
        necessaria: 0,
        realizada: 0,
        saldo: 0,
        tempoProducaoSegundos: 0,
      });
      const lote = (porLote[`${item.programacao}|${item.lote}`] ??= {
        necessaria: 0,
        realizada: 0,
        saldo: 0,
        tempoProducaoSegundos: 0,
      });
      for (const resumo of [data, lote, total]) {
        resumo.necessaria += item.necessaria;
        resumo.realizada += item.realizada;
        resumo.saldo += item.saldo;
        resumo.tempoProducaoSegundos += item.tempoProducaoSegundos;
      }
    }
    this.pageSummaryUpdater.updateSummaries(conteudo.paginas, {
      porData,
      porLote,
      total,
    });
    this.pageSummaryUpdater.updateSubtotals(conteudo.paginas, conteudo.linhas);
    conteudo.resumos = { porData, porLote, total };
    return right({
      content: conteudo as unknown as Record<string, ReportValue>,
    });
  }
}
