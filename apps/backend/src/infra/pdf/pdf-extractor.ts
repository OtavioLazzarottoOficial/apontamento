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
  async extract(file: Uint8Array): Promise<PdfPage[]> {
    const pdfTask = getDocument({
      data: new Uint8Array(file),
      useSystemFonts: true,
    });

    try {
      const document = await pdfTask.promise;
      const pages: PdfPage[] = [];

      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const fragments = content.items
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

        pages.push({
          numero: number,
          largura: viewport.width,
          altura: viewport.height,
          trechos: fragments,
        });
      }

      return pages;
    } finally {
      await pdfTask.destroy();
    }
  }
}
