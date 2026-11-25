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

function tempo(segundos: number) {
  return [
    Math.floor(segundos / 3600),
    Math.floor((segundos % 3600) / 60),
    segundos % 60,
  ]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function formatarNumero(valor: number, original: string) {
  const casas = original.includes(',') ? original.split(',')[1].length : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

/** Atualiza as seções "Resumo Por Data" e "Resumo Por Lotes" do modelo reconhecido. */
export function updatePageSummaries(
  paginas: PageWithFragments[],
  resumos: {
    porData: Record<string, SummaryItem>;
    porLote: Record<string, SummaryItem>;
    total: SummaryItem;
  },
) {
  let secao: 'data' | 'lote' | null = null;
  const datas = new Set<string>();
  const lotes = new Set<string>();
  for (const pagina of paginas) {
    const itens = [...pagina.trechos].sort((a, b) => a.y - b.y);
    for (const item of itens) {
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
      const x = item.x / pagina.largura;
      const data = /^\d{2}\/\d{2}\/\d{4}$/.test(item.texto.trim())
        ? item.texto.trim()
        : null;
      const mesmaLinha = (tolerancia: number) =>
        itens.filter((outro) => Math.abs(outro.y - item.y) < tolerancia);
      let resumo: SummaryItem | undefined;
      let isTotal = false;
      if (data && secao === 'data' && x > 0.54 && x < 0.6) {
        resumo = resumos.porData[data];
        datas.add(data);
      } else if (data && secao === 'lote' && x > 0.45 && x < 0.52) {
        const lote = mesmaLinha(3)
          .find(
            (outro) =>
              outro.x / pagina.largura > 0.55 &&
              outro.x / pagina.largura < 0.6 &&
              /^\d+$/.test(outro.texto.trim()),
          )
          ?.texto.trim();
        if (lote) {
          const chave = `${data}|${lote}`;
          resumo = resumos.porLote[chave];
          lotes.add(chave);
        }
      } else if (item.texto.trim() === 'Total' && x > 0.56 && x < 0.62) {
        resumo = resumos.total;
        isTotal = true;
      } else {
        continue;
      }
      if (!resumo)
        throw new Error(
          'Resumo do relatório não corresponde às linhas importadas.',
        );
      const linha = mesmaLinha(isTotal ? 10 : 3);
      const substituirNumero = (min: number, max: number, valor: number) => {
        const campo = linha.find(
          (t) =>
            t.x / pagina.largura >= min &&
            t.x / pagina.largura < max &&
            /^\d[\d.,]*$/.test(t.texto.trim()),
        );
        if (!campo) throw new Error('Campo de resumo não reconhecido.');
        campo.texto = formatarNumero(valor, campo.texto);
      };
      substituirNumero(0.62, 0.675, resumo.necessaria);
      substituirNumero(0.68, 0.72, resumo.realizada);
      substituirNumero(0.73, 0.79, resumo.saldo);
      const campoTempo = linha.find(
        (t) =>
          t.x / pagina.largura > 0.89 &&
          /^\d+:\d{2}:\d{2}$/.test(t.texto.trim()),
      );
      if (!campoTempo) throw new Error('Tempo do resumo não reconhecido.');
      if (isTotal) {
        const campoDias = linha.find(
          (t) => t.x / pagina.largura > 0.89 && /^\d+D$/.test(t.texto.trim()),
        );
        if (!campoDias) throw new Error('Dias do resumo não reconhecidos.');
        campoDias.texto = `${Math.floor(resumo.tempoProducaoSegundos / 86400)}D`;
        campoTempo.texto = tempo(resumo.tempoProducaoSegundos % 86400);
      } else {
        campoTempo.texto = tempo(resumo.tempoProducaoSegundos);
      }
    }
  }
  if (
    datas.size !== Object.keys(resumos.porData).length ||
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
  paginas: PageWithFragments[],
  linhas: LinhaParaSubtotal[],
) {
  const grupos = new Map<string, LinhaParaSubtotal[]>();
  for (const linha of linhas) {
    const grupo = grupos.get(linha.dataEntrega) ?? [];
    grupo.push(linha);
    grupos.set(linha.dataEntrega, grupo);
  }
  function aplicar(
    pagina: PageWithFragments,
    y: number,
    grupo: LinhaParaSubtotal[],
    detalhe: boolean,
  ) {
    const proximos = pagina.trechos.filter(
      (trecho) => Math.abs(trecho.y - y) < 9,
    );
    const soma = (
      campo: keyof Pick<
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
    ) => grupo.reduce((total, item) => total + item[campo], 0);
    const camposDetalhe: [number, number, number][] = detalhe
      ? [
          [
            0.43,
            0.475,
            grupo.reduce(
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
      const campo = proximos.find(
        (trecho) =>
          trecho.x / pagina.largura >= min &&
          trecho.x / pagina.largura < max &&
          /^\d[\d.,]*$/.test(trecho.texto.trim()),
      );
      if (!campo) throw new Error('Subtotal de quantidade não reconhecido.');
      campo.texto = formatarNumero(valor, campo.texto);
    }
    for (const [min, max, segundos] of [
      [0.78, 0.835, soma('tempoSetupSegundos')],
      [0.835, 0.895, soma('tempoUnitarioSegundos')],
      [0.895, 0.97, soma('tempoProducaoSegundos')],
    ] as const) {
      const campos = proximos.filter(
        (trecho) =>
          trecho.x / pagina.largura >= min && trecho.x / pagina.largura < max,
      );
      const horas = campos.find((trecho) =>
        /^\d+:\d{2}:\d{2}$/.test(trecho.texto.trim()),
      );
      const dias = campos.find((trecho) => /^\d+D$/.test(trecho.texto.trim()));
      if (!horas || !dias)
        throw new Error('Subtotal de tempo não reconhecido.');
      dias.texto = `${Math.floor(segundos / 86400)}D`;
      horas.texto = tempo(segundos % 86400);
    }
  }
  for (const grupo of grupos.values()) {
    const ultima = grupo[grupo.length - 1].campos.necessaria;
    const pagina = paginas.find((item) => item.numero === ultima.pagina);
    const trecho = pagina?.trechos[ultima.indice];
    if (!pagina || !trecho)
      throw new Error('Última linha do grupo não encontrada.');
    const subtotal = pagina.trechos
      .filter(
        (item) =>
          item.y - trecho.y > 8 &&
          item.y - trecho.y < 40 &&
          item.x / pagina.largura >= 0.555 &&
          item.x / pagina.largura < 0.62 &&
          /^\d[\d.,]*$/.test(item.texto.trim()),
      )
      .sort((a, b) => a.y - b.y)[0];
    if (!subtotal) throw new Error('Subtotal do grupo não encontrado.');
    aplicar(pagina, subtotal.y, grupo, true);
  }
  const totais = paginas.flatMap((pagina) =>
    pagina.trechos
      .filter(
        (item) =>
          item.texto.trim() === 'Total:' &&
          item.x / pagina.largura > 0.5 &&
          item.x / pagina.largura < 0.55,
      )
      .map((item) => ({ pagina, item })),
  );
  if (totais.length !== 1) throw new Error('Total geral não encontrado.');
  aplicar(totais[0].pagina, totais[0].item.y, linhas, false);
}
