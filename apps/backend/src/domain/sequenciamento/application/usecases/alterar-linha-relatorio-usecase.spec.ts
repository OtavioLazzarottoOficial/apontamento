import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { RelatoriosRepositoryInMemory } from '../../../../../test/repositories-in-memory/relatorios-repository-in-memory.ts';
import { ExtratorPdf } from '../../../../infra/pdf/extrator-pdf.ts';
import { identificarLinhasSequenciamento } from '../../enterprise/identificar-linhas-sequenciamento.ts';
import { Relatorio, type ValorRelatorio } from '../../enterprise/relatorio.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { AlterarLinhaRelatorioUseCase } from './alterar-linha-relatorio-usecase.ts';

describe('alterar linha do relatório', () => {
  let repo: RelatoriosRepositoryInMemory;
  let sut: AlterarLinhaRelatorioUseCase;
  let relatorio: Relatorio;
  beforeEach(async () => {
    const pdf = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const paginas = await new ExtratorPdf().extrair(pdf);
    const linhas = identificarLinhasSequenciamento(paginas);
    const conteudo = { paginas, linhas } as unknown as {
      [key: string]: ValorRelatorio;
    };
    relatorio = Relatorio.create({ conteudo, versao: 1 });
    repo = new RelatoriosRepositoryInMemory();
    repo.items.push(relatorio);
    sut = new AlterarLinhaRelatorioUseCase(
      repo,
      new AtualizarRelatorioUseCase(repo),
    );
  });

  it('atualiza a linha e os resumos incluindo setup', async () => {
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
    const conteudo = repo.items[0].conteudo as unknown as {
      linhas: { saldo: number; tempoProducaoSegundos: number }[];
      paginas: {
        largura: number;
        trechos: { texto: string; x: number; y: number }[];
      }[];
      resumos: {
        total: { realizada: number; saldo: number };
        porData: Record<string, { realizada: number }>;
      };
    };
    expect(conteudo.linhas[0]).toMatchObject({
      saldo: 370,
      tempoProducaoSegundos: 15640,
    });
    expect(conteudo.resumos.total).toMatchObject({
      realizada: 20,
      saldo: 3220,
    });
    expect(conteudo.resumos.porData['18/11/2026'].realizada).toBe(20);
    const pagina = conteudo.paginas[2];
    const data = pagina.trechos.find((item) => item.texto === '18/11/2026')!;
    const realizada = pagina.trechos.find(
      (item) =>
        Math.abs(item.y - data.y) < 3 &&
        item.x / pagina.largura > 0.68 &&
        item.x / pagina.largura < 0.72,
    );
    expect(realizada?.texto).toBe('20,0');
    const primeiraPagina = conteudo.paginas[0];
    const subtotalRealizado = primeiraPagina.trechos.find(
      (item) =>
        item.x / primeiraPagina.largura > 0.62 &&
        item.x / primeiraPagina.largura < 0.675 &&
        item.texto === '20,00',
    );
    expect(subtotalRealizado).toBeDefined();
    const totalGeral = conteudo.paginas[2].trechos.find(
      (item) => item.texto === 'Total:',
    )!;
    const totalRealizado = conteudo.paginas[2].trechos.find(
      (item) =>
        Math.abs(item.y - totalGeral.y) < 10 &&
        item.x / conteudo.paginas[2].largura > 0.62 &&
        item.x / conteudo.paginas[2].largura < 0.675,
    );
    expect(totalRealizado?.texto).toBe('20,0');
    expect(repo.items[0].versao).toBe(2);
  });
  it('rejeita quantidades inválidas e versões antigas sem alterar o relatório', async () => {
    const base = {
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      necessaria: 10,
      realizada: 11,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
    };
    expect((await sut.execute(base)).isLeft()).toBe(true);
    expect(
      (
        await sut.execute({ ...base, realizada: 0, versaoEsperada: 0 })
      ).isLeft(),
    ).toBe(true);
    expect(repo.items[0]).toBe(relatorio);
  });
  it('recalcula m² ao alterar dimensões ou quantidade', async () => {
    const resultado = await sut.execute({
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      necessaria: 390,
      realizada: 0,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
      dimensoes: '400 x 300 x 28',
    });
    expect(resultado.isRight()).toBe(true);
    const conteudo = repo.items[0].conteudo as unknown as {
      linhas: { area: number }[];
      paginas: { trechos: { texto: string }[] }[];
    };
    expect(conteudo.linhas[0].area).toBe(46.8);
    expect(
      conteudo.paginas[0].trechos.some((item) => item.texto === '180,66'),
    ).toBe(true);
  });
  it('atualiza os subtotais das demais colunas editáveis', async () => {
    const resultado = await sut.execute({
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      necessaria: 390,
      realizada: 0,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
      pendente: 100,
      anterior: 10,
      pecasPorCiclo: 2,
    });
    expect(resultado.isRight()).toBe(true);
    const conteudo = repo.items[0].conteudo as unknown as {
      paginas: { trechos: { texto: string }[] }[];
    };
    expect(
      conteudo.paginas[0].trechos.some((item) => item.texto === '490'),
    ).toBe(true);
    expect(
      conteudo.paginas[0].trechos.some((item) => item.texto === '400,00'),
    ).toBe(true);
  });
});
