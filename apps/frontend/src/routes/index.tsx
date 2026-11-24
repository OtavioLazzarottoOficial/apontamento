import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({ component: Home });

type Relatorio = {
  id: string;
  versao: number;
  conteudo: {
    nome: string;
    paginas: Pagina[];
    linhas: Linha[];
    resumos?: {
      total: {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      };
    };
  };
};
type Pagina = {
  numero: number;
  largura: number;
  altura: number;
  trechos: {
    texto: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
  }[];
};
type Linha = {
  concluida?: boolean;
  ordem: string;
  dataEntrega: string;
  programacao: string;
  lote: string;
  area: number;
  pendente: number;
  anterior: number;
  pecasPorCiclo: number;
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoUnitarioSegundos: number;
  tempoSetupSegundos: number;
  tempoProducaoSegundos: number;
  campos: {
    pendente: Referencia;
    anterior: Referencia;
    pecasPorCiclo: Referencia;
    necessaria: Referencia;
    realizada: Referencia;
    tempoUnitario: Referencia;
    tempoSetup: Referencia;
  };
  camposTexto: {
    ordem: Referencia[];
    produto: Referencia[];
    componente: Referencia[];
    dimensoes: Referencia[];
  };
};
type Referencia = { pagina: number; indice: number };
type CampoEditavel =
  | "necessaria"
  | "realizada"
  | "tempoUnitario"
  | "tempoSetup"
  | "dimensoes"
  | "pendente"
  | "anterior"
  | "pecasPorCiclo";
type Perfil = {
  email: string;
  papel: "ADMINISTRADOR" | "USUARIO";
  podeEditar: boolean;
  podeExportar: boolean;
};
type Resumo = { id: string; nome: string; versao: number };
const base = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function requisicao<T>(path: string, init: RequestInit): Promise<T> {
  const resposta = await fetch(`${base}${path}`, init);
  if (!resposta.ok) {
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem =
      typeof erro === "object" &&
      erro !== null &&
      "message" in erro &&
      typeof erro.message === "string"
        ? erro.message
        : `Erro de comunicação (${resposta.status}).`;
    throw new Error(mensagem);
  }
  return resposta.json() as Promise<T>;
}

