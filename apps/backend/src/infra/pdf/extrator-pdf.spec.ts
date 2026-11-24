import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ExtratorPdf } from './extrator-pdf.ts';

describe('ExtratorPdf', () => {
  it('extrai as cinco páginas e o texto posicionado do PDF de referência', async () => {
    const arquivo = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const paginas = await new ExtratorPdf().extrair(arquivo);
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

  it('rejeita conteúdo que não é PDF', async () => {
    await expect(
      new ExtratorPdf().extrair(new Uint8Array([1, 2, 3])),
    ).rejects.toThrow();
  });
});
