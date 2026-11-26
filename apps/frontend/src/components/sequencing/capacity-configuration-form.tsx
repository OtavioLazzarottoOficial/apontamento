import { useState, type FormEvent } from "react";
import { request } from "./sequencing-shared.ts";

export function CapacityConfigurationForm({
  token,
  efficiency: efficiencyValue,
  onSave: handleSave,
}: {
  token: string;
  efficiency: number;
  onSave: (value: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(efficiencyValue));
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatusMessage("");
    try {
      const result = await request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eficienciaPercentual: Number(inputValue) }),
        },
      );
      handleSave(result.eficienciaPercentual);
      setStatusMessage("Eficiência global atualizada.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a configuração.",
      );
    } finally {
      setIsBusy(false);
    }
  }
  return (
    <details className="tool-card">
      <summary>Configurar eficiência da máquina</summary>
      <form className="form-stack" onSubmit={save}>
        <p>
          O percentual é global e afeta todos os relatórios, inclusive os
          existentes. A jornada base é de 8h48.
        </p>
        <label>
          Eficiência (%)
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            required
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </label>
        <button disabled={isBusy}>Salvar eficiência</button>
        {statusMessage && <p role="status">{statusMessage}</p>}
      </form>
    </details>
  );
}
