import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SequencingPage } from "./sequencing-page.tsx";
import type { ReportLine, ReportPage } from "./sequencing-shared.ts";
const pages: ReportPage[] = [
  {
    numero: 1,
    largura: 1000,
    altura: 600,
    trechos: [
      { texto: "Máquina Exemplo", x: 0, y: 0, largura: 10, altura: 10 },
      { texto: "OP-24", x: 0, y: 0, largura: 10, altura: 10 },
      { texto: "OP-25", x: 0, y: 0, largura: 10, altura: 10 },
    ],
  },
];
function line(
  date: string,
  order: string,
  fragment: number,
  required: number,
  area: number,
): ReportLine {
  return {
    ordem: order,
    dataEntrega: date,
    programacao: "01/11/2026",
    lote: "100",
    area,
    pendente: 0,
    anterior: 0,
    pecasPorCiclo: 1,
    necessaria: required,
    realizada: 0,
    saldo: required,
    tempoUnitarioSegundos: 1,
    tempoSetupSegundos: 0,
    tempoProducaoSegundos: required,
    campos: {} as ReportLine["campos"],
    camposTexto: {
      ordem: [{ pagina: 1, indice: fragment }],
      produto: [],
      componente: [],
      dimensoes: [],
    },
  };
}
describe("sequencing map by date", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 25, 12));
  });
  afterEach(() => vi.useRealTimers());
  it("separates earlier pending orders from the current production week", () => {
    const html = renderToStaticMarkup(
      <SequencingPage
        efficiency={80}
        pages={pages}
        lines={[
          line("20/11/2026", "OP-24", 1, 10, 2),
          line("25/11/2026", "OP-25", 2, 20, 3),
          { ...line("27/11/2026", "OP-26", 2, 30, 4), concluida: true },
          line("30/11/2026", "OP-27", 2, 40, 5),
        ]}
        dateIndex={0}
        onDateChange={vi.fn()}
        editable
        busy={false}
        onComplete={vi.fn()}
        onSelect={vi.fn()}
        onSelectText={vi.fn()}
      />,
    );
    expect(html).toContain("Entrega 25/11/2026");
    expect(html).toContain("Ver ordens pendentes anteriores (1)");
    expect(html).not.toContain("OP-24");
    expect(html).toContain(
      "Tempo restante na semana: <strong>00:00:20</strong>",
    );
    expect(html).toContain(
      "Tempo restante de todo o sequenciamento</span><strong>00:01:10</strong>",
    );
  });
  it("hides completed orders by default while keeping their values in daily totals", () => {
    const completed = {
      ...line("25/11/2026", "OP-24", 1, 10, 2),
      concluida: true,
    };
    const html = renderToStaticMarkup(
      <SequencingPage
        efficiency={80}
        pages={pages}
        lines={[completed, line("25/11/2026", "OP-25", 2, 20, 3)]}
        dateIndex={0}
        onDateChange={vi.fn()}
        editable
        busy={false}
        onComplete={vi.fn()}
        onSelect={vi.fn()}
        onSelectText={vi.fn()}
      />,
    );
    expect(html).not.toContain("OP-24");
    expect(html).toContain("OP-25");
    expect(html).toContain("Ver concluídas (1)");
    expect(html).toContain(
      "Tempo restante do dia</span><strong>00:00:20</strong>",
    );
    expect(html).toContain(
      "Tempo de produção planejado</span><strong>00:00:30</strong>",
    );
    expect(html).toContain("5,00");
    expect(html).toContain("30");
  });

  it("keeps a completed-only date accessible with a clear empty state", () => {
    const html = renderToStaticMarkup(
      <SequencingPage
        efficiency={80}
        pages={pages}
        lines={[{ ...line("25/11/2026", "OP-24", 1, 10, 2), concluida: true }]}
        dateIndex={0}
        onDateChange={vi.fn()}
        editable
        busy={false}
        onComplete={vi.fn()}
        onSelect={vi.fn()}
        onSelectText={vi.fn()}
      />,
    );
    expect(html).toContain("Nenhuma ordem em aberto nesta data.");
    expect(html).toContain(
      "Tempo restante do dia</span><strong>00:00:00</strong>",
    );
    expect(html).toContain("Ver concluídas (1)");
    expect(html).toContain("Entrega 25/11/2026");
  });

  it("shows the same total remaining across all dates and updates when orders are completed or reopened", () => {
    const lines = [
      line("24/11/2026", "OP-24", 1, 10, 2),
      line("26/11/2026", "OP-25", 2, 20, 3),
      { ...line("27/11/2026", "OP-26", 2, 30, 4), concluida: true },
      line("", "OP-27", 2, 40, 5),
    ];
    const render = (dateIndex: number, reportLines: ReportLine[]) =>
      renderToStaticMarkup(
        <SequencingPage
          efficiency={80}
          pages={pages}
          lines={reportLines}
          dateIndex={dateIndex}
          onDateChange={vi.fn()}
          editable
          busy={false}
          onComplete={vi.fn()}
          onSelect={vi.fn()}
          onSelectText={vi.fn()}
        />,
      );
    const total =
      "Tempo restante de todo o sequenciamento</span><strong>00:01:10</strong>";
    expect(render(0, lines)).toContain(total);
    expect(render(1, lines)).toContain(total);
    expect(render(2, lines)).toContain(total);
    expect(
      render(
        1,
        lines.map((item) => ({ ...item, concluida: true })),
      ),
    ).toContain(
      "Tempo restante de todo o sequenciamento</span><strong>00:00:00</strong>",
    );
    expect(
      render(
        1,
        lines.map((item) => ({ ...item, concluida: false })),
      ),
    ).toContain(
      "Tempo restante de todo o sequenciamento</span><strong>00:01:40</strong>",
    );
  });

  it("shows only the selected date in an editable table, even when dates share a PDF page", () => {
    const html = renderToStaticMarkup(
      <SequencingPage
        efficiency={80}
        pages={pages}
        lines={[
          line("24/11/2026", "OP-24", 1, 99, 25),
          line("25/11/2026", "OP-25", 2, 10, 3.5),
        ]}
        dateIndex={1}
        onDateChange={vi.fn()}
        editable
        busy={false}
        onComplete={vi.fn()}
        onSelect={vi.fn()}
        onSelectText={vi.fn()}
      />,
    );
    expect(html).toContain("<table");
    expect(html).toContain("OP-25");
    expect(html).not.toContain("OP-24");
    expect(html).toContain("25/11/2026");
    expect(html).toContain("3,50");
    expect(html).toContain("Editar Quantidade necessária da OP OP-25");
    expect(html).not.toContain("<img");
  });
});
