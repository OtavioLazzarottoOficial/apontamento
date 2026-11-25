import { useState, type FormEvent } from "react";
import type { Report, FieldReference } from "./sequencing-shared.ts";
import { request } from "./sequencing-shared.ts";

export function TextEditor({
  relatorio,
  token,
  selecionado,
  aoFechar,
  aoSalvar,
}: {
  relatorio: Report;
  token: string;
  selecionado: { referencia: FieldReference; rotulo: string };
  aoFechar: () => void;
  aoSalvar: (relatorio: Report) => void;
}) {
  const trecho = relatorio.conteudo.paginas.find(
    (pagina) => pagina.numero === selecionado.referencia.pagina,
  )?.trechos[selecionado.referencia.indice];
  const [valor, setValor] = useState(trecho?.texto ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const atualizado = await request<Report>(
        `/relatorios/${encodeURIComponent(relatorio.id)}/texto`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versaoEsperada: relatorio.versao,
            ...selecionado.referencia,
            texto: valor,
          }),
        },
      );
      aoSalvar(atualizado);
    } catch (causa) {
      setErro(
        causa instanceof Error
          ? causa.message
          : "Não foi possível salvar o texto.",
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
        aria-labelledby="titulo-texto"
        className="modal-campo"
      >
        <h2 id="titulo-texto">{selecionado.rotulo}</h2>
        <form className="form-stack" onSubmit={salvar}>
          <label>
            Texto
            <input
              autoFocus
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              maxLength={150}
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
