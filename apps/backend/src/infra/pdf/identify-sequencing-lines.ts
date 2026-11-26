interface PdfPage {
  numero: number;
  largura: number;
  trechos: { texto: string; x: number; y: number }[];
}

export interface TextFragmentReference {
  pagina: number;
  indice: number;
}
export interface SequencingLine {
  ordem: string;
  dataEntrega: string;
  programacao: string;
  lote: string;
  comprimentoMm: string;
  larguraMm: string;
  area: number;
  pendente: number;
  anterior: number;
  pecasPorCiclo: number;
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoSetupSegundos: number;
  tempoUnitarioSegundos: number;
  tempoProducaoSegundos: number;
  camposTexto: {
    ordem: TextFragmentReference[];
    produto: TextFragmentReference[];
    componente: TextFragmentReference[];
    dimensoes: TextFragmentReference[];
  };
  campos: {
    area: TextFragmentReference;
    pendente: TextFragmentReference;
    anterior: TextFragmentReference;
    pecasPorCiclo: TextFragmentReference;
    necessaria: TextFragmentReference;
    realizada: TextFragmentReference;
    saldo: TextFragmentReference;
    tempoSetup: TextFragmentReference;
    tempoUnitario: TextFragmentReference;
    tempoProducao: TextFragmentReference;
  };
}

function number(text: string): number | null {
  const limpo = text.trim();
  if (!/^\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^\d+(?:,\d+)?$/.test(limpo)) return null;
  return Number(limpo.replace(/\./g, '').replace(',', '.'));
}

function duration(text: string): number | null {
  const parts = /^(\d+):(\d{2}):(\d{2})$/.exec(text.trim());
  if (!parts || Number(parts[2]) >= 60 || Number(parts[3]) >= 60) return null;
  return Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3]);
}

/** Reconhece as linhas do mapa de sequenciamento com a disposição do modelo de referência. */
export function identifySequencingLines(pages: PdfPage[]): SequencingLine[] {
  const lines: SequencingLine[] = [];
  let dataEntrega = '';
  for (const page of pages) {
    const items = page.trechos
      .map((fragment, index) => ({ trecho: fragment, indice: index }))
      .sort((a, b) => a.trecho.y - b.trecho.y);
    for (const { trecho } of items) {
      const data = /Data\s*Entrega\s*(\d{2}\/\d{2}\/\d{4})/i.exec(trecho.texto);
      if (data) {
        dataEntrega = data[1];
        continue;
      }
      const x = trecho.x / page.largura;
      if (!/^\d{8}$/.test(trecho.texto.trim()) || x < 0.17 || x > 0.21)
        continue;
      const naLinha = items.filter(
        (item) => Math.abs(item.trecho.y - trecho.y) < 2.5,
      );
      const agrupamento = items.filter(
        (item) =>
          Math.abs(item.trecho.y - trecho.y) < 10 &&
          item.trecho.x / page.largura >= 0.115 &&
          item.trecho.x / page.largura < 0.17,
      );
      const referenciasTexto = (min: number, max: number) =>
        items
          .filter(
            (item) =>
              Math.abs(item.trecho.y - trecho.y) < 10 &&
              item.trecho.x / page.largura >= min &&
              item.trecho.x / page.largura < max,
          )
          .map((item) => ({ pagina: page.numero, indice: item.indice }));
      const camposTexto = {
        ordem: referenciasTexto(0.17, 0.21),
        produto: referenciasTexto(0, 0.112),
        componente: referenciasTexto(0.21, 0.36),
        dimensoes: referenciasTexto(0.36, 0.43),
      };
      const parsedDimensions = camposTexto.dimensoes
        .map((ref) => page.trechos[ref.indice].texto)
        .map((text) =>
          /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*\d+(?:[.,]\d+)?/i.exec(
            text.trim(),
          ),
        )
        .find(Boolean);
      const lote = agrupamento
        .find((item) => /^\d{3,}$/.test(item.trecho.texto.trim()))
        ?.trecho.texto.trim();
      const programacao = agrupamento
        .map((item) => /\d{2}\/\d{2}\/\d{4}/.exec(item.trecho.texto)?.[0])
        .find(Boolean);
      function field(
        min: number,
        max: number,
        parse: (text: string) => number | null,
      ): { valor: number; ref: TextFragmentReference } | null {
        const opcoes = naLinha
          .map((item) => ({ ...item, valor: parse(item.trecho.texto) }))
          .filter(
            (item) =>
              item.trecho.x / page.largura >= min &&
              item.trecho.x / page.largura < max &&
              item.valor !== null,
          );
        if (opcoes.length !== 1) return null;
        return {
          valor: opcoes[0].valor as number,
          ref: { pagina: page.numero, indice: opcoes[0].indice },
        };
      }
      const area = field(0.43, 0.475, number);
      const pendente = field(0.475, 0.515, number);
      const previous = field(0.515, 0.555, number);
      const pecasPorCiclo = field(0.735, 0.78, number);
      const necessaria = field(0.555, 0.62, number);
      const realizada = field(0.62, 0.675, number);
      const saldo = field(0.675, 0.735, number);
      const tempoSetup = field(0.78, 0.835, duration);
      const tempoUnitario = field(0.835, 0.895, duration);
      const tempoProducao = field(0.895, 0.97, duration);
      if (
        !dataEntrega ||
        !lote ||
        !programacao ||
        !parsedDimensions ||
        !area ||
        !pendente ||
        !previous ||
        !pecasPorCiclo ||
        !necessaria ||
        !realizada ||
        !saldo ||
        !tempoSetup ||
        !tempoUnitario ||
        !tempoProducao
      ) {
        throw new Error(
          `Não foi possível identificar todos os valores da ordem ${trecho.texto} na página ${page.numero}.`,
        );
      }
      lines.push({
        ordem: trecho.texto,
        dataEntrega,
        programacao,
        lote,
        comprimentoMm: parsedDimensions[1],
        larguraMm: parsedDimensions[2],
        area: area.valor,
        pendente: pendente.valor,
        anterior: previous.valor,
        pecasPorCiclo: pecasPorCiclo.valor,
        necessaria: necessaria.valor,
        realizada: realizada.valor,
        saldo: saldo.valor,
        tempoSetupSegundos: tempoSetup.valor,
        tempoUnitarioSegundos: tempoUnitario.valor,
        tempoProducaoSegundos: tempoProducao.valor,
        camposTexto,
        campos: {
          area: area.ref,
          pendente: pendente.ref,
          anterior: previous.ref,
          pecasPorCiclo: pecasPorCiclo.ref,
          necessaria: necessaria.ref,
          realizada: realizada.ref,
          saldo: saldo.ref,
          tempoSetup: tempoSetup.ref,
          tempoUnitario: tempoUnitario.ref,
          tempoProducao: tempoProducao.ref,
        },
      });
    }
  }
  return lines;
}
