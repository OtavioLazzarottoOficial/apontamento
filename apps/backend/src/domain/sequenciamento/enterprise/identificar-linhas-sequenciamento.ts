interface PaginaPdf {
  numero: number;
  largura: number;
  trechos: { texto: string; x: number; y: number }[];
}

export interface ReferenciaTrecho {
  pagina: number;
  indice: number;
}
export interface LinhaSequenciamento {
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
    ordem: ReferenciaTrecho[];
    produto: ReferenciaTrecho[];
    componente: ReferenciaTrecho[];
    dimensoes: ReferenciaTrecho[];
  };
  campos: {
    area: ReferenciaTrecho;
    pendente: ReferenciaTrecho;
    anterior: ReferenciaTrecho;
    pecasPorCiclo: ReferenciaTrecho;
    necessaria: ReferenciaTrecho;
    realizada: ReferenciaTrecho;
    saldo: ReferenciaTrecho;
    tempoSetup: ReferenciaTrecho;
    tempoUnitario: ReferenciaTrecho;
    tempoProducao: ReferenciaTrecho;
  };
}

function numero(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^\d+(?:,\d+)?$/.test(limpo)) return null;
  return Number(limpo.replace(/\./g, '').replace(',', '.'));
}

function duracao(texto: string): number | null {
  const partes = /^(\d+):(\d{2}):(\d{2})$/.exec(texto.trim());
  if (!partes || Number(partes[2]) >= 60 || Number(partes[3]) >= 60)
    return null;
  return Number(partes[1]) * 3600 + Number(partes[2]) * 60 + Number(partes[3]);
}

/** Reconhece as linhas do mapa de sequenciamento com a disposição do modelo de referência. */
export function identificarLinhasSequenciamento(
  paginas: PaginaPdf[],
): LinhaSequenciamento[] {
  const linhas: LinhaSequenciamento[] = [];
  let dataEntrega = '';
  for (const pagina of paginas) {
    const itens = pagina.trechos
      .map((trecho, indice) => ({ trecho, indice }))
      .sort((a, b) => a.trecho.y - b.trecho.y);
    for (const { trecho } of itens) {
      const data = /Data\s*Entrega\s*(\d{2}\/\d{2}\/\d{4})/i.exec(trecho.texto);
      if (data) {
        dataEntrega = data[1];
        continue;
      }
      const x = trecho.x / pagina.largura;
      if (!/^\d{8}$/.test(trecho.texto.trim()) || x < 0.17 || x > 0.21)
        continue;
      const naLinha = itens.filter(
        (item) => Math.abs(item.trecho.y - trecho.y) < 2.5,
      );
      const agrupamento = itens.filter(
        (item) =>
          Math.abs(item.trecho.y - trecho.y) < 10 &&
          item.trecho.x / pagina.largura >= 0.115 &&
          item.trecho.x / pagina.largura < 0.17,
      );
      const referenciasTexto = (min: number, max: number) =>
        itens
          .filter(
            (item) =>
              Math.abs(item.trecho.y - trecho.y) < 10 &&
              item.trecho.x / pagina.largura >= min &&
              item.trecho.x / pagina.largura < max,
          )
          .map((item) => ({ pagina: pagina.numero, indice: item.indice }));
      const camposTexto = {
        ordem: referenciasTexto(0.17, 0.21),
        produto: referenciasTexto(0, 0.112),
        componente: referenciasTexto(0.21, 0.36),
        dimensoes: referenciasTexto(0.36, 0.43),
      };
      const dimensoes = camposTexto.dimensoes
        .map((ref) => pagina.trechos[ref.indice].texto)
        .map((texto) =>
          /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*\d+(?:[.,]\d+)?/i.exec(
            texto.trim(),
          ),
        )
        .find(Boolean);
      const lote = agrupamento
        .find((item) => /^\d{3,}$/.test(item.trecho.texto.trim()))
        ?.trecho.texto.trim();
      const programacao = agrupamento
        .map((item) => /\d{2}\/\d{2}\/\d{4}/.exec(item.trecho.texto)?.[0])
        .find(Boolean);
      function campo(
        min: number,
        max: number,
        parse: (texto: string) => number | null,
      ): { valor: number; ref: ReferenciaTrecho } | null {
        const opcoes = naLinha
          .map((item) => ({ ...item, valor: parse(item.trecho.texto) }))
          .filter(
            (item) =>
              item.trecho.x / pagina.largura >= min &&
              item.trecho.x / pagina.largura < max &&
              item.valor !== null,
          );
        if (opcoes.length !== 1) return null;
        return {
          valor: opcoes[0].valor as number,
          ref: { pagina: pagina.numero, indice: opcoes[0].indice },
        };
      }
      const area = campo(0.43, 0.475, numero);
      const pendente = campo(0.475, 0.515, numero);
      const anterior = campo(0.515, 0.555, numero);
      const pecasPorCiclo = campo(0.735, 0.78, numero);
      const necessaria = campo(0.555, 0.62, numero);
      const realizada = campo(0.62, 0.675, numero);
      const saldo = campo(0.675, 0.735, numero);
      const tempoSetup = campo(0.78, 0.835, duracao);
      const tempoUnitario = campo(0.835, 0.895, duracao);
      const tempoProducao = campo(0.895, 0.97, duracao);
      if (
        !dataEntrega ||
        !lote ||
        !programacao ||
        !dimensoes ||
        !area ||
        !pendente ||
        !anterior ||
        !pecasPorCiclo ||
        !necessaria ||
        !realizada ||
        !saldo ||
        !tempoSetup ||
        !tempoUnitario ||
        !tempoProducao
      ) {
        throw new Error(
          `Não foi possível identificar todos os valores da ordem ${trecho.texto} na página ${pagina.numero}.`,
        );
      }
      linhas.push({
        ordem: trecho.texto,
        dataEntrega,
        programacao,
        lote,
        comprimentoMm: dimensoes[1],
        larguraMm: dimensoes[2],
        area: area.valor,
        pendente: pendente.valor,
        anterior: anterior.valor,
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
          anterior: anterior.ref,
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
  return linhas;
}
