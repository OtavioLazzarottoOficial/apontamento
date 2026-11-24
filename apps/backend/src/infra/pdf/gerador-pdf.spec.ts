import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RelatoriosRepositoryInMemory } from '../../../test/repositories-in-memory/relatorios-repository-in-memory.ts';
import { identificarLinhasSequenciamento } from '../../domain/sequenciamento/enterprise/identificar-linhas-sequenciamento.ts';
import {
  Relatorio,
  type ValorRelatorio,
} from '../../domain/sequenciamento/enterprise/relatorio.ts';
import { AtualizarRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/atualizar-relatorio-usecase.ts';
import { AlterarLinhaRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/alterar-linha-relatorio-usecase.ts';
import { ExtratorPdf } from './extrator-pdf.ts';
import { GeradorPdf } from './gerador-pdf.ts';

describe('geração de PDF editado', () => {
  it('preserva as páginas e inclui os valores editados e recalculados', async () => {
    const original = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const extrator = new ExtratorPdf();
    const paginas = await extrator.extrair(original);
    const linhas = identificarLinhasSequenciamento(paginas);
    const conteudo = {
      pdfBase64: original.toString('base64'),
      paginas,
      linhas,
    } as unknown as { [key: string]: ValorRelatorio };
    const relatorio = Relatorio.create({ conteudo, versao: 1 });
    const repo = new RelatoriosRepositoryInMemory();
    repo.items.push(relatorio);
    const sut = new AlterarLinhaRelatorioUseCase(
      repo,
      new AtualizarRelatorioUseCase(repo),
    );
    const resultado = await sut.execute({
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      necessaria: 390,
      realizada: 20,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
    });
    expect(resultado.isRight()).toBe(true);
    const pdf = await new GeradorPdf(extrator).gerar(repo.items[0]);
    if (process.env.PDF_QA_PATH) await writeFile(process.env.PDF_QA_PATH, pdf);
    const extraido = await extrator.extrair(pdf);
    expect(extraido).toHaveLength(5);
    expect(extraido.every((pagina) => pagina.trechos.length === 0)).toBe(true);
  });
});
