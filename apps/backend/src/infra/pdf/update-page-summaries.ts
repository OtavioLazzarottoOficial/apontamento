export interface SummaryItem {
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoProducaoSegundos: number;
}
export interface PageWithFragments {
  numero: number;
  largura: number;
  trechos: { texto: string; x: number; y: number }[];
}

function tempo(seconds: number) {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function formatarNumero(value: number, source: string) {
  const casas = source.includes(',') ? source.split(',')[1].length : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(value);
}

/** Atualiza as seções "Resumo Por Data" e "Resumo Por Lotes" do modelo reconhecido. */
export function updatePageSummaries(
  pages: PageWithFragments[],
  resumos: {
    porData: Record<string, SummaryItem>;
    porLote: Record<string, SummaryItem>;
    total: SummaryItem;
  },
) {
  let secao: 'data' | 'lote' | null = null;
  const dates = new Set<string>();
  const lotes = new Set<string>();
  for (const page of pages) {
    const items = [...page.trechos].sort((a, b) => a.y - b.y);
    for (const item of items) {
      if (/Resumo Por Data/i.test(item.texto)) {
        secao = 'data';
        continue;
      }
      if (/Resumo Por Lotes/i.test(item.texto)) {
        secao = 'lote';
        continue;
      }
      if (/Resumo Para Serraria/i.test(item.texto)) {
        secao = null;
        continue;
      }
      if (!secao) continue;
      const x = item.x / page.largura;
      const data = /^\d{2}\/\d{2}\/\d{4}$/.test(item.texto.trim())
        ? item.texto.trim()
        : null;
      const mesmaLinha = (tolerancia: number) =>
        items.filter((outro) => Math.abs(outro.y - item.y) < tolerancia);
      let matchedSummary: SummaryItem | undefined;
      let isTotal = false;
      if (data && secao === 'data' && x > 0.54 && x < 0.6) {
        matchedSummary = resumos.porData[data];
        dates.add(data);
      } else if (data && secao === 'lote' && x > 0.45 && x < 0.52) {
        const lote = mesmaLinha(3)
          .find(
            (outro) =>
              outro.x / page.largura > 0.55 &&
              outro.x / page.largura < 0.6 &&
              /^\d+$/.test(outro.texto.trim()),
          )
          ?.texto.trim();
        if (lote) {
          const key = `${data}|${lote}`;
          matchedSummary = resumos.porLote[key];
          lotes.add(key);
        }
      } else if (item.texto.trim() === 'Total' && x > 0.56 && x < 0.62) {
        matchedSummary = resumos.total;
        isTotal = true;
      } else {
        continue;
      }
      if (!matchedSummary)
        throw new Error(
          'Resumo do relatório não corresponde às linhas importadas.',
        );
      const line = mesmaLinha(isTotal ? 10 : 3);
      const substituirNumero = (min: number, max: number, value: number) => {
        const field = line.find(
          (t) =>
            t.x / page.largura >= min &&
            t.x / page.largura < max &&
            /^\d[\d.,]*$/.test(t.texto.trim()),
        );
        if (!field) throw new Error('Campo de resumo não reconhecido.');
        field.texto = formatarNumero(value, field.texto);
      };
      substituirNumero(0.62, 0.675, matchedSummary.necessaria);
      substituirNumero(0.68, 0.72, matchedSummary.realizada);
      substituirNumero(0.73, 0.79, matchedSummary.saldo);
      const campoTempo = line.find(
        (t) =>
          t.x / page.largura > 0.89 && /^\d+:\d{2}:\d{2}$/.test(t.texto.trim()),
      );
      if (!campoTempo) throw new Error('Tempo do resumo não reconhecido.');
      if (isTotal) {
        const campoDias = line.find(
          (t) => t.x / page.largura > 0.89 && /^\d+D$/.test(t.texto.trim()),
        );
        if (!campoDias) throw new Error('Dias do resumo não reconhecidos.');
        campoDias.texto = `${Math.floor(matchedSummary.tempoProducaoSegundos / 86400)}D`;
        campoTempo.texto = tempo(matchedSummary.tempoProducaoSegundos % 86400);
      } else {
        campoTempo.texto = tempo(matchedSummary.tempoProducaoSegundos);
      }
    }
  }
  if (
    dates.size !== Object.keys(resumos.porData).length ||
    lotes.size !== Object.keys(resumos.porLote).length
  ) {
    throw new Error('Nem todos os resumos puderam ser identificados.');
  }
}

interface LinhaParaSubtotal {
  dataEntrega: string;
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
  campos: { necessaria: { pagina: number; indice: number } };
}

export function updatePageSubtotals(
  pages: PageWithFragments[],
  lines: LinhaParaSubtotal[],
) {
  const groups = new Map<string, LinhaParaSubtotal[]>();
  for (const line of lines) {
    const group = groups.get(line.dataEntrega) ?? [];
    group.push(line);
    groups.set(line.dataEntrega, group);
  }
  function aplicar(
    page: PageWithFragments,
    y: number,
    group: LinhaParaSubtotal[],
    detalhe: boolean,
  ) {
    const proximos = page.trechos.filter(
      (fragment) => Math.abs(fragment.y - y) < 9,
    );
    const soma = (
      field: keyof Pick<
        LinhaParaSubtotal,
        | 'area'
        | 'pendente'
        | 'anterior'
        | 'pecasPorCiclo'
        | 'necessaria'
        | 'realizada'
        | 'saldo'
        | 'tempoSetupSegundos'
        | 'tempoUnitarioSegundos'
        | 'tempoProducaoSegundos'
      >,
    ) => group.reduce((total, item) => total + item[field], 0);
    const camposDetalhe: [number, number, number][] = detalhe
      ? [
          [
            0.43,
            0.475,
            group.reduce(
              (total, item) => total + Math.round(item.area * 100),
              0,
            ) / 100,
          ],
          [0.475, 0.515, soma('pendente')],
          [0.515, 0.555, soma('anterior')],
          [0.735, 0.78, soma('pecasPorCiclo')],
        ]
      : [];
    for (const [min, max, valor] of [
      ...camposDetalhe,
      [0.555, 0.62, soma('necessaria')],
      [0.62, 0.675, soma('realizada')],
      [0.675, 0.735, soma('saldo')],
    ] as const) {
      const field = proximos.find(
        (fragment) =>
          fragment.x / page.largura >= min &&
          fragment.x / page.largura < max &&
          /^\d[\d.,]*$/.test(fragment.texto.trim()),
      );
      if (!field) throw new Error('Subtotal de quantidade não reconhecido.');
      field.texto = formatarNumero(valor, field.texto);
    }
    for (const [min, max, segundos] of [
      [0.78, 0.835, soma('tempoSetupSegundos')],
      [0.835, 0.895, soma('tempoUnitarioSegundos')],
      [0.895, 0.97, soma('tempoProducaoSegundos')],
    ] as const) {
      const fields = proximos.filter(
        (fragment) =>
          fragment.x / page.largura >= min && fragment.x / page.largura < max,
      );
      const hours = fields.find((fragment) =>
        /^\d+:\d{2}:\d{2}$/.test(fragment.texto.trim()),
      );
      const dias = fields.find((fragment) =>
        /^\d+D$/.test(fragment.texto.trim()),
      );
      if (!hours || !dias)
        throw new Error('Subtotal de tempo não reconhecido.');
      dias.texto = `${Math.floor(segundos / 86400)}D`;
      hours.texto = tempo(segundos % 86400);
    }
  }
  for (const group of groups.values()) {
    const ultima = group[group.length - 1].campos.necessaria;
    const page = pages.find((item) => item.numero === ultima.pagina);
    const fragment = page?.trechos[ultima.indice];
    if (!page || !fragment)
      throw new Error('Última linha do grupo não encontrada.');
    const subtotal = page.trechos
      .filter(
        (item) =>
          item.y - fragment.y > 8 &&
          item.y - fragment.y < 40 &&
          item.x / page.largura >= 0.555 &&
          item.x / page.largura < 0.62 &&
          /^\d[\d.,]*$/.test(item.texto.trim()),
      )
      .sort((a, b) => a.y - b.y)[0];
    if (!subtotal) throw new Error('Subtotal do grupo não encontrado.');
    aplicar(page, subtotal.y, group, true);
  }
  const totais = pages.flatMap((page) =>
    page.trechos
      .filter(
        (item) =>
          item.texto.trim() === 'Total:' &&
          item.x / page.largura > 0.5 &&
          item.x / page.largura < 0.55,
      )
      .map((item) => ({ pagina: page, item })),
  );
  if (totais.length !== 1) throw new Error('Total geral não encontrado.');
  aplicar(totais[0].pagina, totais[0].item.y, lines, false);
}
