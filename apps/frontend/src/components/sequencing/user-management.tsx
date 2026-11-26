import { useEffect, useState, type FormEvent } from "react";
import type { UserProfile } from "./sequencing-shared.ts";
import { request } from "./sequencing-shared.ts";

export function UserManagement({ token }: { token: string }) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [userList, setUserList] = useState<(UserProfile & { id: string })[]>(
    [],
  );

  useEffect(() => {
    const abortController = new AbortController();
    void request<{ usuarios: (UserProfile & { id: string })[] }>("/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
      signal: abortController.signal,
    })
      .then((result) => setUserList(result.usuarios))
      .catch(() => {
        if (!abortController.signal.aborted)
          setStatusMessage("Não foi possível carregar os usuários.");
      });
    return () => abortController.abort();
  }, [token]);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsBusy(true);
    setStatusMessage("");
    try {
      const user = await request<UserProfile & { id: string }>("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.get("email"),
          senha: formData.get("senha"),
          podeEditar: formData.has("podeEditar"),
          podeExportar: formData.has("podeExportar"),
        }),
      });
      setUserList((atuais) => [...atuais, user]);
      form.reset();
      setStatusMessage("Usuário cadastrado.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o usuário.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function salvarPermissoes(
    event: FormEvent<HTMLFormElement>,
    id: string,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsBusy(true);
    setStatusMessage("");
    try {
      const user = await request<UserProfile & { id: string }>(
        `/usuarios/${encodeURIComponent(id)}/permissoes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            podeEditar: formData.has("podeEditar"),
            podeExportar: formData.has("podeExportar"),
          }),
        },
      );
      setUserList((atuais) =>
        atuais.map((atual) => (atual.id === user.id ? user : atual)),
      );
      setStatusMessage("Permissões atualizadas.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as permissões.",
      );
    } finally {
      setIsBusy(false);
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
        <button disabled={isBusy}>Cadastrar usuário</button>
        {statusMessage && <p role="status">{statusMessage}</p>}
      </form>
      {userList
        .filter((user) => user.papel === "USUARIO")
        .map((user) => (
          <form
            className="user-permissions"
            key={user.id}
            onSubmit={(event) => void salvarPermissoes(event, user.id)}
          >
            <strong>{user.email}</strong>
            <label className="check">
              <input
                name="podeEditar"
                type="checkbox"
                defaultChecked={user.podeEditar}
              />
              Editar
            </label>
            <label className="check">
              <input
                name="podeExportar"
                type="checkbox"
                defaultChecked={user.podeExportar}
              />
              Exportar
            </label>
            <button className="secondary" disabled={isBusy}>
              Salvar permissões
            </button>
          </form>
        ))}
    </details>
  );
}
