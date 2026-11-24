import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hash } from 'bcryptjs';
import pg from 'pg';
import { z } from 'zod';

loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
let ocultarEntrada = false;
const saida = new Writable({
  write(chunk, _encoding, callback) {
    if (!ocultarEntrada) process.stdout.write(chunk);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output: saida, terminal: true });
async function perguntar(texto) {
  return rl.question(texto);
}
async function perguntarSimNao(pergunta) {
  while (true) {
    const resposta = (await perguntar(`${pergunta} (s/n): `)).trim().toLowerCase();
    if (resposta === 's') return true;
    if (resposta === 'n') return false;
    console.log('Digite s ou n.');
  }
}

async function lerSenha(pergunta) {
  if (!process.stdin.isTTY) throw new Error('Execute o comando em um terminal interativo.');
  process.stdout.write(pergunta);
  ocultarEntrada = true;
  try {
    return await rl.question('');
  } finally {
    ocultarEntrada = false;
    process.stdout.write('\n');
  }
}let pool;
try {
  const email = (await perguntar('E-mail: ')).trim().toLowerCase();
  if (!z.email().safeParse(email).success) throw new Error('E-mail inválido.');
  const senha = await lerSenha('Senha (não será exibida): ');
  if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new Error('A senha deve ter ao menos 8 caracteres e até 72 bytes UTF-8.');
  }
  if (senha !== await lerSenha('Confirme a senha: ')) throw new Error('As senhas não coincidem.');
  const administrador = await perguntarSimNao('Criar o primeiro administrador?');
  const podeEditar = administrador || await perguntarSimNao('Permitir edição?');
  const podeExportar = administrador || await perguntarSimNao('Permitir exportação?');
  const senhaHash = await hash(senha, 12);
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (administrador) {
      await client.query('SELECT pg_advisory_xact_lock($1)', [10270345]);
      const existing = await client.query('SELECT 1 FROM usuarios WHERE papel = $1 LIMIT 1', ['ADMINISTRADOR']);
      if (existing.rowCount) throw new Error('Já existe um administrador; nenhuma conta foi criada.');
    }
    await client.query(
      'INSERT INTO usuarios (id, email, senha_hash, papel, pode_editar, pode_exportar) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), email, senhaHash, administrador ? 'ADMINISTRADOR' : 'USUARIO', podeEditar, podeExportar],
    );
    await client.query('COMMIT');
    console.log('Usuário criado com sucesso.');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new Error('Este e-mail já está cadastrado.');
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao criar usuário.');
  process.exitCode = 1;
} finally {
  rl.close();
  if (pool) await pool.end();
}
