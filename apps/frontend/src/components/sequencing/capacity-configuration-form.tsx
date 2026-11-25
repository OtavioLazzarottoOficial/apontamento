import { useState, type FormEvent } from "react";
import { request } from "./sequencing-shared.ts";

export function CapacityConfigurationForm({
  token,
  eficiencia,
  aoSalvar,
}: {
  token: string;
  eficiencia: number;
  aoSalvar: (valor: number) => void;
}) {
  const [valor, setValor] = useState(String(eficiencia));
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setOcupado(true);
    setMensagem("");
    try {
      const resultado = await request<{ eficienciaPercentual: number }>(
        "/configuracao/capacidade",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eficienciaPercentual: Number(valor) }),
        },
      );
      aoSalvar(resultado.eficienciaPercentual);
      setMensagem("Eficiência global atualizada.");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a configuração.",
      );
    } finally {
      setOcupado(false);
    }
  }
  return (
    <details className="tool-card">
      <summary>Configurar eficiência da máquina</summary>
      <form className="form-stack" onSubmit={salvar}>
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
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
          />
        </label>
        <button disabled={ocupado}>Salvar eficiência</button>
        {mensagem && <p role="status">{mensagem}</p>}
      </form>
    </details>
  );
}
