import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { hash } from 'bcryptjs';
import pg from 'pg';
import { z } from 'zod';

loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
const email = process.env.APONTAMENTO_ADMIN_EMAIL?.trim().toLowerCase();
const senha = process.env.APONTAMENTO_ADMIN_SENHA;
if (
  !z.email().safeParse(email).success ||
  !senha ||
  senha.length < 8 ||
  Buffer.byteLength(senha, 'utf8') > 72
) {
  console.error(
    'Informe APONTAMENTO_ADMIN_EMAIL válido e APONTAMENTO_ADMIN_SENHA com ao menos 8 caracteres e até 72 bytes.',
  );
  process.exitCode = 1;
} else {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const senhaHash = await hash(senha, 12);
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [10270345]);
    const existing = await client.query(
      'SELECT 1 FROM usuarios WHERE papel = $1 LIMIT 1',
      ['ADMINISTRADOR'],
    );
    if (existing.rowCount) {
      throw new Error('Já existe um administrador; nenhuma conta foi criada.');
    }
    await client.query(
      'INSERT INTO usuarios (id, email, senha_hash, papel, pode_editar, pode_exportar) VALUES ($1, $2, $3, $4, true, true)',
      [randomUUID(), email, senhaHash, 'ADMINISTRADOR'],
    );
    await client.query('COMMIT');
    console.log('Primeiro administrador criado.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      error instanceof Error ? error.message : 'Falha ao criar administrador.',
    );
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
