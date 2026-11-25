import { useRef, useState } from "react";

export function PdfFileInput({ disabled }: { disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className="pdf-file-input">
      <label>
        Arquivo PDF
        <input
          ref={input}
          name="arquivo"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={disabled}
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      {fileName && (
        <button
          type="button"
          className="secondary"
          disabled={disabled}
          onClick={() => {
            if (input.current) input.current.value = "";
            setFileName("");
          }}
        >
          Remover arquivo selecionado
        </button>
      )}
    </div>
  );
}
