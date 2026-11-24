import { Injectable } from '@nestjs/common';
import type { Relatorio } from '../../enterprise/relatorio.ts';

@Injectable()
export abstract class RelatoriosRepository {
  abstract listar(): Promise<{ id: string; versao: number; nome: string }[]>;
  abstract criar(relatorio: Relatorio): Promise<void>;
  abstract buscarPorId(id: string): Promise<Relatorio | null>;
  abstract atualizarSeVersaoCorresponde(
    relatorio: Relatorio,
    versaoEsperada: number,
  ): Promise<boolean>;
}
