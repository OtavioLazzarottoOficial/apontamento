# Apontamento

Sistema em desenvolvimento para importar e trabalhar com mapas de sequenciamento em PDF. A versão atual permite login, cadastro de usuários e administração de permissões, importação do modelo de referência, listagem, prévia das páginas e edição de parte dos campos. Os resumos por data e lote são recalculados no armazenamento.

**Ainda em desenvolvimento:** edição de data e lote com reorganização dos grupos, cálculo do resumo da serraria e edição dos demais campos. A exportação está bloqueada até a regra da serraria ser definida e implementada. O gerador experimental de PDF usa imagens das páginas e não produz texto selecionável. A identificação foi validada para o PDF de exemplo; outros layouts podem não ser reconhecidos. PDFs sem texto selecionável não são suportados.

## Requisitos e execução

Node.js 24.15 ou superior, npm e Docker com Compose. Na raiz:

```powershell
npm install
npm run db:up
npm run prisma:deploy -w @repo/backend
```

Antes do primeiro acesso, crie o administrador em um terminal local. Não digite senhas no histórico de comandos: use a leitura protegida abaixo. A senha deve ter ao menos 8 caracteres e no máximo 72 bytes UTF-8.

```powershell
$env:APONTAMENTO_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$senhaProtegida = Read-Host 'Senha inicial' -AsSecureString
$ponteiroSenha = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaProtegida)
try {
  $env:APONTAMENTO_ADMIN_SENHA = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ponteiroSenha)
  npm run admin:init -w @repo/backend
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ponteiroSenha)
  Remove-Item Env:APONTAMENTO_ADMIN_SENHA -ErrorAction SilentlyContinue
  Remove-Item Env:APONTAMENTO_ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Variable senhaProtegida, ponteiroSenha -ErrorAction SilentlyContinue
}
```

O comando só cria a conta quando não existe outro administrador. Depois inicie `npm run dev` na raiz e abra o endereço informado pelo Vite; o padrão é http://localhost:5173, com API na porta 3000. As origens permitidas são configuradas em `apps/backend/.env`; se a porta do frontend mudar, atualize `CORS_ORIGINS`. A URL da API é configurada em `apps/frontend/.env`.

Para parar o banco local sem apagar o volume, execute `npm run db:stop`. Não use dados de produção nesta instalação de desenvolvimento.

[Definição do projeto](docs/project-definition.md) · [Plano de implementação](docs/implementation-plan.md) · [Exemplos HTTP](apps/backend/requests.http)



