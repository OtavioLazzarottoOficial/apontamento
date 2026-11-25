import { useEffect, useState, type FormEvent } from "react";
import type { UserProfile } from "./sequencing-shared.ts";
import { request } from "./sequencing-shared.ts";

export function UserManagement({ token }: { token: string }) {
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [usuarios, setUsuarios] = useState<(UserProfile & { id: string })[]>(
    [],
  );

  useEffect(() => {
    const abortador = new AbortController();
    void request<{ usuarios: (UserProfile & { id: string })[] }>("/usuarios", {
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
      const usuario = await request<UserProfile & { id: string }>("/usuarios", {
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
      const usuario = await request<UserProfile & { id: string }>(
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
