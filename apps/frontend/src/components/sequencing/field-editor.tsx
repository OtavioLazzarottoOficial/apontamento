import { useState, type FormEvent } from "react";
import type { Report, EditableField } from "./sequencing-shared.ts";
import {
  request,
  formatDuration,
  parseDuration,
  fieldLabels,
} from "./sequencing-shared.ts";

export function FieldEditor({
  report: currentReport,
  token,
  selected: selection,
  onClose: handleClose,
  onSave: handleSave,
}: {
  report: Report;
  token: string;
  selected: { index: number; field: EditableField };
  onClose: () => void;
  onSave: (report: Report) => void;
}) {
  const line = currentReport.conteudo.linhas[selection.index];
  const field = selection.field;
  const duration = field === "tempoUnitario" || field === "tempoSetup";
  const dimension = field === "dimensoes";
  const dimensionReference = line.camposTexto.dimensoes.find((ref) => {
    const text = currentReport.conteudo.paginas.find(
      (page) => page.numero === ref.pagina,
    )?.trechos[ref.indice]?.texto;
    return text && /^\d/.test(text);
  });
  const dimensionText = dimensionReference
    ? currentReport.conteudo.paginas.find(
        (page) => page.numero === dimensionReference.pagina,
      )?.trechos[dimensionReference.indice]?.texto
    : "";
  const numbers = {
    necessaria: line.necessaria,
    realizada: line.realizada,
    pendente: line.pendente,
    anterior: line.anterior,
    pecasPorCiclo: line.pecasPorCiclo,
  };
  const initial = dimension
    ? (dimensionText ?? "")
    : duration
      ? formatDuration(
          field === "tempoUnitario"
            ? line.tempoUnitarioSegundos
            : line.tempoSetupSegundos,
        )
      : String(numbers[field as keyof typeof numbers]);
  const [inputValue, setInputValue] = useState(initial);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsBusy(true);
    try {
      const number = duration
        ? parseDuration(inputValue)
        : dimension
          ? 0
          : Number(inputValue);
      const payload = {
        versaoEsperada: currentReport.versao,
        necessaria: field === "necessaria" ? number : line.necessaria,
        realizada: field === "realizada" ? number : line.realizada,
        tempoUnitarioSegundos:
          field === "tempoUnitario" ? number : line.tempoUnitarioSegundos,
        tempoSetupSegundos:
          field === "tempoSetup" ? number : line.tempoSetupSegundos,
        dimensoes: dimension ? inputValue : undefined,
        pendente: field === "pendente" ? number : undefined,
        anterior: field === "anterior" ? number : undefined,
        pecasPorCiclo: field === "pecasPorCiclo" ? number : undefined,
      };
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(currentReport.id)}/linhas/${selection.index}`,
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
    } catch (causa) {
      setErrorMessage(
        causa instanceof Error ? causa.message : "Não foi possível salvar.",
      );
    } finally {
      setIsBusy(false);
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
        <h2 id="titulo-campo">{fieldLabels[field]}</h2>
        <p>
          OP {line.ordem}
          {duration ? " · use horas:minutos:segundos" : ""}
          {dimension ? " · use comprimento x largura x espessura, em mm" : ""}
        </p>
        <form className="form-stack" onSubmit={save}>
          <label>
            Valor
            <input
              autoFocus
              type={duration || dimension ? "text" : "number"}
              min={duration || dimension ? undefined : 0}
              step={duration || dimension ? undefined : 1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              required
            />
          </label>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <div className="modal-acoes">
            <button type="button" className="secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button disabled={isBusy}>Salvar</button>
          </div>
        </form>
      </section>
    </div>
  );
}
