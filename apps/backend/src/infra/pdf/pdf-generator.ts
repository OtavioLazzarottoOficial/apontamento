import { LegacyReportDocument } from './legacy-report-document.ts';
import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { z } from 'zod';
import { PdfExtractor } from './pdf-extractor.ts';
import type { ReportSnapshot } from '../../domain/sequencing/application/models/report-snapshot.ts';

const schema = z.object({
  pdfBase64: z.string(),
  paginas: z.array(
    z.object({
      numero: z.number(),
      largura: z.number(),
      altura: z.number(),
      trechos: z.array(
        z.object({
          texto: z.string(),
          x: z.number(),
          y: z.number(),
          largura: z.number(),
          altura: z.number(),
        }),
      ),
    }),
  ),
});

@Injectable()
export class PdfGenerator {
  constructor(private readonly extractor: PdfExtractor) {}

  async generatePreview(report: ReportSnapshot): Promise<string[]> {
    const pdf = await this.generate(report);
    const pdfTask = getDocument({
      data: new Uint8Array(pdf),
      useSystemFonts: true,
    });
    try {
      const document = await pdfTask.promise;
      const imagens: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const contexto = canvas.getContext('2d');
        await page.render({
          canvasContext: contexto as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        imagens.push(canvas.toBuffer('image/png').toString('base64'));
      }
      return imagens;
    } finally {
      await pdfTask.destroy();
    }
  }

  async generate(report: ReportSnapshot): Promise<Uint8Array> {
    const documentData = schema.parse(
      LegacyReportDocument.dataOf(report.content),
    );
    const source = Buffer.from(documentData.pdfBase64, 'base64');
    const paginasOriginais = await this.extractor.extract(source);
    const document = await PDFDocument.load(source);
    const tarefaRenderizacao = getDocument({
      data: new Uint8Array(source),
      useSystemFonts: true,
    });
    const fonteRenderizada = await tarefaRenderizacao.promise;
    const fonte = await document.embedFont(StandardFonts.Helvetica);
    if (
      paginasOriginais.length !== documentData.paginas.length ||
      document.getPageCount() !== documentData.paginas.length
    )
      throw new Error(
        'As páginas do relatório não correspondem ao PDF original.',
      );

    try {
      for (let p = 0; p < documentData.paginas.length; p++) {
        const page = documentData.paginas[p];
        const paginaOriginal = paginasOriginais[p];
        const paginaPdf = document.getPage(p);
        const paginaRenderizada = await fonteRenderizada.getPage(p + 1);
        const viewport = paginaRenderizada.getViewport({ scale: 2 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const contexto = canvas.getContext('2d');
        await paginaRenderizada.render({
          canvasContext: contexto as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        if (page.trechos.length !== paginaOriginal.trechos.length)
          throw new Error(
            'Os campos do relatório não correspondem ao PDF original.',
          );
        for (let i = 0; i < page.trechos.length; i++) {
          const current = page.trechos[i];
          const previous = paginaOriginal.trechos[i];
          if (
            Math.abs(current.x - previous.x) > 0.1 ||
            Math.abs(current.y - previous.y) > 0.1
          )
            throw new Error(
              'A posição de um campo não corresponde ao PDF original.',
            );
          if (current.texto === previous.texto) continue;
          const altura = Math.max(previous.altura, 1);
          const largura = Math.max(previous.largura, 1);
          const textoLargura = fonte.widthOfTextAtSize(current.texto, altura);
          const expansao = Math.min(6, Math.max(0, textoLargura - largura));
          const larguraDisponivel = largura + expansao;
          const tamanho =
            textoLargura > larguraDisponivel
              ? (altura * larguraDisponivel) / textoLargura
              : altura;
          const xTexto =
            previous.x +
            largura -
            fonte.widthOfTextAtSize(current.texto, tamanho);
          const y = paginaPdf.getHeight() - previous.y;
          const sx = Math.max(0, Math.floor(previous.x * 2));
          const sy = Math.max(0, Math.floor((previous.y - altura) * 2));
          const sw = Math.min(
            canvas.width - sx,
            Math.max(1, Math.ceil(largura * 2)),
          );
          const sh = Math.min(
            canvas.height - sy,
            Math.max(1, Math.ceil(altura * 2)),
          );
          const pixels = contexto.getImageData(sx, sy, sw, sh).data;
          const frequencias = new Map<string, number>();
          for (let k = 0; k < pixels.length; k += 4) {
            const key = `${pixels[k]},${pixels[k + 1]},${pixels[k + 2]}`;
            frequencias.set(key, (frequencias.get(key) ?? 0) + 1);
          }
          const cor = [...frequencias.entries()]
            .sort((a, b) => b[1] - a[1])[0][0]
            .split(',')
            .map(Number);
          const fundo = rgb(cor[0] / 255, cor[1] / 255, cor[2] / 255);
          const escuro = 0.299 * cor[0] + 0.587 * cor[1] + 0.114 * cor[2] < 150;
          paginaPdf.drawRectangle({
            x: previous.x - expansao - 0.3,
            y: y - altura * 0.25,
            width: larguraDisponivel + 0.6,
            height: altura * 1.2,
            color: fundo,
          });
          paginaPdf.drawText(current.texto, {
            x: xTexto,
            y,
            size: tamanho,
            font: fonte,
            color: escuro ? rgb(1, 1, 1) : rgb(0, 0, 0),
          });
        }
      }
    } finally {
      await tarefaRenderizacao.destroy();
    }
    const comAlteracoes = await document.save();
    const tarefaFinal = getDocument({
      data: new Uint8Array(comAlteracoes),
      useSystemFonts: true,
    });
    try {
      const documentoRenderizado = await tarefaFinal.promise;
      const result = await PDFDocument.create();
      for (
        let pageNumber = 1;
        pageNumber <= documentoRenderizado.numPages;
        pageNumber++
      ) {
        const page = await documentoRenderizado.getPage(pageNumber);
        const tamanhoOriginal = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 2 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const contexto = canvas.getContext('2d');
        await page.render({
          canvasContext: contexto as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        const imagem = await result.embedPng(canvas.toBuffer('image/png'));
        result
          .addPage([tamanhoOriginal.width, tamanhoOriginal.height])
          .drawImage(imagem, {
            x: 0,
            y: 0,
            width: tamanhoOriginal.width,
            height: tamanhoOriginal.height,
          });
      }
      return await result.save();
    } finally {
      await tarefaFinal.destroy();
    }
  }
}
