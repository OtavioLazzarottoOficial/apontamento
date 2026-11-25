import { describe, expect, it, vi } from "vitest";
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
  it("shows only the selected date in an editable table, even when dates share a PDF page", () => {
    const html = renderToStaticMarkup(
      <SequencingPage
        eficiencia={80}
        paginas={pages}
        linhas={[
          line("24/11/2026", "OP-24", 1, 99, 25),
          line("25/11/2026", "OP-25", 2, 10, 3.5),
        ]}
        paginaData={1}
        aoMudarPagina={vi.fn()}
        editavel
        ocupado={false}
        aoConcluir={vi.fn()}
        aoSelecionar={vi.fn()}
        aoSelecionarTexto={vi.fn()}
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
