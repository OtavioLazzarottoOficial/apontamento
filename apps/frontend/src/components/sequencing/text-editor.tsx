import { useState, type FormEvent } from "react";
import type { Report, FieldReference } from "./sequencing-shared.ts";
import { request } from "./sequencing-shared.ts";

export function TextEditor({
  report: currentReport,
  token,
  selected: selection,
  onClose: handleClose,
  onSave: handleSave,
}: {
  report: Report;
  token: string;
  selected: { reference: FieldReference; label: string };
  onClose: () => void;
  onSave: (report: Report) => void;
}) {
  const fragment = currentReport.conteudo.paginas.find(
    (page) => page.numero === selection.reference.pagina,
  )?.trechos[selection.reference.indice];
  const [inputValue, setInputValue] = useState(fragment?.texto ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsBusy(true);
    try {
      const updated = await request<Report>(
        `/relatorios/${encodeURIComponent(currentReport.id)}/texto`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versaoEsperada: currentReport.versao,
            ...selection.reference,
            texto: inputValue,
          }),
        },
      );
      handleSave(updated);
    } catch (causa) {
      setErrorMessage(
        causa instanceof Error
          ? causa.message
          : "Não foi possível salvar o texto.",
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
        aria-labelledby="titulo-texto"
        className="modal-campo"
      >
        <h2 id="titulo-texto">{selection.label}</h2>
        <form className="form-stack" onSubmit={save}>
          <label>
            Texto
            <input
              autoFocus
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              maxLength={150}
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
