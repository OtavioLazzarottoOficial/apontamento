import { useState, type FormEvent } from "react";
import type { Report } from "./sequencing-shared.ts";
import { request, formatDuration, parseDuration } from "./sequencing-shared.ts";

export function LineEditor({
  report: currentReport,
  token,
  onSave: handleSave,
}: {
  report: Report;
  token: string;
  onSave: (report: Report) => void;
}) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>, index: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsBusy(true);
    setStatusMessage("");
    try {
      const payload = {
        versaoEsperada: currentReport.versao,
        necessaria: Number(formData.get("necessaria")),
        realizada: Number(formData.get("realizada")),
        tempoUnitarioSegundos: parseDuration(formData.get("unitario")),
        tempoSetupSegundos: parseDuration(formData.get("setup")),
      };
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(currentReport.id)}/linhas/${index}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      handleSave(updated);
      setStatusMessage("Linha salva e resumos recalculados.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a linha.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="editor">
      <h2>Editar quantidades e tempos</h2>
      <p>
        Edite uma linha por vez. Os demais campos ainda estão em
        desenvolvimento.
      </p>
      {statusMessage && (
        <p role="status" className="notice">
          {statusMessage}
        </p>
      )}
      <div className="line-list">
        {currentReport.conteudo.linhas.map((line, index) => (
          <form
            className="line-editor"
            key={`${currentReport.id}-${currentReport.versao}-${index}`}
            onSubmit={(event) => void save(event, index)}
          >
            <div>
              <strong>OP {line.ordem}</strong>
              <p>
                Entrega {line.dataEntrega} · Lote {line.lote}
              </p>
            </div>
            <label>
              Necessária
              <input
                name="necessaria"
                type="number"
                min="0"
                step="1"
                defaultValue={line.necessaria}
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
                defaultValue={line.realizada}
                required
              />
            </label>
            <label>
              Tempo por peça
              <input
                name="unitario"
                defaultValue={formatDuration(line.tempoUnitarioSegundos)}
                required
              />
            </label>
            <label>
              Setup
              <input
                name="setup"
                defaultValue={formatDuration(line.tempoSetupSegundos)}
                required
              />
            </label>
            <div>
              <span>Saldo: {line.saldo}</span>
              <br />
              <span>
                Produção: {formatDuration(line.tempoProducaoSegundos)}
              </span>
            </div>
            <button disabled={isBusy}>Salvar linha</button>
          </form>
        ))}
      </div>
    </section>
  );
}
