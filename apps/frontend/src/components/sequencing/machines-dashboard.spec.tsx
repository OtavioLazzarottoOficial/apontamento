import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MachinesDashboard } from "./machines-dashboard.tsx";
import type { Machine, ReportSummary } from "./sequencing-shared.ts";
const machines: Machine[] = [
  { id: "m1", name: "Furadeira", pdfTitle: "PO Furadeira" },
];
const reports: ReportSummary[] = [
  {
    id: "r1",
    nome: "mapa.pdf",
    versao: 2,
    machineId: "m1",
    dailyAreas: [{ date: "25/11/2026", area: 10 }],
  },
];
describe("machine PDF association", () => {
  it("shows the selected PDF and offers unlinking to authorized editors", () => {
    const html = renderToStaticMarkup(
      <MachinesDashboard
        machines={machines}
        reports={reports}
        onOpen={vi.fn()}
        canEdit
        busy={false}
        onUnlink={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(html).toContain("mapa.pdf");
    expect(html).toContain("Desvincular PDF da máquina");
  });
  it("does not offer unlinking to read-only users", () => {
    const html = renderToStaticMarkup(
      <MachinesDashboard
        machines={machines}
        reports={reports}
        onOpen={vi.fn()}
        canEdit={false}
        busy={false}
        onUnlink={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(html).toContain("mapa.pdf");
    expect(html).not.toContain("Desvincular PDF da máquina");
  });
});
