import { Injectable } from '@nestjs/common';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api.d.ts';

export interface PdfTextFragment {
  texto: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface PdfPage {
  numero: number;
  largura: number;
  altura: number;
  trechos: PdfTextFragment[];
}

@Injectable()
export class PdfExtractor {
  async extrair(arquivo: Uint8Array): Promise<PdfPage[]> {
    const tarefa = getDocument({
      data: new Uint8Array(arquivo),
      useSystemFonts: true,
    });

    try {
      const documento = await tarefa.promise;
      const paginas: PdfPage[] = [];

      for (let numero = 1; numero <= documento.numPages; numero++) {
        const pagina = await documento.getPage(numero);
        const viewport = pagina.getViewport({ scale: 1 });
        const conteudo = await pagina.getTextContent();
        const trechos = conteudo.items
          .filter(
            (item): item is TextItem =>
              'str' in item && item.str.trim().length > 0,
          )
          .map((item) => {
            const [x, y] = viewport.convertToViewportPoint(
              item.transform[4],
              item.transform[5],
            );
            return {
              texto: item.str,
              x,
              y,
              largura: item.width,
              altura: item.height,
            };
          });

        paginas.push({
          numero,
          largura: viewport.width,
          altura: viewport.height,
          trechos,
        });
      }

      return paginas;
    } finally {
      await tarefa.destroy();
    }
  }
}
