import { SectorDeadlinePanel } from "./sector-deadline-panel.tsx";
import { ReportList } from "./report-list.tsx";
import { PdfFileInput } from "./pdf-file-input.tsx";
import { MachinesPanel } from "./machines-panel.tsx";
import { MachinesDashboard } from "./machines-dashboard.tsx";
import { OriginalPdf } from "./original-pdf.tsx";
import type { Machine } from "./sequencing-shared.ts";
import { useEffect, useState, type FormEvent } from "react";
import type {
  Report,
  FieldReference,
  EditableField,
  UserProfile,
  ReportSummary,
} from "./sequencing-shared.ts";
import { base, request } from "./sequencing-shared.ts";
import { OrdersSummary } from "./orders-summary.tsx";
import { CapacityConfigurationForm } from "./capacity-configuration-form.tsx";
import { UserManagement } from "./user-management.tsx";
import { LineEditor } from "./line-editor.tsx";
import { SequencingPage } from "./sequencing-page.tsx";
import { FieldEditor } from "./field-editor.tsx";
import { TextEditor } from "./text-editor.tsx";

export function SequencingWorkspace() {
  const [token, setToken] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [efficiencyValue, setEfficiencyValue] = useState<number | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reportList, setReportList] = useState<ReportSummary[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [id, setId] = useState("");
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<
    "mapa" | "ordens" | "edicao" | "pdf"
  >("mapa");
  const [workspaceSection, setWorkspaceSection] = useState<
    "reports" | "administration" | "machines" | "dashboard" | "deadlines"
  >("dashboard");
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedField, setSelectedField] = useState<{
    index: number;
    field: EditableField;
  } | null>(null);
  const [selectedText, setSelectedText] = useState<{
    reference: FieldReference;
    label: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [importMachineId, setImportMachineId] = useState("");
  const [importPanelKey, setImportPanelKey] = useState(0);

  function beginMachineImport(machineId: string) {
    setCurrentReport(null);
    setImportMachineId(machineId);
    setImportPanelKey((current) => current + 1);
    setStatusMessage("");
    setWorkspaceSection("reports");
  }

  useEffect(() => {
    if (!token) return;
    const abortController = new AbortController();
    const refresh = () => {
      void request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        },
      )
        .then((config) => setEfficiencyValue(config.eficienciaPercentual))
        .catch(() => {
          if (!abortController.signal.aborted) setEfficiencyValue(null);
        });
    };
    const interval = window.setInterval(refresh, 30000);
    return () => {
      abortController.abort();
      window.clearInterval(interval);
    };
  }, [token]);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setStatusMessage("");
    try {
      await action();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function login(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    await run(async () => {
      const operationResult = await request<{ token: string }>("/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });
      const currentProfile = await request<UserProfile>("/me", {
        headers: { Authorization: `Bearer ${operationResult.token}` },
      });
      const config = await request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        { headers: { Authorization: `Bearer ${operationResult.token}` } },
      );
      const machineList = await request<{ machines: Machine[] }>("/maquinas", {
        headers: { Authorization: `Bearer ${operationResult.token}` },
      });
      setMachines(machineList.machines);
      setEfficiencyValue(config.eficienciaPercentual);
      setUserProfile(currentProfile);
      setToken(operationResult.token);
      const reportResponse = await request<{ relatorios: ReportSummary[] }>(
        "/relatorios",
        {
          headers: { Authorization: `Bearer ${operationResult.token}` },
        },
      );
      setReportList(reportResponse.relatorios);
      setPassword("");
    });
  }

  async function reloadMachines() {
    const result = await request<{ machines: Machine[] }>("/maquinas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMachines(result.machines);
  }

  async function associateMachine(machineId: string) {
    if (!currentReport || !machineId) return;
    await run(async () => {
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(currentReport.id)}/maquina`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machineId,
            expectedVersion: currentReport.versao,
          }),
        },
      );
      updateReportState(updated);
      setStatusMessage("Máquina vinculada ao relatório.");
    });
  }

  async function unlinkReport(
    report: Pick<ReportSummary, "id" | "nome" | "versao">,
  ) {
    if (
      !window.confirm(
        `Desvincular “${report.nome || "relatório sem nome"}” desta máquina? O relatório e o PDF continuarão disponíveis para todos os usuários.`,
      )
    )
      return;
    await run(async () => {
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(report.id)}/maquina`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machineId: null,
            expectedVersion: report.versao,
          }),
        },
      );
      setReportList((current) =>
        current.map((item) =>
          item.id === report.id
            ? { ...item, machineId: null, versao: updated.versao }
            : item,
        ),
      );
      if (currentReport?.id === report.id) setCurrentReport(updated);
      setStatusMessage(
        "Relatório desvinculado. O PDF continua nos relatórios compartilhados.",
      );
    });
  }

  async function openReport(reportId: string, accessToken = token) {
    const operationResult = await request<Report>(
      `/relatorios/${encodeURIComponent(reportId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    updateReportState(operationResult);
    setWorkspaceSection("reports");
    setSearchTerm("");
    setActiveView("mapa");
    setSelectedDateIndex(0);
    setId(operationResult.id);
  }

  async function removeReport(
    report: Pick<ReportSummary, "id" | "nome" | "versao">,
  ) {
    if (
      !window.confirm(
        `Remover o relatório “${report.nome || "sem nome"}” para todos os usuários? O PDF e as alterações serão excluídos permanentemente.`,
      )
    )
      return;
    await run(async () => {
      await request<void>(`/relatorios/${encodeURIComponent(report.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedVersion: report.versao }),
      });
      setReportList((current) =>
        current.filter((item) => item.id !== report.id),
      );
      if (currentReport?.id === report.id) {
        setCurrentReport(null);
        setId("");
        setSelectedField(null);
        setSelectedText(null);
      }
      setStatusMessage("Relatório removido para todos os usuários.");
    });
  }

  function updateReportState(report: Report) {
    setCurrentReport(report);
    setReportList((current) =>
      current.map((item) => {
        if (item.id !== report.id) return item;
        const areas = new Map<string, number>();
        for (const line of report.conteudo.linhas)
          areas.set(
            line.dataEntrega,
            (areas.get(line.dataEntrega) ?? 0) + line.area,
          );
        return {
          ...item,
          versao: report.versao,
          machineId: report.conteudo.machineId ?? null,
          dailyAreas: Array.from(areas, ([date, area]) => ({ date, area })),
        };
      }),
    );
  }

  async function importReport(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      const operationResult = await request<{ id: string }>(
        "/relatorios/importar",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      await openReport(operationResult.id);
      const reportResponse = await request<{ relatorios: ReportSummary[] }>(
        "/relatorios",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setReportList(reportResponse.relatorios);
      form.reset();
      setFileInputKey((current) => current + 1);
      setImportMachineId("");
      setStatusMessage("PDF importado com sucesso.");
    });
  }

  async function updateCompletion(index: number, completed: boolean) {
    if (!currentReport) return;
    await run(async () => {
      const updatedReport = await request<Report>(
        `/relatorios/${encodeURIComponent(currentReport.id)}/linhas/${index}/conclusao`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versaoEsperada: currentReport.versao,
            concluida: completed,
          }),
        },
      );
      updateReportState(updatedReport);
      setStatusMessage(
        completed ? "Ordem marcada como concluída." : "Ordem reaberta.",
      );
    });
  }

  async function exportReport() {
    if (!currentReport) return;
    await run(async () => {
      const response = await fetch(
        `${base}/relatorios/${encodeURIComponent(currentReport.id)}/exportar`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        throw new Error(
          typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string"
            ? error.message
            : "Não foi possível exportar o PDF.",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "relatorio.pdf";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  if (!token)
    return (
      <div className="login-screen">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-mark" aria-hidden="true">
            A
          </div>
          <p className="eyebrow">APONTAMENTO · PRODUÇÃO</p>
          <h1 id="login-title">Bem-vindo</h1>
          <p>
            Acesse sua conta para acompanhar os sequenciamentos de produção.
          </p>
          <form onSubmit={login} className="form-stack">
            <label>
              E-mail
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button disabled={isBusy}>
              {isBusy ? "Entrandoâ€¦" : "Entrar"}
            </button>
          </form>
          {statusMessage && (
            <p role="alert" className="notice">
              {statusMessage}
            </p>
          )}
        </section>
      </div>
    );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <span aria-hidden="true">A</span>
            <div>
              <strong>Apontamento</strong>
              <small>Gestão de produção</small>
            </div>
          </div>
          <nav className="app-navigation" aria-label="Navegação principal">
            <button
              type="button"
              className={workspaceSection === "dashboard" ? "active" : ""}
              aria-current={
                workspaceSection === "dashboard" ? "page" : undefined
              }
              onClick={() => setWorkspaceSection("dashboard")}
            >
              Visão geral
            </button>
            <button
              type="button"
              className={workspaceSection === "machines" ? "active" : ""}
              aria-current={
                workspaceSection === "machines" ? "page" : undefined
              }
              onClick={() => setWorkspaceSection("machines")}
            >
              Máquinas
            </button>
            <button
              type="button"
              className={workspaceSection === "reports" ? "active" : ""}
              aria-current={workspaceSection === "reports" ? "page" : undefined}
              onClick={() => setWorkspaceSection("reports")}
            >
              Sequenciamentos
            </button>
            <button
              type="button"
              className={workspaceSection === "deadlines" ? "active" : ""}
              aria-current={
                workspaceSection === "deadlines" ? "page" : undefined
              }
              onClick={() => setWorkspaceSection("deadlines")}
            >
              Prazos por setor
            </button>
            {userProfile?.papel === "ADMINISTRADOR" && (
              <button
                type="button"
                className={
                  workspaceSection === "administration" ? "active" : ""
                }
                aria-current={
                  workspaceSection === "administration" ? "page" : undefined
                }
                onClick={() => setWorkspaceSection("administration")}
              >
                Administração
              </button>
            )}
          </nav>
          <div className="app-account">
            <span title={userProfile?.email}>{userProfile?.email}</span>
            <button
              type="button"
              onClick={() => {
                setToken("");
                setUserProfile(null);
                setEfficiencyValue(null);
                setReportList([]);
                setMachines([]);
                setCurrentReport(null);
                setId("");
                setWorkspaceSection("dashboard");
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <section className="workspace">
        {statusMessage && workspaceSection !== "reports" && (
          <p role="status" className="notice">
            {statusMessage}
          </p>
        )}
        <div hidden={workspaceSection !== "reports"}>
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">APONTAMENTO · PRODUÇÃO</p>
              <h1>Mapas de sequenciamento</h1>
              <p>Importe um PDF ou abra um relatório pelo identificador.</p>
            </div>
          </div>
          <details
            key={`${currentReport ? "com-relatorio" : "sem-relatorio"}:${importPanelKey}`}
            className="report-options"
            open={!currentReport}
          >
            <summary>Importar ou abrir PDF</summary>
            <div className="tool-grid">
              {(userProfile?.papel === "ADMINISTRADOR" ||
                userProfile?.podeEditar) && (
                <form onSubmit={importReport} className="tool-card">
                  <h2>Importar PDF</h2>
                  <p>
                    Escolha a máquina cadastrada e depois selecione o PDF do
                    sequenciamento.
                  </p>
                  <label>
                    Máquina
                    <select
                      name="machineId"
                      value={importMachineId}
                      onChange={(event) =>
                        setImportMachineId(event.target.value)
                      }
                      required
                    >
                      <option value="">Selecione uma máquina</option>
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {machines.length === 0 && (
                    <p>
                      Cadastre uma máquina no menu Máquinas antes de importar.
                    </p>
                  )}
                  <PdfFileInput
                    key={fileInputKey}
                    disabled={isBusy || !importMachineId}
                  />
                  <button disabled={isBusy}>Importar relatório</button>
                </form>
              )}
              <form
                className="tool-card"
                onSubmit={(formEvent) => {
                  formEvent.preventDefault();
                  void run(() => openReport(id));
                }}
              >
                <h2>Abrir relatório</h2>
                <p>Use o identificador de um relatório compartilhado.</p>
                <label>
                  Identificador
                  <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                  />
                </label>
                <button disabled={isBusy} className="secondary">
                  Abrir relatório
                </button>
              </form>
            </div>
            <ReportList
              reports={reportList}
              machines={machines}
              canEdit={
                userProfile?.papel === "ADMINISTRADOR" ||
                !!userProfile?.podeEditar
              }
              busy={isBusy}
              onOpen={(reportId) => void run(() => openReport(reportId))}
              onDelete={(report) => void removeReport(report)}
            />
          </details>
          {statusMessage && (
            <p role="status" className="notice">
              {statusMessage}
            </p>
          )}
          {currentReport && (
            <section className="document">
              <div className="document-heading">
                <div>
                  <p className="eyebrow">RELATÓRIO DE PRODUÇÃO</p>
                  <h2>{currentReport.conteudo.nome || "Relatório sem nome"}</h2>
                  <p>
                    Versão {currentReport.versao} ·{" "}
                    {currentReport.conteudo.paginas.length} páginas
                  </p>
                  <p>
                    Máquina:{" "}
                    {machines.find(
                      (machine) =>
                        machine.id === currentReport.conteudo.machineId,
                    )?.name ?? "Não vinculada"}
                  </p>
                  {(userProfile?.papel === "ADMINISTRADOR" ||
                    userProfile?.podeEditar) && (
                    <label className="machine-association">
                      Alterar máquina deste relatório
                      <select
                        value={currentReport.conteudo.machineId ?? ""}
                        disabled={isBusy}
                        onChange={(event) =>
                          void associateMachine(event.target.value)
                        }
                      >
                        <option value="">Selecione uma máquina</option>
                        {machines.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <details className="report-id">
                    <summary>Identificador do relatório</summary>
                    <code>{currentReport.id}</code>
                  </details>
                </div>
                {(userProfile?.papel === "ADMINISTRADOR" ||
                  userProfile?.podeEditar) && (
                  <div className="document-actions">
                    {currentReport.conteudo.machineId && (
                      <button
                        type="button"
                        className="secondary"
                        disabled={isBusy}
                        onClick={() =>
                          void unlinkReport({
                            id: currentReport.id,
                            nome: currentReport.conteudo.nome,
                            versao: currentReport.versao,
                          })
                        }
                      >
                        Desvincular da máquina
                      </button>
                    )}
                    <button
                      type="button"
                      className="delete-report-button"
                      disabled={isBusy}
                      onClick={() =>
                        void removeReport({
                          id: currentReport.id,
                          nome: currentReport.conteudo.nome,
                          versao: currentReport.versao,
                        })
                      }
                    >
                      Excluir relatório
                    </button>
                  </div>
                )}
                {(userProfile?.papel === "ADMINISTRADOR" ||
                  userProfile?.podeExportar) && (
                  <button
                    className="secondary"
                    disabled
                    title="Disponível após a implementação do recálculo da serraria"
                    onClick={() => void exportReport()}
                  >
                    Exportar PDF
                  </button>
                )}
              </div>
              <nav
                className="report-nav"
                aria-label="Visualizações do relatório"
              >
                <button
                  type="button"
                  className={activeView === "mapa" ? "" : "secondary"}
                  aria-current={activeView === "mapa" ? "page" : undefined}
                  onClick={() => setActiveView("mapa")}
                >
                  Mapa de sequenciamento
                </button>
                <button
                  type="button"
                  className={activeView === "ordens" ? "" : "secondary"}
                  aria-current={activeView === "ordens" ? "page" : undefined}
                  onClick={() => setActiveView("ordens")}
                >
                  Visualizar ordens
                </button>
                <button
                  type="button"
                  className={activeView === "pdf" ? "" : "secondary"}
                  aria-current={activeView === "pdf" ? "page" : undefined}
                  onClick={() => setActiveView("pdf")}
                >
                  Conferir PDF original
                </button>
                {(userProfile?.papel === "ADMINISTRADOR" ||
                  userProfile?.podeEditar) && (
                  <button
                    type="button"
                    className={activeView === "edicao" ? "" : "secondary"}
                    aria-current={activeView === "edicao" ? "page" : undefined}
                    onClick={() => setActiveView("edicao")}
                  >
                    Editar quantidades e tempos
                  </button>
                )}
              </nav>
              {activeView === "ordens" && (
                <OrdersSummary
                  lines={currentReport.conteudo.linhas}
                  search={searchTerm}
                  onSearch={setSearchTerm}
                />
              )}
              {activeView === "edicao" &&
                (userProfile?.papel === "ADMINISTRADOR" ||
                  userProfile?.podeEditar) && (
                  <section className="report-section">
                    <LineEditor
                      report={currentReport}
                      token={token}
                      onSave={updateReportState}
                    />
                  </section>
                )}
              {(activeView === "mapa" || activeView === "pdf") && (
                <div
                  className={
                    activeView === "pdf" ? "pdf-comparison" : undefined
                  }
                >
                  {activeView === "pdf" && (
                    <OriginalPdf
                      key={currentReport.id}
                      reportId={currentReport.id}
                      token={token}
                    />
                  )}
                  <section className="report-section report-pages">
                    <SequencingPage
                      efficiency={efficiencyValue}
                      pages={currentReport.conteudo.paginas}
                      lines={currentReport.conteudo.linhas}
                      dateIndex={selectedDateIndex}
                      onDateChange={setSelectedDateIndex}
                      editable={
                        userProfile?.papel === "ADMINISTRADOR" ||
                        !!userProfile?.podeEditar
                      }
                      busy={isBusy}
                      onComplete={(index, completed) =>
                        void updateCompletion(index, completed)
                      }
                      onSelect={(index, field) =>
                        setSelectedField({ index, field })
                      }
                      onSelectText={(referencia, rotulo) =>
                        setSelectedText({
                          reference: referencia,
                          label: rotulo,
                        })
                      }
                    />
                  </section>
                </div>
              )}
              {selectedField && (
                <FieldEditor
                  report={currentReport}
                  token={token}
                  selected={selectedField}
                  onClose={() => setSelectedField(null)}
                  onSave={(updatedReport) => {
                    updateReportState(updatedReport);
                    setSelectedField(null);
                  }}
                />
              )}
              {selectedText && (
                <TextEditor
                  report={currentReport}
                  token={token}
                  selected={selectedText}
                  onClose={() => setSelectedText(null)}
                  onSave={(updatedReport) => {
                    updateReportState(updatedReport);
                    setSelectedText(null);
                  }}
                />
              )}
            </section>
          )}
        </div>
        {workspaceSection === "deadlines" && (
          <SectorDeadlinePanel
            token={token}
            reports={reportList}
            machines={machines}
            canEdit={
              userProfile?.papel === "ADMINISTRADOR" ||
              !!userProfile?.podeEditar
            }
          />
        )}
        {workspaceSection === "machines" && (
          <MachinesPanel
            token={token}
            machines={machines}
            canEdit={
              userProfile?.papel === "ADMINISTRADOR" ||
              !!userProfile?.podeEditar
            }
            onCreated={reloadMachines}
            onImport={beginMachineImport}
          />
        )}
        {workspaceSection === "dashboard" && (
          <MachinesDashboard
            machines={machines}
            reports={reportList}
            onOpen={(reportId) => void run(() => openReport(reportId))}
            canEdit={
              userProfile?.papel === "ADMINISTRADOR" ||
              !!userProfile?.podeEditar
            }
            busy={isBusy}
            onUnlink={(report) => void unlinkReport(report)}
            onImport={beginMachineImport}
          />
        )}
        {workspaceSection === "administration" &&
          userProfile?.papel === "ADMINISTRADOR" && (
            <section className="administration-page" aria-label="Administração">
              <p className="eyebrow">CONFIGURAÇÕES</p>
              <h1>Administração</h1>
              <p>
                Gerencie os usuários e a eficiência usada nos sequenciamentos.
              </p>
              <UserManagement token={token} />
              {efficiencyValue !== null && (
                <CapacityConfigurationForm
                  token={token}
                  efficiency={efficiencyValue}
                  onSave={setEfficiencyValue}
                />
              )}
            </section>
          )}
      </section>
    </div>
  );
}
