import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { left, type Either } from '../../../../core/either.ts';
import type { ValorRelatorio } from '../../enterprise/relatorio.ts';
import { calcularLinhaSequenciamento } from '../../enterprise/calcular-linha-sequenciamento.ts';
import { calcularAreaEmCentesimos } from '../../enterprise/calcular-area.ts';
import {
  atualizarResumosNasPaginas,
  atualizarSubtotaisNasPaginas,
} from '../../enterprise/atualizar-resumos-nas-paginas.ts';
import { ValoresLinhaInvalidosError } from '../../enterprise/errors/valores-linha-invalidos-error.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';
import { LinhaNaoEncontradaError } from './errors/linha-nao-encontrada-error.ts';

const referencia = z.object({
  pagina: z.number().int().positive(),
  indice: z.number().int().nonnegative(),
});
const linhaSchema = z
  .object({
    ordem: z.string(),
    dataEntrega: z.string(),
    programacao: z.string(),
    lote: z.string(),
    comprimentoMm: z.string(),
    larguraMm: z.string(),
    area: z.number(),
    pendente: z.number(),
    anterior: z.number(),
    pecasPorCiclo: z.number(),
    necessaria: z.number(),
    realizada: z.number(),
    saldo: z.number(),
    tempoSetupSegundos: z.number(),
    tempoUnitarioSegundos: z.number(),
    tempoProducaoSegundos: z.number(),
    camposTexto: z.object({
      ordem: z.array(referencia),
      produto: z.array(referencia),
      componente: z.array(referencia),
      dimensoes: z.array(referencia),
    }),
    campos: z.object({
      area: referencia,
      pendente: referencia,
      anterior: referencia,
      pecasPorCiclo: referencia,
      necessaria: referencia,
      realizada: referencia,
      saldo: referencia,
      tempoSetup: referencia,
      tempoUnitario: referencia,
      tempoProducao: referencia,
    }),
  })
  .passthrough();
const conteudoSchema = z
  .object({
    linhas: z.array(linhaSchema),
    paginas: z.array(
      z
        .object({
          numero: z.number(),
          largura: z.number(),
          trechos: z.array(
            z
              .object({ texto: z.string(), x: z.number(), y: z.number() })
              .passthrough(),
          ),
        })
        .passthrough(),
    ),
  })
  .passthrough();

