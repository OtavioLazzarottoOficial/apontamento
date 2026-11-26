import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { readDeadlineSpreadsheet } from './read-deadline-spreadsheet.ts';

describe('leitura de prazos da planilha', () => {
  it('identifica lotes, datas sem ano e informa datas não reconhecidas', async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Novembro');
    sheet.addRow(['Produto', 'Lote', 'Usi']);
    sheet.addRow(['Cama', '1110', '17/nov']);
    sheet.addRow(['Mesa', '1120', 'ok']);
    sheet.addRow(['Mesa', '1130', '18/11/2026']);
    const data = Buffer.from(await book.xlsx.writeBuffer());
    const result = await readDeadlineSpreadsheet(data, 2026);
    expect(result.sheet).toBe('Novembro');
    expect(result.rows).toEqual([
      { row: 2, batch: '1110', deadline: '2026-11-17', rawDeadline: '17/nov' },
      { row: 3, batch: '1120', deadline: null, rawDeadline: 'ok' },
      {
        row: 4,
        batch: '1130',
        deadline: '2026-11-18',
        rawDeadline: '18/11/2026',
      },
    ]);
  });
  it('rejeita tabelas ambíguas', async () => {
    const book = new ExcelJS.Workbook();
    book.addWorksheet('A').addRow(['Lote', 'Usi']);
    book.addWorksheet('B').addRow(['Lote', 'Usi']);
    await expect(
      readDeadlineSpreadsheet(Buffer.from(await book.xlsx.writeBuffer()), 2026),
    ).rejects.toThrow('uma única tabela');
  });
});
