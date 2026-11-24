import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { Relatorio } from '../../../../domain/sequenciamento/enterprise/relatorio.ts';
import { DadosRelatorioInvalidosError } from '../../../errors/dados-relatorio-invalidos-error.ts';
import { PrismaRelatorioMapper } from './prisma-relatorio-mapper.ts';

describe('PrismaRelatorioMapper', () => {
  it('preserva identidade, versão e conteúdo', () => {
    const original = Relatorio.create(
      { versao: 3, conteudo: { paginas: [{ texto: 'Olá' }] } },
      new UniqueEntityID('relatorio-1'),
    );
    const restored = PrismaRelatorioMapper.toDomain({
      id: original.id.toString(),
      versao: original.versao,
      conteudo: JSON.parse(
        JSON.stringify(PrismaRelatorioMapper.toPrisma(original)),
      ),
    });
    expect(restored.id.toString()).toBe('relatorio-1');
    expect(restored.versao).toBe(3);
    expect(restored.conteudo).toEqual(original.conteudo);
  });

  it('rejeita conteúdo persistido com formato inválido', () => {
    expect(() =>
      PrismaRelatorioMapper.toDomain({ id: '1', versao: 1, conteudo: [] }),
    ).toThrow(DadosRelatorioInvalidosError);
  });
});
