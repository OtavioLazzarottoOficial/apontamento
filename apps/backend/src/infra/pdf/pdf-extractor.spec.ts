import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PdfExtractor } from './pdf-extractor.ts';

describe('PdfExtractor', () => {
  it('extracts five pages and positioned text from the reference PDF', async () => {
    const arquivo = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const paginas = await new PdfExtractor().extract(arquivo);
    expect(paginas).toHaveLength(5);
    expect(
      paginas.every((pagina) => pagina.largura > 0 && pagina.altura > 0),
    ).toBe(true);
    expect(
      paginas[0].trechos.some((trecho) =>
        trecho.texto.includes('Furadeira Nanxing'),
      ),
    ).toBe(true);
    expect(
      paginas[4].trechos.some((trecho) => trecho.texto.includes('Serraria')),
    ).toBe(true);
  });

  it('rejects content that is not a PDF', async () => {
    await expect(
      new PdfExtractor().extract(new Uint8Array([1, 2, 3])),
    ).rejects.toThrow();
  });
});
