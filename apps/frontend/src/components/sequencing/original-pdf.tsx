import { useEffect, useState } from "react";
import { base } from "./sequencing-shared.ts";

export function OriginalPdf({
  reportId,
  token,
}: {
  reportId: string;
  token: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    let objectUrl: string | undefined;

    async function load() {
      try {
        const response = await fetch(
          `${base}/relatorios/${encodeURIComponent(reportId)}/original`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abort.signal,
          },
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "O PDF original não está disponível neste relatório."
              : "Não foi possível carregar o PDF original.",
          );
        }
        const pdf = await response.blob();
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(pdf);
        setUrl(objectUrl);
      } catch (error) {
        if (!abort.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o PDF original.",
          );
        }
      }
    }

    void load();
    return () => {
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reportId, token]);

  return (
    <section className="original-pdf" aria-label="PDF original">
      <div className="original-pdf-heading">
        <div>
          <h3>PDF original</h3>
          <p>
            Documento enviado na importação, sem as edições feitas no sistema.
          </p>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer">
            Abrir em outra aba
          </a>
        )}
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : url ? (
        <iframe title="PDF original do sequenciamento" src={url} />
      ) : (
        <p role="status">Carregando PDF original…</p>
      )}
    </section>
  );
}
