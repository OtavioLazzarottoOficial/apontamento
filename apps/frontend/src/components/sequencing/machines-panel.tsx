import { useState, type FormEvent } from "react";
import type { Machine } from "./sequencing-shared.ts";
import { request } from "./sequencing-shared.ts";

export function MachinesPanel({
  token,
  machines,
  canEdit,
  onCreated,
  onImport,
}: {
  token: string;
  machines: Machine[];
  canEdit: boolean;
  onCreated: () => Promise<void>;
  onImport: (machineId: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await request(
        editing ? `/maquinas/${encodeURIComponent(editing.id)}` : "/maquinas",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.get("name"),
          }),
        },
      );
      form.reset();
      setEditing(null);
      await onCreated();
      setMessage(editing ? "Máquina atualizada." : "Máquina cadastrada.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a máquina.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="machine-page">
      <p className="eyebrow">PRODUÇÃO</p>
      <h1>Máquinas</h1>
      <p>Cadastre os equipamentos para vincular os sequenciamentos.</p>
      {canEdit && (
        <form
          key={editing?.id ?? "new"}
          className="tool-card machine-form"
          onSubmit={create}
        >
          <h2>{editing ? "Editar máquina" : "Cadastrar máquina"}</h2>
          <label>
            Nome da máquina
            <input
              name="name"
              defaultValue={editing?.name}
              placeholder="Ex.: Furadeira manual"
              required
              maxLength={150}
            />
          </label>
          <button disabled={busy}>
            {busy
              ? "Salvando…"
              : editing
                ? "Salvar alterações"
                : "Cadastrar máquina"}
          </button>
          {editing && (
            <button
              type="button"
              className="secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar edição
            </button>
          )}
          {message && <p role="status">{message}</p>}
        </form>
      )}
      <div className="tool-card">
        <h2>Máquinas cadastradas</h2>
        {machines.length === 0 ? (
          <p>Nenhuma máquina cadastrada.</p>
        ) : (
          <ul className="machine-list">
            {machines.map((machine) => (
              <li key={machine.id}>
                <strong>{machine.name}</strong>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onImport(machine.id)}
                    >
                      Vincular PDF
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setEditing(machine);
                        setMessage("");
                      }}
                    >
                      Editar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
