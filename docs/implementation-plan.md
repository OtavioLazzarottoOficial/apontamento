# Plano de implementação

## Próxima entrega

Importar, editar e exportar mapas de sequenciamento com acesso individual, dados compartilhados e os cálculos definidos em [project-definition.md](project-definition.md).

## Tarefas

- **T-001 — Base fullstack:** monorepo NestJS/DDD, React e shared. **Em andamento:** base compilada e testes executados; revisão final e verificação de inicialização em ambiente de destino pendentes.
- **T-002 — Definir regras pendentes:** identificação dos materiais e bitolas e cálculo do resumo da serraria. **Pendente de informação do usuário.**
- **T-003 — Acesso individual:** login, primeiro administrador local, cadastro e permissões independentes. **Em andamento:** implementados e testados; revisão integrada final pendente.
- **T-004 — Importação e persistência:** leitura do PDF do modelo, extração de páginas e linhas, armazenamento compartilhado e controle de versão. **Em andamento:** implementados e testados com o arquivo de referência e PostgreSQL local; variantes de layout não validadas.
- **T-005 — Edição e cálculos:** **Em andamento.** OP, produto, componente, dimensões, quantidades e tempos têm edição inicial. Saldo, área, tempos e resumos para os grupos existentes são recalculados. Faltam data e lote com reorganização dos grupos, demais campos e resumo da serraria (T-002).
- **T-006 — Exportação:** gerador experimental preserva visual e foi inspecionado no exemplo; o PDF é rasterizado, sem texto selecionável. **Bloqueada até T-002 e T-005:** a rota impede exportação para não produzir resumo da serraria incorreto.

## Verificação

Testes unitários, HTTP e fluxo com PostgreSQL local foram executados durante a implementação. Executar novamente as verificações finais depois das alterações pendentes. As regras confirmadas de quantidade inteira, saldo, tempo com setup, área e controle de conflito estão registradas na definição.
