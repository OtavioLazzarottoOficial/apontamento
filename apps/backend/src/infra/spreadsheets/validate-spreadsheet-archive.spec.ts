import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { validateSpreadsheetArchive } from './validate-spreadsheet-archive.ts';

describe('validação do arquivo Excel compactado', () => {
  it('aceita planilha normal e recusa conteúdo descompactado acima do limite', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Plano');
    sheet.addRow(['Lote', 'Usi']);
    sheet.addRow(['1110', '17/nov']);
    const file = Buffer.from(await workbook.xlsx.writeBuffer());
    await expect(validateSpreadsheetArchive(file)).resolves.toBeUndefined();
    await expect(
      validateSpreadsheetArchive(file, {
        maxEntries: 2000,
        maxExpandedBytes: 50,
      }),
    ).rejects.toThrow('limite');
    await expect(
      validateSpreadsheetArchive(file, {
        maxEntries: 1,
        maxExpandedBytes: 64 * 1024 * 1024,
      }),
    ).rejects.toThrow('limite');
  });
  it('rejeita arquivo que não é um ZIP válido', async () => {
    await expect(
      validateSpreadsheetArchive(Buffer.from('inválido')),
    ).rejects.toThrow('inválido');
  });
});
