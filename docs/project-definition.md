# Definição do projeto

## Contexto e objetivo

Sistema para transformar mapas de sequenciamento em PDF, como o arquivo de exemplo desta pasta, em relatórios editáveis e compartilhados. O público trabalha com programação de produção; os papéis específicos ainda serão definidos.

## Primeira entrega

Importar um PDF do tipo apresentado, exibir suas páginas com campos editáveis, recalcular os valores definidos e exportar o resultado em PDF. Relatórios serão compartilhados entre vários usuários com acesso individual.

## Glossário

- **Mapa de sequenciamento:** relatório de ordens, componentes, quantidades, tempos e resumos de produção.
- **Necessária, realizada e saldo:** quantidades exibidas no mapa; saldo corresponde à diferença entre necessária e realizada.
- **Tempo para uma peça:** duração unitária indicada na linha do relatório.

## Requisitos funcionais

- **RF-001 (confirmado):** importar PDF do tipo apresentado e identificar suas páginas e campos. CA-001.
- **RF-002 (confirmado):** apresentar o relatório em páginas semelhantes às do PDF e permitir edição dos campos. CA-002.
- **RF-003 (confirmado):** recalcular saldo e tempo de produção ao alterar os campos de origem, e atualizar totais relacionados. RN-001, RN-002; CA-003.
- **RF-004 (confirmado):** salvar e compartilhar relatórios entre usuários. CA-004.
- **RF-005 (confirmado):** exportar o relatório editado em PDF. CA-005.
- **RF-006 (confirmado):** permitir acesso individual mediante login; permissões específicas em aberto. CA-004.

## Regras de negócio

- **RN-001:** saldo de quantidade = quantidade necessária − quantidade realizada.
- **RN-002:** tempo de produção = quantidade necessária × tempo para uma peça + tempo de setup.
- Os totais de cada resumo são a soma das linhas correspondentes. Quantidades são inteiras e a realizada não pode superar a necessária. Tratamento de arredondamento de outros valores e significado dos demais campos dependem de confirmação.

## Requisitos não funcionais

- **RNF-001 (confirmado):** dados compartilhados por vários usuários, preservados entre acessos.
- **RNF-002 (confirmado):** acesso individual autenticado.
- **RNF-003 (padrão solicitado):** base fullstack conforme skills locais: NestJS/DDD, PostgreSQL/Prisma e React/shadcn/TanStack Router.
- Volume, disponibilidade, segurança operacional e formatos adicionais ainda não definidos.

## Critérios de aceitação

- **CA-001:** ao importar o PDF fornecido, o sistema identifica as cinco páginas e apresenta seus dados sem perder linhas ou resumos.
- **CA-002:** usuário consegue alterar campos e visualizar os dados editados em páginas semelhantes ao documento de origem.
- **CA-003:** alterar necessária, realizada ou tempo unitário atualiza saldo e tempo conforme RN-001 e RN-002; totais são atualizados conforme regras que ainda serão confirmadas.
- **CA-004:** usuários identificados conseguem acessar os relatórios compartilhados e recuperar alterações salvas; permissões dependem de definição.
- **CA-005:** relatório editado pode ser exportado em PDF com as alterações visíveis.

## Decisões e questões em aberto

Confirmadas pelo usuário: compartilhamento, acesso individual, fórmulas RN-001 e RN-002 (RN-002 atualizada posteriormente para incluir setup) e exportação na primeira entrega. A escolha das skills de desenvolvimento orienta a base técnica.

Pendentes para implementação: detalhes da administração de contas e permissões, arredondamentos, significado dos demais campos, fidelidade visual esperada e tratamento de caracteres com extração defeituosa no PDF de exemplo. Nenhuma dessas questões autoriza criar regras por inferência.

### Decisões adicionais confirmadas

- Um administrador cadastra os usuários e autoriza quem pode editar e exportar relatórios. As permissões podem ser alteradas posteriormente pelo administrador.
- A primeira entrega contempla PDFs com texto selecionável; OCR para PDFs digitalizados está fora do escopo inicial.

- Totais de cada resumo: somar os valores das linhas correspondentes, conforme confirmado pelo usuário.
- Todos os usuários autenticados podem visualizar os relatórios compartilhados; somente usuários autorizados pelo administrador podem editá-los e exportá-los.
- Edições simultâneas: detectar conflito, avisar o usuário e impedir que uma alteração sobrescreva outra.

- Login individual com e-mail e senha; o primeiro administrador será criado por comando local.
- Todos os campos do relatório podem ser editados, exceto totais calculados.
- O administrador concede permissões de edição e de exportação separadamente.
- Senhas devem ter ao menos oito caracteres; o administrador define a senha inicial do usuário.

- Quantidade realizada não pode superar a necessária; quantidades são números inteiros.
- Tempo de produção inclui o tempo de setup somado ao tempo das peças; esta decisão atualiza a fórmula anterior.

- Ao alterar data ou lote, os resumos devem acompanhar os novos grupos.
- O m² de cada linha é comprimento × largura × quantidade; comprimento e largura estão em milímetros e o resultado é arredondado para duas casas decimais.
- O resumo da serraria deve ser recalculado; o usuário ainda fornecerá a regra de identificação e cálculo dos materiais e bitolas.

