import { fromBuffer, type Entry, type ZipFile } from 'yauzl';

const MAX_ENTRIES = 2000;
const MAX_EXPANDED_BYTES = 64 * 1024 * 1024;

/** Valida os dados realmente descompactados antes de carregá-los no ExcelJS. */
export function validateSpreadsheetArchive(
  file: Buffer,
  limits = { maxEntries: MAX_ENTRIES, maxExpandedBytes: MAX_EXPANDED_BYTES },
): Promise<void> {
  return new Promise((resolve, reject) => {
    fromBuffer(
      file,
      { lazyEntries: true, validateEntrySizes: true },
      (error, zip) => {
        if (error || !zip) {
          reject(new Error('Arquivo Excel inválido.'));
          return;
        }
        let finished = false;
        let count = 0;
        let total = 0;
        const fail = (cause: Error) => {
          if (finished) return;
          finished = true;
          zip.close();
          reject(cause);
        };
        const limitError = () =>
          new Error(
            'Planilha excede o limite de tamanho descompactado ou de arquivos internos.',
          );
        zip.on('error', fail);
        zip.on('end', () => {
          if (finished) return;
          finished = true;
          resolve();
        });
        zip.on('entry', (entry: Entry) => {
          count++;
          if (
            count > limits.maxEntries ||
            total + entry.uncompressedSize > limits.maxExpandedBytes
          ) {
            fail(limitError());
            return;
          }
          if (entry.isEncrypted()) {
            fail(new Error('Arquivo Excel criptografado não é suportado.'));
            return;
          }
          zip.openReadStream(entry, (streamError, stream) => {
            if (streamError || !stream) {
              fail(streamError ?? new Error('Arquivo Excel inválido.'));
              return;
            }
            stream.on('error', fail);
            stream.on('data', (chunk: Buffer) => {
              total += chunk.length;
              if (total > limits.maxExpandedBytes) {
                stream.destroy();
                fail(limitError());
              }
            });
            stream.on('end', () => {
              if (!finished) zip.readEntry();
            });
          });
        });
        (zip as ZipFile).readEntry();
      },
    );
  });
}
