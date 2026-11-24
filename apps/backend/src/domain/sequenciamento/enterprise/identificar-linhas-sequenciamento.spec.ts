import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ExtratorPdf } from '../../../infra/pdf/extrator-pdf.ts';
import { identificarLinhasSequenciamento } from './identificar-linhas-sequenciamento.ts';

describe('identificar linhas do mapa', () => {
  it('identifica as ordens, datas e valores das cinco páginas do exemplo', async () => {
    const arquivo = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const paginas = await new ExtratorPdf().extrair(arquivo);
    const linhas = identificarLinhasSequenciamento(paginas);
    expect(linhas).toHaveLength(24);
    expect(linhas[0]).toMatchObject({
      ordem: '42043598',
      dataEntrega: '18/11/2026',
      necessaria: 390,
      realizada: 0,
      saldo: 390,
      tempoUnitarioSegundos: 40,
      tempoProducaoSegundos: 15600,
    });
    expect(
      linhas.find((linha) => linha.ordem === '42046564')?.dataEntrega,
    ).toBe('26/11/2026');
    expect(linhas.at(-1)).toMatchObject({
      ordem: '42048240',
      dataEntrega: '27/11/2026',
      necessaria: 200,
    });
  });
});
