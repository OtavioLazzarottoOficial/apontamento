import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PdfExtractor } from './pdf-extractor.ts';
import { identifySequencingLines } from './identify-sequencing-lines.ts';

describe('identificar linhas do mapa', () => {
  it('identifica as ordens, datas e valores das cinco páginas do exemplo', async () => {
    const arquivo = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const paginas = await new PdfExtractor().extrair(arquivo);
    const linhas = identifySequencingLines(paginas);
    expect(linhas).toHaveLength(24);
    expect(
      Object.fromEntries(
        [
          '18/11/2026',
          '19/11/2026',
          '24/11/2026',
          '26/11/2026',
          '27/11/2026',
        ].map((date) => [
          date,
          linhas
            .filter((line) => line.dataEntrega === date)
            .map((line) => line.ordem),
        ]),
      ),
    ).toEqual({
      '18/11/2026': ['42043598', '42043593', '42043594', '42043595'],
      '19/11/2026': ['42043596', '42043597', '42043599'],
      '24/11/2026': [
        '42047103',
        '42048635',
        '42048636',
        '42048639',
        '42048640',
      ],
      '26/11/2026': [
        '42047202',
        '42047203',
        '42047205',
        '42047206',
        '42047217',
        '42047218',
        '42046562',
        '42046563',
        '42046564',
        '42046565',
        '42047477',
      ],
      '27/11/2026': ['42048240'],
    });
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
