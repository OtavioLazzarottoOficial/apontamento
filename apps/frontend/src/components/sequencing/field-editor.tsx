import { useState, type FormEvent } from "react";
import type { Report, EditableField } from "./sequencing-shared.ts";
import {
  request,
  formatDuration,
  parseDuration,
  fieldLabels,
} from "./sequencing-shared.ts";

export function FieldEditor({
  relatorio,
  token,
  selecionado,
  aoFechar,
  aoSalvar,
}: {
  relatorio: Report;
  token: string;
  selecionado: { indice: number; campo: EditableField };
  aoFechar: () => void;
  aoSalvar: (relatorio: Report) => void;
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
      ? formatDuration(
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
      const numero = duracao
        ? parseDuration(valor)
        : dimensao
          ? 0
          : Number(valor);
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
      const atualizado = await request<Report>(
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
        <h2 id="titulo-campo">{fieldLabels[campo]}</h2>
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
