import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { z } from 'zod';
import { PdfExtractor } from './pdf-extractor.ts';
import type { Report } from '../../domain/sequencing/enterprise/report.ts';

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

  async gerarPreview(relatorio: Report): Promise<string[]> {
    const pdf = await this.gerar(relatorio);
    const tarefa = getDocument({
      data: new Uint8Array(pdf),
      useSystemFonts: true,
    });
    try {
      const documento = await tarefa.promise;
      const imagens: string[] = [];
      for (let numero = 1; numero <= documento.numPages; numero++) {
        const pagina = await documento.getPage(numero);
        const viewport = pagina.getViewport({ scale: 1.5 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const contexto = canvas.getContext('2d');
        await pagina.render({
          canvasContext: contexto as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        imagens.push(canvas.toBuffer('image/png').toString('base64'));
      }
      return imagens;
    } finally {
      await tarefa.destroy();
    }
  }

  async gerar(relatorio: Report): Promise<Uint8Array> {
    const dados = schema.parse(relatorio.content);
    const original = Buffer.from(dados.pdfBase64, 'base64');
    const paginasOriginais = await this.extractor.extrair(original);
    const documento = await PDFDocument.load(original);
    const tarefaRenderizacao = getDocument({
      data: new Uint8Array(original),
      useSystemFonts: true,
    });
    const fonteRenderizada = await tarefaRenderizacao.promise;
    const fonte = await documento.embedFont(StandardFonts.Helvetica);
    if (
      paginasOriginais.length !== dados.paginas.length ||
      documento.getPageCount() !== dados.paginas.length
    )
      throw new Error(
        'As páginas do relatório não correspondem ao PDF original.',
      );

    try {
      for (let p = 0; p < dados.paginas.length; p++) {
        const pagina = dados.paginas[p];
        const paginaOriginal = paginasOriginais[p];
        const paginaPdf = documento.getPage(p);
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
        if (pagina.trechos.length !== paginaOriginal.trechos.length)
          throw new Error(
            'Os campos do relatório não correspondem ao PDF original.',
          );
        for (let i = 0; i < pagina.trechos.length; i++) {
          const atual = pagina.trechos[i];
          const anterior = paginaOriginal.trechos[i];
          if (
            Math.abs(atual.x - anterior.x) > 0.1 ||
            Math.abs(atual.y - anterior.y) > 0.1
          )
            throw new Error(
              'A posição de um campo não corresponde ao PDF original.',
            );
          if (atual.texto === anterior.texto) continue;
          const altura = Math.max(anterior.altura, 1);
          const largura = Math.max(anterior.largura, 1);
          const textoLargura = fonte.widthOfTextAtSize(atual.texto, altura);
          const expansao = Math.min(6, Math.max(0, textoLargura - largura));
          const larguraDisponivel = largura + expansao;
          const tamanho =
            textoLargura > larguraDisponivel
              ? (altura * larguraDisponivel) / textoLargura
              : altura;
          const xTexto =
            anterior.x +
            largura -
            fonte.widthOfTextAtSize(atual.texto, tamanho);
          const y = paginaPdf.getHeight() - anterior.y;
          const sx = Math.max(0, Math.floor(anterior.x * 2));
          const sy = Math.max(0, Math.floor((anterior.y - altura) * 2));
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
            const chave = `${pixels[k]},${pixels[k + 1]},${pixels[k + 2]}`;
            frequencias.set(chave, (frequencias.get(chave) ?? 0) + 1);
          }
          const cor = [...frequencias.entries()]
            .sort((a, b) => b[1] - a[1])[0][0]
            .split(',')
            .map(Number);
          const fundo = rgb(cor[0] / 255, cor[1] / 255, cor[2] / 255);
          const escuro = 0.299 * cor[0] + 0.587 * cor[1] + 0.114 * cor[2] < 150;
          paginaPdf.drawRectangle({
            x: anterior.x - expansao - 0.3,
            y: y - altura * 0.25,
            width: larguraDisponivel + 0.6,
            height: altura * 1.2,
            color: fundo,
          });
          paginaPdf.drawText(atual.texto, {
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
    const comAlteracoes = await documento.save();
    const tarefaFinal = getDocument({
      data: new Uint8Array(comAlteracoes),
      useSystemFonts: true,
    });
    try {
      const documentoRenderizado = await tarefaFinal.promise;
      const resultado = await PDFDocument.create();
      for (let numero = 1; numero <= documentoRenderizado.numPages; numero++) {
        const pagina = await documentoRenderizado.getPage(numero);
        const tamanhoOriginal = pagina.getViewport({ scale: 1 });
        const viewport = pagina.getViewport({ scale: 2 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const contexto = canvas.getContext('2d');
        await pagina.render({
          canvasContext: contexto as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        const imagem = await resultado.embedPng(canvas.toBuffer('image/png'));
        resultado
          .addPage([tamanhoOriginal.width, tamanhoOriginal.height])
          .drawImage(imagem, {
            x: 0,
            y: 0,
            width: tamanhoOriginal.width,
            height: tamanhoOriginal.height,
          });
      }
      return await resultado.save();
    } finally {
      await tarefaFinal.destroy();
    }
  }
}
