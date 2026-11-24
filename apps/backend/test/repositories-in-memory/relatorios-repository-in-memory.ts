import { RelatoriosRepository } from '../../src/domain/sequenciamento/application/repositories/relatorios-repository.ts';
import type { Relatorio } from '../../src/domain/sequenciamento/enterprise/relatorio.ts';

export class RelatoriosRepositoryInMemory extends RelatoriosRepository {
  items: Relatorio[] = [];

  async listar() {
    return this.items.map((item) => ({
      id: item.id.toString(),
      versao: item.versao,
      nome: typeof item.conteudo.nome === 'string' ? item.conteudo.nome : '',
    }));
  }

  async criar(relatorio: Relatorio) {
    this.items.push(relatorio);
  }

  async buscarPorId(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async atualizarSeVersaoCorresponde(
    relatorio: Relatorio,
    versaoEsperada: number,
  ) {
    const index = this.items.findIndex(
      (item) => item.id.equals(relatorio.id) && item.versao === versaoEsperada,
    );

    if (index < 0) {
      return false;
    }

    this.items[index] = relatorio;
    return true;
  }
}
