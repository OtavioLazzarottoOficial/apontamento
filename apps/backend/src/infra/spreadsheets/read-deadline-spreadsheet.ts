import ExcelJS from 'exceljs';
import { validateSpreadsheetArchive } from './validate-spreadsheet-archive.ts';

export interface DeadlineSpreadsheetRow {
  row: number;
  batch: string;
  deadline: string | null;
  rawDeadline: string;
}

const months: Record<string, string> = {
  jan: '01',
  fev: '02',
  mar: '03',
  abr: '04',
  mai: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  set: '09',
  out: '10',
  nov: '11',
  dez: '12',
};

function parseDate(raw: string, year: number): string | null {
  const text = raw.trim().toLowerCase();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const numeric = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(text);
  const named =
    /^(\d{1,2})\/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\/(\d{4}))?$/.exec(
      text,
    );
  let value: string;
  if (iso) value = text;
  else if (numeric)
    value = `${numeric[3] ?? year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`;
  else if (named)
    value = `${named[3] ?? year}-${months[named[2]]}-${named[1].padStart(2, '0')}`;
  else return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

export async function readDeadlineSpreadsheet(file: Buffer, year: number) {
  await validateSpreadsheetArchive(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ExcelJS.Buffer);
  const matches: {
    sheet: ExcelJS.Worksheet;
    row: number;
    batch: number;
    machining: number;
  }[] = [];
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 20000 || sheet.columnCount > 200)
      throw new Error('Planilha excede o limite de linhas ou colunas.');
    sheet.eachRow((row, number) => {
      const headers: { batch: number[]; machining: number[] } = {
        batch: [],
        machining: [],
      };
      row.eachCell((cell, column) => {
        const text = cell.text.trim().toLowerCase();
        if (text === 'lote') headers.batch.push(column);
        if (text === 'usi' || text === 'usinagem')
          headers.machining.push(column);
      });
      if (headers.batch.length === 1 && headers.machining.length === 1)
        matches.push({
          sheet,
          row: number,
          batch: headers.batch[0],
          machining: headers.machining[0],
        });
    });
  }
  if (matches.length !== 1)
    throw new Error(
      'Não foi possível identificar uma única tabela com as colunas Lote e Usi. Confira o formato da planilha.',
    );
  const match = matches[0];
  const rows: DeadlineSpreadsheetRow[] = [];
  const unrecognizedBatches: { row: number; value: string }[] = [];
  for (let index = match.row + 1; index <= match.sheet.rowCount; index++) {
    const row = match.sheet.getRow(index);
    const batch = row.getCell(match.batch).text.trim();
    if (!/^\d+$/.test(batch)) {
      if (/\d/.test(batch))
        unrecognizedBatches.push({ row: index, value: batch });
      continue;
    }
    const cell = row.getCell(match.machining);
    const rawDeadline =
      cell.value instanceof Date
        ? cell.value.toISOString().slice(0, 10)
        : cell.text.trim();
    rows.push({
      row: index,
      batch,
      rawDeadline,
      deadline: parseDate(rawDeadline, year),
    });
  }
  if (rows.length === 0)
    throw new Error('Nenhum lote numérico foi encontrado na tabela.');
  return { sheet: match.sheet.name, rows, unrecognizedBatches };
}
