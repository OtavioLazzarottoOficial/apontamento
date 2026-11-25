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
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [eficiencia, setEficiencia] = useState<number | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [relatorios, setRelatorios] = useState<ReportSummary[]>([]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [id, setId] = useState("");
  const [relatorio, setRelatorio] = useState<Report | null>(null);
  const [busca, setBusca] = useState("");
  const [tela, setTela] = useState<"mapa" | "ordens" | "edicao" | "pdf">(
    "mapa",
  );
  const [workspaceSection, setWorkspaceSection] = useState<
    "reports" | "administration" | "machines" | "dashboard"
  >("dashboard");
  const [paginaData, setPaginaData] = useState(0);
  const [campoSelecionado, setCampoSelecionado] = useState<{
    indice: number;
    campo: EditableField;
  } | null>(null);
  const [textoSelecionado, setTextoSelecionado] = useState<{
    referencia: FieldReference;
    rotulo: string;
  } | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [importMachineId, setImportMachineId] = useState("");
  const [importPanelKey, setImportPanelKey] = useState(0);

  function beginMachineImport(machineId: string) {
    setRelatorio(null);
    setImportMachineId(machineId);
    setImportPanelKey((current) => current + 1);
    setMensagem("");
    setWorkspaceSection("reports");
  }

  useEffect(() => {
    if (!token) return;
    const abortador = new AbortController();
    const atualizar = () => {
      void request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortador.signal,
        },
      )
        .then((config) => setEficiencia(config.eficienciaPercentual))
        .catch(() => {
          if (!abortador.signal.aborted) setEficiencia(null);
        });
    };
    const intervalo = window.setInterval(atualizar, 30000);
    return () => {
      abortador.abort();
      window.clearInterval(intervalo);
    };
  }, [token]);

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setMensagem("");
    try {
      await acao();
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setOcupado(false);
    }
  }

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await executar(async () => {
      const resultado = await request<{ token: string }>("/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const perfilAtual = await request<UserProfile>("/me", {
        headers: { Authorization: `Bearer ${resultado.token}` },
      });
      const config = await request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        { headers: { Authorization: `Bearer ${resultado.token}` } },
      );
      const machineList = await request<{ machines: Machine[] }>("/maquinas", {
        headers: { Authorization: `Bearer ${resultado.token}` },
      });
      setMachines(machineList.machines);
      setEficiencia(config.eficienciaPercentual);
      setPerfil(perfilAtual);
      setToken(resultado.token);
      const lista = await request<{ relatorios: ReportSummary[] }>(
        "/relatorios",
        {
          headers: { Authorization: `Bearer ${resultado.token}` },
        },
      );
      setRelatorios(lista.relatorios);
      setSenha("");
    });
  }

  async function reloadMachines() {
    const result = await request<{ machines: Machine[] }>("/maquinas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMachines(result.machines);
  }

  async function associateMachine(machineId: string) {
    if (!relatorio || !machineId) return;
    await executar(async () => {
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/maquina`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machineId,
            expectedVersion: relatorio.versao,
          }),
        },
      );
      updateReportState(updated);
      setMensagem("Máquina vinculada ao relatório.");
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
    await executar(async () => {
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
      setRelatorios((current) =>
        current.map((item) =>
          item.id === report.id
            ? { ...item, machineId: null, versao: updated.versao }
            : item,
        ),
      );
      if (relatorio?.id === report.id) setRelatorio(updated);
      setMensagem(
        "Relatório desvinculado. O PDF continua nos relatórios compartilhados.",
      );
    });
  }

  async function abrir(idRelatorio: string, chave = token) {
    const resultado = await request<Report>(
      `/relatorios/${encodeURIComponent(idRelatorio)}`,
      { headers: { Authorization: `Bearer ${chave}` } },
    );
    updateReportState(resultado);
    setWorkspaceSection("reports");
    setBusca("");
    setTela("mapa");
    setPaginaData(0);
    setId(resultado.id);
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
    await executar(async () => {
      await request<void>(`/relatorios/${encodeURIComponent(report.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedVersion: report.versao }),
      });
      setRelatorios((current) =>
        current.filter((item) => item.id !== report.id),
      );
      if (relatorio?.id === report.id) {
        setRelatorio(null);
        setId("");
        setCampoSelecionado(null);
        setTextoSelecionado(null);
      }
      setMensagem("Relatório removido para todos os usuários.");
    });
  }

  function updateReportState(report: Report) {
    setRelatorio(report);
    setRelatorios((current) =>
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

  async function importar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    await executar(async () => {
      const resultado = await request<{ id: string }>("/relatorios/importar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: dados,
      });
      await abrir(resultado.id);
      const lista = await request<{ relatorios: ReportSummary[] }>(
        "/relatorios",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRelatorios(lista.relatorios);
      form.reset();
      setFileInputKey((current) => current + 1);
      setImportMachineId("");
      setMensagem("PDF importado com sucesso.");
    });
  }

  async function alterarConclusao(indice: number, concluida: boolean) {
    if (!relatorio) return;
    await executar(async () => {
      const atualizado = await request<Report>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/linhas/${indice}/conclusao`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ versaoEsperada: relatorio.versao, concluida }),
        },
      );
      updateReportState(atualizado);
      setMensagem(
        concluida ? "Ordem marcada como concluída." : "Ordem reaberta.",
      );
    });
  }

  async function exportar() {
    if (!relatorio) return;
    await executar(async () => {
      const resposta = await fetch(
        `${base}/relatorios/${encodeURIComponent(relatorio.id)}/exportar`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!resposta.ok) {
        const erro: unknown = await resposta.json().catch(() => null);
        throw new Error(
          typeof erro === "object" &&
            erro !== null &&
            "message" in erro &&
            typeof erro.message === "string"
            ? erro.message
            : "Não foi possível exportar o PDF.",
        );
      }
      const url = URL.createObjectURL(await resposta.blob());
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
          <form onSubmit={entrar} className="form-stack">
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
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </label>
            <button disabled={ocupado}>
              {ocupado ? "Entrandoâ€¦" : "Entrar"}
            </button>
          </form>
          {mensagem && (
            <p role="alert" className="notice">
              {mensagem}
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
            {perfil?.papel === "ADMINISTRADOR" && (
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
            <span title={perfil?.email}>{perfil?.email}</span>
            <button
              type="button"
              onClick={() => {
                setToken("");
                setPerfil(null);
                setEficiencia(null);
                setRelatorios([]);
                setMachines([]);
                setRelatorio(null);
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
        {mensagem && workspaceSection !== "reports" && (
          <p role="status" className="notice">
            {mensagem}
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
            key={`${relatorio ? "com-relatorio" : "sem-relatorio"}:${importPanelKey}`}
            className="report-options"
            open={!relatorio}
          >
            <summary>Importar ou abrir PDF</summary>
            <div className="tool-grid">
              {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && (
                <form onSubmit={importar} className="tool-card">
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
                    disabled={ocupado || !importMachineId}
                  />
                  <button disabled={ocupado}>Importar relatório</button>
                </form>
              )}
              <form
                className="tool-card"
                onSubmit={(evento) => {
                  evento.preventDefault();
                  void executar(() => abrir(id));
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
                <button disabled={ocupado} className="secondary">
                  Abrir relatório
                </button>
              </form>
            </div>
            <ReportList
              reports={relatorios}
              machines={machines}
              canEdit={
                perfil?.papel === "ADMINISTRADOR" || !!perfil?.podeEditar
              }
              busy={ocupado}
              onOpen={(reportId) => void executar(() => abrir(reportId))}
              onDelete={(report) => void removeReport(report)}
            />
          </details>
          {mensagem && (
            <p role="status" className="notice">
              {mensagem}
            </p>
          )}
          {relatorio && (
            <section className="document">
              <div className="document-heading">
                <div>
                  <p className="eyebrow">RELATÓRIO DE PRODUÇÃO</p>
                  <h2>{relatorio.conteudo.nome || "Relatório sem nome"}</h2>
                  <p>
                    Versão {relatorio.versao} ·{" "}
                    {relatorio.conteudo.paginas.length} páginas
                  </p>
                  <p>
                    Máquina:{" "}
                    {machines.find(
                      (machine) => machine.id === relatorio.conteudo.machineId,
                    )?.name ?? "Não vinculada"}
                  </p>
                  {(perfil?.papel === "ADMINISTRADOR" ||
                    perfil?.podeEditar) && (
                    <label className="machine-association">
                      Alterar máquina deste relatório
                      <select
                        value={relatorio.conteudo.machineId ?? ""}
                        disabled={ocupado}
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
                    <code>{relatorio.id}</code>
                  </details>
                </div>
                {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && (
                  <div className="document-actions">
                    {relatorio.conteudo.machineId && (
                      <button
                        type="button"
                        className="secondary"
                        disabled={ocupado}
                        onClick={() =>
                          void unlinkReport({
                            id: relatorio.id,
                            nome: relatorio.conteudo.nome,
                            versao: relatorio.versao,
                          })
                        }
                      >
                        Desvincular da máquina
                      </button>
                    )}
                    <button
                      type="button"
                      className="delete-report-button"
                      disabled={ocupado}
                      onClick={() =>
                        void removeReport({
                          id: relatorio.id,
                          nome: relatorio.conteudo.nome,
                          versao: relatorio.versao,
                        })
                      }
                    >
                      Excluir relatório
                    </button>
                  </div>
                )}
                {(perfil?.papel === "ADMINISTRADOR" ||
                  perfil?.podeExportar) && (
                  <button
                    className="secondary"
                    disabled
                    title="Disponível após a implementação do recálculo da serraria"
                    onClick={() => void exportar()}
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
                  className={tela === "mapa" ? "" : "secondary"}
                  aria-current={tela === "mapa" ? "page" : undefined}
                  onClick={() => setTela("mapa")}
                >
                  Mapa de sequenciamento
                </button>
                <button
                  type="button"
                  className={tela === "ordens" ? "" : "secondary"}
                  aria-current={tela === "ordens" ? "page" : undefined}
                  onClick={() => setTela("ordens")}
                >
                  Visualizar ordens
                </button>
                <button
                  type="button"
                  className={tela === "pdf" ? "" : "secondary"}
                  aria-current={tela === "pdf" ? "page" : undefined}
                  onClick={() => setTela("pdf")}
                >
                  Conferir PDF original
                </button>
                {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && (
                  <button
                    type="button"
                    className={tela === "edicao" ? "" : "secondary"}
                    aria-current={tela === "edicao" ? "page" : undefined}
                    onClick={() => setTela("edicao")}
                  >
                    Editar quantidades e tempos
                  </button>
                )}
              </nav>
              {tela === "ordens" && (
                <OrdersSummary
                  linhas={relatorio.conteudo.linhas}
                  busca={busca}
                  aoBuscar={setBusca}
                />
              )}
              {tela === "edicao" &&
                (perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && (
                  <section className="report-section">
                    <LineEditor
                      relatorio={relatorio}
                      token={token}
                      aoSalvar={updateReportState}
                    />
                  </section>
                )}
              {(tela === "mapa" || tela === "pdf") && (
                <div className={tela === "pdf" ? "pdf-comparison" : undefined}>
                  {tela === "pdf" && (
                    <OriginalPdf
                      key={relatorio.id}
                      reportId={relatorio.id}
                      token={token}
                    />
                  )}
                  <section className="report-section report-pages">
                    <SequencingPage
                      eficiencia={eficiencia}
                      paginas={relatorio.conteudo.paginas}
                      linhas={relatorio.conteudo.linhas}
                      paginaData={paginaData}
                      aoMudarPagina={setPaginaData}
                      editavel={
                        perfil?.papel === "ADMINISTRADOR" ||
                        !!perfil?.podeEditar
                      }
                      ocupado={ocupado}
                      aoConcluir={(indice, concluida) =>
                        void alterarConclusao(indice, concluida)
                      }
                      aoSelecionar={(indice, campo) =>
                        setCampoSelecionado({ indice, campo })
                      }
                      aoSelecionarTexto={(referencia, rotulo) =>
                        setTextoSelecionado({ referencia, rotulo })
                      }
                    />
                  </section>
                </div>
              )}
              {campoSelecionado && (
                <FieldEditor
                  relatorio={relatorio}
                  token={token}
                  selecionado={campoSelecionado}
                  aoFechar={() => setCampoSelecionado(null)}
                  aoSalvar={(atualizado) => {
                    updateReportState(atualizado);
                    setCampoSelecionado(null);
                  }}
                />
              )}
              {textoSelecionado && (
                <TextEditor
                  relatorio={relatorio}
                  token={token}
                  selecionado={textoSelecionado}
                  aoFechar={() => setTextoSelecionado(null)}
                  aoSalvar={(atualizado) => {
                    updateReportState(atualizado);
                    setTextoSelecionado(null);
                  }}
                />
              )}
            </section>
          )}
        </div>
        {workspaceSection === "machines" && (
          <MachinesPanel
            token={token}
            machines={machines}
            canEdit={perfil?.papel === "ADMINISTRADOR" || !!perfil?.podeEditar}
            onCreated={reloadMachines}
            onImport={beginMachineImport}
          />
        )}
        {workspaceSection === "dashboard" && (
          <MachinesDashboard
            machines={machines}
            reports={relatorios}
            onOpen={(reportId) => void executar(() => abrir(reportId))}
            canEdit={perfil?.papel === "ADMINISTRADOR" || !!perfil?.podeEditar}
            busy={ocupado}
            onUnlink={(report) => void unlinkReport(report)}
            onImport={beginMachineImport}
          />
        )}
        {workspaceSection === "administration" &&
          perfil?.papel === "ADMINISTRADOR" && (
            <section className="administration-page" aria-label="Administração">
              <p className="eyebrow">CONFIGURAÇÕES</p>
              <h1>Administração</h1>
              <p>
                Gerencie os usuários e a eficiência usada nos sequenciamentos.
              </p>
              <UserManagement token={token} />
              {eficiencia !== null && (
                <CapacityConfigurationForm
                  token={token}
                  eficiencia={eficiencia}
                  aoSalvar={setEficiencia}
                />
              )}
            </section>
          )}
      </section>
    </div>
  );
}