function Home() {
  const [token, setToken] = useState("");
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [relatorios, setRelatorios] = useState<Resumo[]>([]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [id, setId] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [busca, setBusca] = useState("");
  const [tela, setTela] = useState<"mapa" | "ordens" | "edicao">("mapa");
  const [paginaData, setPaginaData] = useState(0);
  const [campoSelecionado, setCampoSelecionado] = useState<{
    indice: number;
    campo: CampoEditavel;
  } | null>(null);
  const [textoSelecionado, setTextoSelecionado] = useState<{
    referencia: Referencia;
    rotulo: string;
  } | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

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
      const resultado = await requisicao<{ token: string }>("/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const perfilAtual = await requisicao<Perfil>("/me", {
        headers: { Authorization: `Bearer ${resultado.token}` },
      });
      setPerfil(perfilAtual);
      setToken(resultado.token);
      const lista = await requisicao<{ relatorios: Resumo[] }>("/relatorios", {
        headers: { Authorization: `Bearer ${resultado.token}` },
      });
      setRelatorios(lista.relatorios);
      setSenha("");
    });
  }

  async function abrir(idRelatorio: string, chave = token) {
    const resultado = await requisicao<Relatorio>(
      `/relatorios/${encodeURIComponent(idRelatorio)}`,
      { headers: { Authorization: `Bearer ${chave}` } },
    );
    setRelatorio(resultado);
    setBusca("");
    setTela("mapa");
    setPaginaData(0);
    setId(resultado.id);
  }

  async function importar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    await executar(async () => {
      const resultado = await requisicao<{ id: string }>(
        "/relatorios/importar",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: dados,
        },
      );
      await abrir(resultado.id);
      const lista = await requisicao<{ relatorios: Resumo[] }>("/relatorios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRelatorios(lista.relatorios);
      form.reset();
      setMensagem("PDF importado com sucesso.");
    });
  }

  async function alterarConclusao(indice: number, concluida: boolean) {
    if (!relatorio) return;
    await executar(async () => {
      const atualizado = await requisicao<Relatorio>(`/relatorios/${encodeURIComponent(relatorio.id)}/linhas/${indice}/conclusao`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ versaoEsperada: relatorio.versao, concluida }),
      });
      setRelatorio(atualizado);
      setMensagem(concluida ? "Ordem marcada como concluída." : "Ordem reaberta.");
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
      <section className="login-panel">
        <p className="eyebrow">APONTAMENTO · PRODUÇÃO</p>
        <h1>Mapas de sequenciamento</h1>
        <p>Entre para acessar e importar relatórios de produção.</p>
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
          <button disabled={ocupado}>{ocupado ? "Entrando…" : "Entrar"}</button>
        </form>
        {mensagem && (
          <p role="alert" className="notice">
            {mensagem}
          </p>
        )}
      </section>
    );

  return (
    <section className="workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">APONTAMENTO · PRODUÇÃO</p>
          <h1>Mapas de sequenciamento</h1>
          <p>Importe um PDF ou abra um relatório pelo identificador.</p>
        </div>
        <button
          className="secondary"
          onClick={() => {
            setToken("");
            setPerfil(null);
            setRelatorios([]);
            setRelatorio(null);
            setId("");
          }}
        >
          Sair
        </button>
      </div>
      <details key={relatorio ? "com-relatorio" : "sem-relatorio"} className="report-options" open={!relatorio}><summary>Importar ou abrir PDF</summary>
      <div className="tool-grid">
        {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && (
          <form onSubmit={importar} className="tool-card">
            <h2>Importar PDF</h2>
            <p>Selecione um relatório com texto selecionável.</p>
            <label>
              Arquivo PDF
              <input
                name="arquivo"
                type="file"
                accept="application/pdf,.pdf"
                required
              />
            </label>
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
      <section className="tool-card" aria-label="Relatórios compartilhados">
        <h2>Relatórios compartilhados</h2>
        {relatorios.length === 0 ? (
          <p>Nenhum relatório disponível.</p>
        ) : (
          <ul className="report-list">
            {relatorios.map((item) => (
              <li key={item.id}>
                <button
                  className="report-link"
                  disabled={ocupado}
                  onClick={() => void executar(() => abrir(item.id))}
                >
                  {item.nome || "Relatório sem nome"}
                </button>
                <span>Versão {item.versao}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </details>
      {perfil?.papel === "ADMINISTRADOR" && !relatorio && <CadastroUsuario token={token} />}
      {mensagem && (
        <p role="status" className="notice">
          {mensagem}
        </p>
      )}
      {relatorio && (
        <section className="document">
          <div className="document-heading">
            <div><p className="eyebrow">RELATÓRIO DE PRODUÇÃO</p><h2>{relatorio.conteudo.nome || "Relatório sem nome"}</h2><p>Versão {relatorio.versao} · {relatorio.conteudo.paginas.length} páginas</p><details className="report-id"><summary>Identificador do relatório</summary><code>{relatorio.id}</code></details></div>
            {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeExportar) && <button className="secondary" disabled title="Disponível após a implementação do recálculo da serraria" onClick={() => void exportar()}>Exportar PDF</button>}
          </div>
          <nav className="report-nav" aria-label="Visualizações do relatório">
            <button type="button" className={tela === "mapa" ? "" : "secondary"} aria-current={tela === "mapa" ? "page" : undefined} onClick={() => setTela("mapa")}>Mapa de sequenciamento</button>
            <button type="button" className={tela === "ordens" ? "" : "secondary"} aria-current={tela === "ordens" ? "page" : undefined} onClick={() => setTela("ordens")}>Visualizar ordens</button>
            {(perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && <button type="button" className={tela === "edicao" ? "" : "secondary"} aria-current={tela === "edicao" ? "page" : undefined} onClick={() => setTela("edicao")}>Editar quantidades e tempos</button>}
          </nav>
          {tela === "ordens" && <ResumoOrdens linhas={relatorio.conteudo.linhas} busca={busca} aoBuscar={setBusca} />}
          {tela === "edicao" && (perfil?.papel === "ADMINISTRADOR" || perfil?.podeEditar) && <section className="report-section"><EdicaoLinhas relatorio={relatorio} token={token} aoSalvar={setRelatorio} /></section>}
          {tela === "mapa" && <section className="report-section report-pages"><PaginaReconstruida paginas={relatorio.conteudo.paginas} linhas={relatorio.conteudo.linhas} paginaData={paginaData} aoMudarPagina={setPaginaData} editavel={perfil?.papel === "ADMINISTRADOR" || !!perfil?.podeEditar} ocupado={ocupado} aoConcluir={(indice, concluida) => void alterarConclusao(indice, concluida)} aoSelecionar={(indice, campo) => setCampoSelecionado({ indice, campo })} aoSelecionarTexto={(referencia, rotulo) => setTextoSelecionado({ referencia, rotulo })} /></section>}
          {campoSelecionado && (
            <EditorCampo
              relatorio={relatorio}
              token={token}
              selecionado={campoSelecionado}
              aoFechar={() => setCampoSelecionado(null)}
              aoSalvar={(atualizado) => {
                setRelatorio(atualizado);
                setCampoSelecionado(null);
              }}
            />
          )}
          {textoSelecionado && (
            <EditorTexto
              relatorio={relatorio}
              token={token}
              selecionado={textoSelecionado}
              aoFechar={() => setTextoSelecionado(null)}
              aoSalvar={(atualizado) => {
                setRelatorio(atualizado);
                setTextoSelecionado(null);
              }}
            />
          )}
        </section>
      )}
    </section>
  );
}

function ResumoOrdens({ linhas, busca, aoBuscar }: { linhas: Linha[]; busca: string; aoBuscar: (valor: string) => void }) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const filtradas = linhas.filter((linha) => [linha.ordem, linha.lote, linha.dataEntrega, linha.programacao].some((valor) => String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo)));
  return <section className="report-section">
    <div className="section-heading"><div><h3>Ordens de produção</h3><p>Consulte as quantidades e os prazos identificados no PDF.</p></div><label className="report-search">Buscar ordem, lote ou entrega<input type="search" value={busca} onChange={(evento) => aoBuscar(evento.target.value)} placeholder="Ex.: número da OP" /></label></div>
    <div className="table-scroll"><table className="report-table"><thead><tr><th>Ordem</th><th>Entrega</th><th>Lote</th><th>Programação</th><th>Necessária</th><th>Realizada</th><th>Saldo</th><th>Produção</th></tr></thead><tbody>
      {filtradas.map((linha, indice) => <tr key={indice}><th scope="row">{linha.ordem || "—"}</th><td>{linha.dataEntrega || "—"}</td><td>{linha.lote || "—"}</td><td>{linha.programacao || "—"}</td><td>{linha.necessaria.toLocaleString("pt-BR")}</td><td>{linha.realizada.toLocaleString("pt-BR")}</td><td>{linha.saldo.toLocaleString("pt-BR")}</td><td>{formatarDuracao(linha.tempoProducaoSegundos)}</td></tr>)}
    </tbody></table>{filtradas.length === 0 && <p className="table-empty">{linhas.length ? "Nenhuma ordem encontrada para esta busca." : "Nenhuma ordem identificada neste relatório."}</p>}</div>
  </section>;
}

function CadastroUsuario({ token }: { token: string }) {
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [usuarios, setUsuarios] = useState<(Perfil & { id: string })[]>([]);

  useEffect(() => {
    const abortador = new AbortController();
    void requisicao<{ usuarios: (Perfil & { id: string })[] }>("/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
      signal: abortador.signal,
    })
      .then((resultado) => setUsuarios(resultado.usuarios))
      .catch(() => {
        if (!abortador.signal.aborted)
          setMensagem("Não foi possível carregar os usuários.");
      });
    return () => abortador.abort();
  }, [token]);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    setOcupado(true);
    setMensagem("");
    try {
      const usuario = await requisicao<Perfil & { id: string }>("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: dados.get("email"),
          senha: dados.get("senha"),
          podeEditar: dados.has("podeEditar"),
          podeExportar: dados.has("podeExportar"),
        }),
      });
      setUsuarios((atuais) => [...atuais, usuario]);
      form.reset();
      setMensagem("Usuário cadastrado.");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar o usuário.",
      );
    } finally {
      setOcupado(false);
    }
  }

  async function salvarPermissoes(
    evento: FormEvent<HTMLFormElement>,
    id: string,
  ) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setOcupado(true);
    setMensagem("");
    try {
      const usuario = await requisicao<Perfil & { id: string }>(
        `/usuarios/${encodeURIComponent(id)}/permissoes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            podeEditar: dados.has("podeEditar"),
            podeExportar: dados.has("podeExportar"),
          }),
        },
      );
      setUsuarios((atuais) =>
        atuais.map((atual) => (atual.id === usuario.id ? usuario : atual)),
      );
      setMensagem("Permissões atualizadas.");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atualizar as permissões.",
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <details className="tool-card">
      <summary>Administrar usuários</summary>
      <form className="form-stack" onSubmit={cadastrar}>
        <label>
          E-mail
          <input name="email" type="email" required />
        </label>
        <label>
          Senha inicial
          <input
            name="senha"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="check">
          <input type="checkbox" name="podeEditar" />
          Pode editar e importar relatórios
        </label>
        <label className="check">
          <input type="checkbox" name="podeExportar" />
          Pode exportar relatórios
        </label>
        <button disabled={ocupado}>Cadastrar usuário</button>
        {mensagem && <p role="status">{mensagem}</p>}
      </form>
      {usuarios
        .filter((usuario) => usuario.papel === "USUARIO")
        .map((usuario) => (
          <form
            className="user-permissions"
            key={usuario.id}
            onSubmit={(evento) => void salvarPermissoes(evento, usuario.id)}
          >
            <strong>{usuario.email}</strong>
            <label className="check">
              <input
                name="podeEditar"
                type="checkbox"
                defaultChecked={usuario.podeEditar}
              />
              Editar
            </label>
            <label className="check">
              <input
                name="podeExportar"
                type="checkbox"
                defaultChecked={usuario.podeExportar}
              />
              Exportar
            </label>
            <button className="secondary" disabled={ocupado}>
              Salvar permissões
            </button>
          </form>
        ))}
    </details>
  );
}

function formatarDuracao(total: number) {
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

function lerDuracao(valor: FormDataEntryValue | null) {
  const partes = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(String(valor));
  if (!partes)
    throw new Error(
      "Informe os tempos no formato horas:minutos:segundos, por exemplo 00:01:30.",
    );
  return Number(partes[1]) * 3600 + Number(partes[2]) * 60 + Number(partes[3]);
}

function EdicaoLinhas({
  relatorio,
  token,
  aoSalvar,
}: {
  relatorio: Relatorio;
  token: string;
  aoSalvar: (relatorio: Relatorio) => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>, indice: number) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setOcupado(true);
    setMensagem("");
    try {
      const corpo = {
        versaoEsperada: relatorio.versao,
        necessaria: Number(dados.get("necessaria")),
        realizada: Number(dados.get("realizada")),
        tempoUnitarioSegundos: lerDuracao(dados.get("unitario")),
        tempoSetupSegundos: lerDuracao(dados.get("setup")),
      };
      const atualizado = await requisicao<Relatorio>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/linhas/${indice}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(corpo),
        },
      );
      aoSalvar(atualizado);
      setMensagem("Linha salva e resumos recalculados.");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a linha.",
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="editor">
      <h2>Editar quantidades e tempos</h2>
      <p>
        Edite uma linha por vez. Os demais campos ainda estão em
        desenvolvimento.
      </p>
      {mensagem && (
        <p role="status" className="notice">
          {mensagem}
        </p>
      )}
      <div className="line-list">
        {relatorio.conteudo.linhas.map((linha, indice) => (
          <form
            className="line-editor"
            key={`${relatorio.id}-${relatorio.versao}-${indice}`}
            onSubmit={(evento) => void salvar(evento, indice)}
          >
            <div>
              <strong>OP {linha.ordem}</strong>
              <p>
                Entrega {linha.dataEntrega} · Lote {linha.lote}
              </p>
            </div>
            <label>
              Necessária
              <input
                name="necessaria"
                type="number"
                min="0"
                step="1"
                defaultValue={linha.necessaria}
                required
              />
            </label>
            <label>
              Realizada
              <input
                name="realizada"
                type="number"
                min="0"
                step="1"
                defaultValue={linha.realizada}
                required
              />
            </label>
            <label>
              Tempo por peça
              <input
                name="unitario"
                defaultValue={formatarDuracao(linha.tempoUnitarioSegundos)}
                required
              />
            </label>
            <label>
              Setup
              <input
                name="setup"
                defaultValue={formatarDuracao(linha.tempoSetupSegundos)}
                required
              />
            </label>
            <div>
              <span>Saldo: {linha.saldo}</span>
              <br />
              <span>
                Produção: {formatarDuracao(linha.tempoProducaoSegundos)}
              </span>
            </div>
            <button disabled={ocupado}>Salvar linha</button>
          </form>
        ))}
      </div>
    </section>
  );
}

const rotulosCampo: Record<CampoEditavel, string> = {
  pendente: "Quantidade pendente",
  anterior: "Atividade anterior",
  pecasPorCiclo: "Peças por ciclo",
  necessaria: "Quantidade necessária",
  realizada: "Quantidade realizada",
  tempoUnitario: "Tempo por peça",
  tempoSetup: "Tempo de setup",
  dimensoes: "Dimensões",
};

function PaginaReconstruida({ paginas, linhas, paginaData, aoMudarPagina, editavel, ocupado, aoConcluir, aoSelecionar, aoSelecionarTexto }: { paginas: Pagina[]; linhas: Linha[]; paginaData: number; aoMudarPagina: (indice: number) => void; editavel: boolean; ocupado: boolean; aoConcluir: (indice: number, concluida: boolean) => void; aoSelecionar: (indice: number, campo: CampoEditavel) => void; aoSelecionarTexto: (referencia: Referencia, rotulo: string) => void }) {
  const grupos = new Map<string, { linha: Linha; indice: number }[]>();
  linhas.forEach((linha, indice) => { const grupo = grupos.get(linha.dataEntrega) ?? []; grupo.push({ linha, indice }); grupos.set(linha.dataEntrega, grupo); });
  const datas = Array.from(grupos.keys());
  const data = datas[paginaData];
  const grupo = grupos.get(data) ?? [];
  const somar = (campo: "necessaria" | "realizada" | "saldo" | "pendente" | "anterior" | "pecasPorCiclo" | "area" | "tempoProducaoSegundos") => grupo.reduce((total, item) => total + item.linha[campo], 0);
  const numero = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const trecho = (ref: Referencia) => paginas.find((pagina) => pagina.numero === ref.pagina)?.trechos[ref.indice];
  const texto = (refs: Referencia[]) => refs.map((ref) => trecho(ref)?.texto ?? "").join(" ").trim();
  const textoEditavel = (refs: Referencia[], rotulo: string) => refs.filter((ref) => trecho(ref)).map((ref) => editavel ? <button type="button" className="mapa-campo" key={`${ref.pagina}-${ref.indice}`} onClick={() => aoSelecionarTexto(ref, rotulo)} aria-label={`Editar ${rotulo}`}>{trecho(ref)?.texto} </button> : <span key={`${ref.pagina}-${ref.indice}`}>{trecho(ref)?.texto} </span>);
  const campo = (valor: string | number, indice: number, nome: CampoEditavel) => editavel ? <button type="button" className="mapa-campo" onClick={() => aoSelecionar(indice, nome)} aria-label={`Editar ${rotulosCampo[nome]} da OP ${linhas[indice].ordem}`}>{valor}</button> : valor;
  return <article className="mapa-pagina" aria-label="Mapa de sequenciamento">
    <div className="mapa-topo"><div><h3>Mapa de sequenciamento</h3><p>{paginas.flatMap((pagina) => pagina.trechos).find((t) => /Referente ao período/i.test(t.texto))?.texto ?? ""}</p></div></div>
    {datas.length > 0 ? <>
      <div className="mapa-paginacao"><button type="button" className="secondary" disabled={paginaData === 0} onClick={() => aoMudarPagina(paginaData - 1)}>← Dia anterior</button><div><span>Página {paginaData + 1} de {datas.length}</span><strong>Entrega {data}</strong></div><button type="button" className="secondary" disabled={paginaData >= datas.length - 1} onClick={() => aoMudarPagina(paginaData + 1)}>Próximo dia →</button></div>
      <div className="mapa-total" aria-label="Totais da data"><div><span>Ordens</span><strong>{grupo.length}</strong></div><div><span>Peças necessárias</span><strong>{numero(somar("necessaria"))}</strong></div><div><span>Peças realizadas</span><strong>{numero(somar("realizada"))}</strong></div><div><span>Saldo de peças</span><strong>{numero(somar("saldo"))}</strong></div><div><span>Tempo total de produção</span><strong>{formatarDuracao(somar("tempoProducaoSegundos"))}</strong></div></div>
      <p className="mapa-instrucao">{editavel ? "Selecione um valor sublinhado para editar. Marcar uma ordem como concluída não altera os totais." : "Os totais incluem todas as ordens, inclusive as concluídas."}</p>
      <div className="mapa-cartoes">{grupo.map(({linha, indice}) => <section key={indice} className={`mapa-ordem ${linha.concluida ? "mapa-ordem-concluida" : ""}`}>
        <div className="mapa-ordem-cabecalho"><div><span>ORDEM DE PRODUÇÃO</span><strong>OP {textoEditavel(linha.camposTexto.ordem, `ordem de produção ${linha.ordem}`)}</strong></div><div className="mapa-estado">{linha.concluida && <span>Concluída</span>}{editavel && <button type="button" className="mapa-status-botao" disabled={ocupado} onClick={() => aoConcluir(indice, !linha.concluida)} aria-label={`${linha.concluida ? "Reabrir" : "Concluir"} OP ${linha.ordem}`}>{linha.concluida ? "Reabrir" : "Concluir"}</button>}</div></div>
        <div className="mapa-ordem-conteudo"><div className="mapa-identificacao"><div><span>Produto</span><strong>{textoEditavel(linha.camposTexto.produto, `produto da OP ${linha.ordem}`)}</strong></div><div><span>Componente</span><strong>{textoEditavel(linha.camposTexto.componente, `componente da OP ${linha.ordem}`)}</strong></div><div><span>Programação / Lote</span><strong>{linha.programacao} · {linha.lote}</strong></div><div><span>Dimensões</span><strong>{campo(texto(linha.camposTexto.dimensoes) || "—", indice, "dimensoes")}</strong></div></div>
        <dl className="mapa-dados"><div><dt>Área m²</dt><dd>{numero(linha.area)}</dd></div><div><dt>Qtd. pendente</dt><dd>{campo(numero(linha.pendente), indice, "pendente")}</dd></div><div><dt>Atv. anterior</dt><dd>{campo(numero(linha.anterior), indice, "anterior")}</dd></div><div><dt>Necessária</dt><dd>{campo(numero(linha.necessaria), indice, "necessaria")}</dd></div><div><dt>Realizada</dt><dd>{campo(numero(linha.realizada), indice, "realizada")}</dd></div><div><dt>Saldo</dt><dd>{numero(linha.saldo)}</dd></div><div><dt>Peças / ciclo</dt><dd>{campo(numero(linha.pecasPorCiclo), indice, "pecasPorCiclo")}</dd></div><div><dt>Tempo de setup</dt><dd>{campo(formatarDuracao(linha.tempoSetupSegundos), indice, "tempoSetup")}</dd></div><div><dt>Tempo por peça</dt><dd>{campo(formatarDuracao(linha.tempoUnitarioSegundos), indice, "tempoUnitario")}</dd></div><div><dt>Tempo de produção</dt><dd>{formatarDuracao(linha.tempoProducaoSegundos)}</dd></div></dl></div>
      </section>)}</div>
    </> : <p>Não há ordens reconhecidas neste relatório.</p>}
  </article>;
}

function EditorCampo({
  relatorio,
  token,
  selecionado,
  aoFechar,
  aoSalvar,
}: {
  relatorio: Relatorio;
  token: string;
  selecionado: { indice: number; campo: CampoEditavel };
  aoFechar: () => void;
  aoSalvar: (relatorio: Relatorio) => void;
}) {
  const linha = relatorio.conteudo.linhas[selecionado.indice];
  const campo = selecionado.campo;
  const duracao = campo === "tempoUnitario" || campo === "tempoSetup";
  const dimensao = campo === "dimensoes";
  const refDimensao = linha.camposTexto.dimensoes.find((ref) => {
    const texto = relatorio.conteudo.paginas.find(
      (pagina) => pagina.numero === ref.pagina,
    )?.trechos[ref.indice]?.texto;
    return texto && /^\d/.test(texto);
  });
  const textoDimensao = refDimensao
    ? relatorio.conteudo.paginas.find(
        (pagina) => pagina.numero === refDimensao.pagina,
      )?.trechos[refDimensao.indice]?.texto
    : "";
  const numeros = {
    necessaria: linha.necessaria,
    realizada: linha.realizada,
    pendente: linha.pendente,
    anterior: linha.anterior,
    pecasPorCiclo: linha.pecasPorCiclo,
  };
  const inicial = dimensao
    ? (textoDimensao ?? "")
    : duracao
      ? formatarDuracao(
          campo === "tempoUnitario"
            ? linha.tempoUnitarioSegundos
            : linha.tempoSetupSegundos,
        )
      : String(numeros[campo as keyof typeof numeros]);
  const [valor, setValor] = useState(inicial);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const numero = duracao ? lerDuracao(valor) : dimensao ? 0 : Number(valor);
      const corpo = {
        versaoEsperada: relatorio.versao,
        necessaria: campo === "necessaria" ? numero : linha.necessaria,
        realizada: campo === "realizada" ? numero : linha.realizada,
        tempoUnitarioSegundos:
          campo === "tempoUnitario" ? numero : linha.tempoUnitarioSegundos,
        tempoSetupSegundos:
          campo === "tempoSetup" ? numero : linha.tempoSetupSegundos,
        dimensoes: dimensao ? valor : undefined,
        pendente: campo === "pendente" ? numero : undefined,
        anterior: campo === "anterior" ? numero : undefined,
        pecasPorCiclo: campo === "pecasPorCiclo" ? numero : undefined,
      };
      const atualizado = await requisicao<Relatorio>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/linhas/${selecionado.indice}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(corpo),
        },
      );
      aoSalvar(atualizado);
    } catch (causa) {
      setErro(
        causa instanceof Error ? causa.message : "Não foi possível salvar.",
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="modal-fundo">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-campo"
        className="modal-campo"
      >
        <h2 id="titulo-campo">{rotulosCampo[campo]}</h2>
        <p>
          OP {linha.ordem}
          {duracao ? " · use horas:minutos:segundos" : ""}
          {dimensao ? " · use comprimento x largura x espessura, em mm" : ""}
        </p>
        <form className="form-stack" onSubmit={salvar}>
          <label>
            Valor
            <input
              autoFocus
              type={duracao || dimensao ? "text" : "number"}
              min={duracao || dimensao ? undefined : 0}
              step={duracao || dimensao ? undefined : 1}
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              required
            />
          </label>
          {erro && <p role="alert">{erro}</p>}
          <div className="modal-acoes">
            <button type="button" className="secondary" onClick={aoFechar}>
              Cancelar
            </button>
            <button disabled={ocupado}>Salvar</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EditorTexto({
  relatorio,
  token,
  selecionado,
  aoFechar,
  aoSalvar,
}: {
  relatorio: Relatorio;
  token: string;
  selecionado: { referencia: Referencia; rotulo: string };
  aoFechar: () => void;
  aoSalvar: (relatorio: Relatorio) => void;
}) {
  const trecho = relatorio.conteudo.paginas.find(
    (pagina) => pagina.numero === selecionado.referencia.pagina,
  )?.trechos[selecionado.referencia.indice];
  const [valor, setValor] = useState(trecho?.texto ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const atualizado = await requisicao<Relatorio>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/texto`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versaoEsperada: relatorio.versao,
            ...selecionado.referencia,
            texto: valor,
          }),
        },
      );
      aoSalvar(atualizado);
    } catch (causa) {
      setErro(
        causa instanceof Error
          ? causa.message
          : "Não foi possível salvar o texto.",
      );
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="modal-fundo">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-texto"
        className="modal-campo"
      >
        <h2 id="titulo-texto">{selecionado.rotulo}</h2>
        <form className="form-stack" onSubmit={salvar}>
          <label>
            Texto
            <input
              autoFocus
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              maxLength={150}
              required
            />
          </label>
          {erro && <p role="alert">{erro}</p>}
          <div className="modal-acoes">
            <button type="button" className="secondary" onClick={aoFechar}>
              Cancelar
            </button>
            <button disabled={ocupado}>Salvar</button>
          </div>
        </form>
      </section>
    </div>
  );
}
