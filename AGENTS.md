# Orientações de verificação

- Não abra o navegador nem execute verificações visuais ou interativas do frontend. O usuário faz essa validação pessoalmente.
- Verifique a compilação e a execução local do projeto, incluindo os serviços necessários, conforme apropriado para a alteração.
- Informe ao usuário o resultado dessas verificações e deixe explícito quando a validação visual depender dele.

# Convenções de desenvolvimento

- Use inglês para nomes de pastas, arquivos, entidades, propriedades, funções, classes, variáveis, testes e scripts técnicos. Use kebab-case para arquivos próprios.
- Preserve o português nos textos exibidos aos usuários e na documentação de negócio quando adequado.
- Trate contratos HTTP, dados persistidos e nomes de tabelas existentes como compatibilidade: não os altere silenciosamente ao traduzir identificadores internos; use adaptadores ou uma migração explícita e testada.
- Entidades e regras de negócio pertencem ao domínio; interpretação de PDF, posições de página, Prisma e HTTP pertencem à infraestrutura. A aplicação depende de contratos, não de implementações concretas.

# Especificação do produto

- Antes de planejar ou alterar funcionalidades, consulte as especificações aplicáveis em [validação de sequenciamento](openspec/specs/validacao-sequenciamento/spec.md) e [prazos por setor](openspec/specs/prazos-por-setor/spec.md), além dos documentos de referência relevantes.
- Preserve as regras confirmadas, identifique conflitos e mantenha explícitas as questões pendentes. Não implemente regras de negócio ainda não definidas por suposição.
- Quando uma mudança aprovada alterar o comportamento ou as regras do produto, atualize a especificação pertinente junto com a implementação.
- Registre em cada especificação a data, a hora e o fuso das implementações concluídas e das alterações de situação; indique separadamente o que permanece pendente.
