import { useState, type FormEvent } from "react";
import type { Report } from "./sequencing-shared.ts";
import { request, formatDuration, parseDuration } from "./sequencing-shared.ts";

export function LineEditor({
  relatorio,
  token,
  aoSalvar,
}: {
  relatorio: Report;
  token: string;
  aoSalvar: (relatorio: Report) => void;
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
        tempoUnitarioSegundos: parseDuration(dados.get("unitario")),
        tempoSetupSegundos: parseDuration(dados.get("setup")),
      };
      const atualizado = await request<Report>(
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
                defaultValue={formatDuration(linha.tempoUnitarioSegundos)}
                required
              />
            </label>
            <label>
              Setup
              <input
                name="setup"
                defaultValue={formatDuration(linha.tempoSetupSegundos)}
                required
              />
            </label>
            <div>
              <span>Saldo: {linha.saldo}</span>
              <br />
              <span>
                Produção: {formatDuration(linha.tempoProducaoSegundos)}
              </span>
            </div>
            <button disabled={ocupado}>Salvar linha</button>
          </form>
        ))}
      </div>
    </section>
  );
}