interface Request {
  id: string;
  indice: number;
  versaoEsperada: number;
  necessaria: number;
  realizada: number;
  tempoUnitarioSegundos: number;
  tempoSetupSegundos: number;
  dimensoes?: string;
  pendente?: number;
  anterior?: number;
  pecasPorCiclo?: number;
}

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return [horas, minutos, segundos % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

@Injectable()
export class AlterarLinhaRelatorioUseCase {
  constructor(
    private readonly relatorios: RelatoriosRepository,
    private readonly atualizar: AtualizarRelatorioUseCase,
  ) {}

  async execute(
    request: Request,
  ): Promise<
    Either<
      | RelatorioNaoEncontradoError
      | ConflitoDeVersaoError
      | ValoresLinhaInvalidosError
      | LinhaNaoEncontradaError,
      { relatorio: import('../../enterprise/relatorio.ts').Relatorio }
    >
  > {
    const calculo = calcularLinhaSequenciamento({
      quantidadeNecessaria: request.necessaria,
      quantidadeRealizada: request.realizada,
      tempoPorPecaEmSegundos: request.tempoUnitarioSegundos,
      tempoSetupEmSegundos: request.tempoSetupSegundos,
    });
    if (calculo.isLeft()) return left(calculo.value);
    if (
      [request.pendente, request.anterior, request.pecasPorCiclo].some(
        (valor) =>
          valor !== undefined && (!Number.isSafeInteger(valor) || valor < 0),
      )
    ) {
      return left(new ValoresLinhaInvalidosError());
    }
    const atual = await this.relatorios.buscarPorId(request.id);
    if (!atual) return left(new RelatorioNaoEncontradoError());
    if (atual.versao !== request.versaoEsperada)
      return left(new ConflitoDeVersaoError());
    const conteudo = conteudoSchema.parse(structuredClone(atual.conteudo));
    const linha = conteudo.linhas[request.indice];
    if (!linha) return left(new LinhaNaoEncontradaError());
    if (request.dimensoes !== undefined) {
      const dimensoes =
        /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*\d+(?:[.,]\d+)?$/i.exec(
          request.dimensoes.trim(),
        );
      if (
        !dimensoes ||
        calcularAreaEmCentesimos(
          dimensoes[1],
          dimensoes[2],
          request.necessaria,
        ) === null
      ) {
        return left(new ValoresLinhaInvalidosError());
      }
      const ref = linha.camposTexto.dimensoes.find((item) => {
        const texto = conteudo.paginas.find(
          (pagina) => pagina.numero === item.pagina,
        )?.trechos[item.indice]?.texto;
        return (
          texto &&
          /^\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*x/i.test(texto.trim())
        );
      });
      const trecho =
        ref &&
        conteudo.paginas.find((pagina) => pagina.numero === ref.pagina)
          ?.trechos[ref.indice];
      if (!trecho) throw new Error('Campo de dimensões não encontrado.');
      trecho.texto = request.dimensoes.trim();
      linha.comprimentoMm = dimensoes[1];
      linha.larguraMm = dimensoes[2];
    }
    Object.assign(linha, {
      necessaria: request.necessaria,
      realizada: request.realizada,
      tempoUnitarioSegundos: request.tempoUnitarioSegundos,
      tempoSetupSegundos: request.tempoSetupSegundos,
      saldo: calculo.value.saldo,
      tempoProducaoSegundos: calculo.value.tempoProducaoEmSegundos,
      pendente: request.pendente ?? linha.pendente,
      anterior: request.anterior ?? linha.anterior,
      pecasPorCiclo: request.pecasPorCiclo ?? linha.pecasPorCiclo,
    });
    function atualizarTrecho(ref: z.infer<typeof referencia>, texto: string) {
      const trecho = conteudo.paginas.find(
        (pagina) => pagina.numero === ref.pagina,
      )?.trechos[ref.indice];
      if (!trecho)
        throw new Error(
          'Referência de campo inválida no relatório armazenado.',
        );
      trecho.texto = texto;
    }
    atualizarTrecho(
      linha.campos.necessaria,
      request.necessaria.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.realizada,
      request.realizada.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.saldo,
      calculo.value.saldo.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(
      linha.campos.tempoSetup,
      formatarTempo(request.tempoSetupSegundos),
    );
    atualizarTrecho(
      linha.campos.tempoUnitario,
      formatarTempo(request.tempoUnitarioSegundos),
    );
    atualizarTrecho(
      linha.campos.tempoProducao,
      formatarTempo(calculo.value.tempoProducaoEmSegundos),
    );
    atualizarTrecho(linha.campos.pendente, String(linha.pendente));
    atualizarTrecho(
      linha.campos.anterior,
      linha.anterior.toFixed(2).replace('.', ','),
    );
    atualizarTrecho(linha.campos.pecasPorCiclo, String(linha.pecasPorCiclo));
    const porData: Record<
      string,
      {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      }
    > = {};
    const porLote: Record<
      string,
      {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      }
    > = {};
    const total = {
      necessaria: 0,
      realizada: 0,
      saldo: 0,
      tempoProducaoSegundos: 0,
    };
    for (const item of conteudo.linhas) {
      const areaEmCentesimos = calcularAreaEmCentesimos(
        item.comprimentoMm,
        item.larguraMm,
        item.necessaria,
      );
      if (areaEmCentesimos === null) {
        throw new Error('Dimensões inválidas no relatório armazenado.');
      }
      item.area = areaEmCentesimos / 100;
      atualizarTrecho(item.campos.area, item.area.toFixed(2).replace('.', ','));
      const resultado = calcularLinhaSequenciamento({
        quantidadeNecessaria: item.necessaria,
        quantidadeRealizada: item.realizada,
        tempoPorPecaEmSegundos: item.tempoUnitarioSegundos,
        tempoSetupEmSegundos: item.tempoSetupSegundos,
      });
      if (resultado.isLeft()) {
        return left(resultado.value);
      }
      item.saldo = resultado.value.saldo;
      item.tempoProducaoSegundos = resultado.value.tempoProducaoEmSegundos;
      atualizarTrecho(
        item.campos.saldo,
        item.saldo.toFixed(2).replace('.', ','),
      );
      atualizarTrecho(
        item.campos.tempoProducao,
        formatarTempo(item.tempoProducaoSegundos),
      );
      const data = (porData[item.dataEntrega] ??= {
        necessaria: 0,
        realizada: 0,
        saldo: 0,
        tempoProducaoSegundos: 0,
      });
      const lote = (porLote[`${item.programacao}|${item.lote}`] ??= {
        necessaria: 0,
        realizada: 0,
        saldo: 0,
        tempoProducaoSegundos: 0,
      });
      for (const resumo of [data, lote, total]) {
        resumo.necessaria += item.necessaria;
        resumo.realizada += item.realizada;
        resumo.saldo += item.saldo;
        resumo.tempoProducaoSegundos += item.tempoProducaoSegundos;
      }
    }
    atualizarResumosNasPaginas(conteudo.paginas, { porData, porLote, total });
    atualizarSubtotaisNasPaginas(conteudo.paginas, conteudo.linhas);
    conteudo.resumos = { porData, porLote, total };
    return this.atualizar.execute({
      id: request.id,
      versaoEsperada: request.versaoEsperada,
      conteudo: conteudo as unknown as { [key: string]: ValorRelatorio },
    });
  }
}
