# Validação de sequenciamento

## Objetivo

A Renar Móveis recebe de outro sistema um PDF com o sequenciamento da produção. Este sistema deve permitir que o supervisor importe esse documento, consulte as ordens organizadas por data e avalie se o planejamento da máquina é viável antes da execução. A análise envolve ordens de produção, quantidades, tempo por peça, tempo total de produção e setups.

Esta especificação registra a intenção do produto e as regras informadas até o momento. Requisitos futuros não significam que a funcionalidade já esteja implementada. Quando houver dúvida ou conflito com uma regra anterior, não inventar uma regra: registrar a divergência e confirmar com o usuário antes de implementar o cálculo afetado.

## Termos

- **Sequenciamento:** planejamento das ordens de produção de uma máquina, recebido em PDF.
- **Ordem de produção (OP):** item do planejamento com produto ou componente, quantidades e tempos associados.
- **Tempo por peça:** tempo unitário informado para produzir uma peça.
- **Setup:** tempo necessário para preparação ou troca entre operações, conforme informado no sequenciamento.
- **Capacidade efetiva diária:** tempo de referência para avaliar o planejamento, após a aplicação do percentual de eficiência definido.
- **Conclusão:** marcação de acompanhamento de uma ordem. Atualmente não altera automaticamente suas quantidades ou os totais.

## Requisitos

### Requirement: Importar o sequenciamento

O sistema DEVE permitir importar o PDF recebido do sistema externo e identificar as ordens e seus dados para análise. Na primeira entrega, o modelo de referência contém texto selecionável; a aceitação de outros layouts ou PDFs digitalizados depende de validação e definição adicionais.

#### Scenario: Importação do modelo reconhecido

- **DADO** um PDF compatível com o modelo reconhecido
- **QUANDO** o supervisor importar o documento
- **ENTÃO** o sistema deve apresentar as ordens identificadas e seus dados para conferência.

### Requirement: Conferir o PDF original

O usuário autenticado DEVE poder visualizar o PDF originalmente enviado junto ao mapa de sequenciamento, para comparar as informações. O documento original não incorpora edições feitas no sistema. Quando o arquivo original não estiver disponível, a interface deve informar essa condição.

### Requirement: Localizar e remover relatórios compartilhados

O usuário DEVE poder buscar relatórios pelo nome e filtrá-los por máquina, mês e dia das datas de entrega presentes nas ordens. A listagem deve dividir resultados em páginas e manter relatórios sem máquina acessíveis. Usuários autorizados a editar podem remover um relatório compartilhado após confirmação explícita; a remoção inclui o PDF original e as alterações e afeta todos os usuários. O sistema deve rejeitar a remoção quando a versão mudou desde a listagem.

Na visão geral, as datas disponíveis devem ser selecionadas por mês e dia, mantendo a escolha de relatório para máquinas com sequenciamentos sobrepostos.

### Requirement: Organizar sequenciamentos por máquina

Usuários autenticados podem consultar as máquinas e usuários com permissão de edição podem cadastrá-las e alterá-las pelo nome. Para importar, o usuário seleciona primeiro uma máquina cadastrada e depois o PDF a vincular. Também é possível vincular relatórios existentes, respeitando o controle de versão.

Usuários com permissão de edição podem desvincular um relatório da máquina sem excluir o relatório ou o PDF; o relatório continua acessível na lista compartilhada para ser vinculado novamente. A alteração é compartilhada e respeita o controle de versão. Também é possível limpar o arquivo escolhido antes da importação.

### Requirement: Consultar a área do setor por data

O sistema DEVE mostrar a soma das áreas planejadas das máquinas por data de entrega. Quando uma máquina tiver vários sequenciamentos para a data, o usuário escolhe qual utilizar; os documentos não são somados automaticamente. Se alguma máquina não tiver sequenciamento para a data ou aguardar seleção, o sistema deve indicar que o total está incompleto. As áreas incluem ordens concluídas, conforme a regra vigente do mapa.

### Requirement: Organizar a conferência por data

O sistema DEVE organizar as ordens pela data de entrega identificada no PDF e permitir navegar entre os dias. O mapa deve apresentar somente as ordens da data selecionada, em uma tabela semelhante à do PDF, mantendo editáveis os campos autorizados e disponíveis os indicadores e a marcação de conclusão. Não é necessário reproduzir exatamente as cores ou mostrar a página inteira do PDF.

#### Scenario: Navegação entre dias

- **DADO** um sequenciamento com ordens em datas diferentes
- **QUANDO** o supervisor selecionar um dia
- **ENTÃO** o sistema deve apresentar as ordens correspondentes àquela data e permitir a navegação para as outras datas.

### Requirement: Conferir ordens, quantidades e tempos

O sistema DEVE apresentar, para cada ordem reconhecida, as informações necessárias para verificar produto ou componente, OP, quantidade, tempo por peça, setup e tempo de produção. Campos cuja edição esteja autorizada devem poder ser corrigidos, e os totais derivados devem acompanhar as regras já definidas.

#### Scenario: Correção de valores

- **DADO** um usuário com permissão de edição e uma ordem importada
- **QUANDO** ele corrigir uma quantidade ou tempo permitido e salvar
- **ENTÃO** o sistema deve preservar a alteração e atualizar os cálculos aplicáveis, respeitando o controle de versão.

### Requirement: Consultar a área planejada por dia

O mapa de sequenciamento DEVE apresentar a área total planejada em metros quadrados para a data selecionada, somando a área das linhas dessa data, inclusive as marcadas como concluídas. O total acompanha as alterações salvas nas linhas e é apresentado com duas casas decimais.

#### Scenario: Soma da área do dia

- **DADO** um dia com quatro ordens cujas áreas somam 40 m²
- **QUANDO** o supervisor selecionar esse dia no mapa
- **ENTÃO** o total exibido deve ser 40,00 m², sem incluir ordens de outras datas.

### Requirement: Acompanhar a conclusão de uma ordem

O sistema DEVE permitir que um usuário autorizado marque uma ordem como concluída e reverta essa marcação. A ordem concluída deve permanecer identificável na visualização.

#### Scenario: Marcar e reabrir

- **DADO** uma ordem de um relatório compartilhado
- **QUANDO** um usuário autorizado marcá-la como concluída ou reabri-la
- **ENTÃO** o status deve ser salvo e ficar disponível aos demais usuários com acesso.
- **E** essa marcação, por si só, não deve alterar a quantidade realizada, o saldo ou os totais.

### Requirement: Avaliar capacidade e setups

O sistema DEVE comparar a carga diária planejada da máquina com a capacidade efetiva diária. A carga compreende a soma do tempo de produção das peças e dos tempos de setup das ordens do dia. O setup faz parte da carga comparada ao limite de eficiência; não deve ser descontado novamente da capacidade. Quando a carga ultrapassar o limite, o sistema deve informar que o sequenciamento excede a capacidade. O planejamento cujo total seja exatamente igual ao limite não o excede.

O sistema também deve permitir a análise do tempo de setup; o critério para um alerta específico de excesso de setup ainda precisa ser definido. A marcação de conclusão, por si só, continua sem alterar quantidades ou totais. Quais ordens compõem a carga utilizada para cada tipo de análise ainda deve ser confirmado.

#### Scenario: Capacidade com a jornada base confirmada

- **DADO** que a jornada base diária confirmada é de 8 horas e 48 minutos (8,8 horas)
- **QUANDO** a eficiência configurada for de 80%
- **ENTÃO** a capacidade efetiva será de 7 horas, 2 minutos e 24 segundos.
- **E** se a eficiência configurada for de 85%, a capacidade efetiva será de 7 horas, 28 minutos e 48 segundos.

O usuário confirmou 8h48 como base, apesar de os horários e intervalos informados resultarem aritmeticamente em 8h38. Usar a base confirmada para o cálculo; não substituí-la automaticamente pela diferença entre horários.

#### Scenario: Carga acima da capacidade

- **DADO** um dia com capacidade efetiva de 7 horas, 2 minutos e 24 segundos
- **E** uma carga planejada de peças de 6 horas e 40 minutos e setups que somam 30 minutos
- **QUANDO** o sistema comparar a carga total de 7 horas e 10 minutos com a capacidade
- **ENTÃO** deve informar que a carga ultrapassa o limite em 7 minutos e 36 segundos.

### Requirement: Configurar a eficiência

O sistema DEVE permitir que um administrador altere o percentual de eficiência utilizado no cálculo da capacidade, por exemplo de 80% para 85%. A configuração deve ser persistida e respeitar o controle de acesso. A eficiência padrão é 80%. O usuário confirmou uma configuração global para todos os usuários, máquinas e relatórios, inclusive os existentes. Nesta implementação, o percentual é inteiro entre 1 e 100.

#### Scenario: Alterar o percentual

- **DADO** um administrador autorizado e uma jornada líquida já definida
- **QUANDO** ele alterar a eficiência de 80% para 85% e salvar
- **ENTÃO** as avaliações às quais a configuração se aplicar devem usar 85% da jornada líquida como capacidade efetiva.
- **E** o tempo das peças somado ao setup deve ser comparado com esse limite.

## Valores e regras informados

- Entrada às 07h10 e saída às 16h58; almoço das 11h às 12h e descanso das 15h às 15h10. A jornada base confirmada pelo usuário para o cálculo é 8h48 (8,8 horas), independentemente da diferença aritmética entre esses horários e intervalos.
- Eficiência inicial de referência: 80%, com possibilidade de alteração pelo administrador.
- A parcela da jornada fora da capacidade efetiva é uma margem para perdas e interrupções. Para avaliar a carga planejada, o setup informado no relatório entra junto com o tempo das peças dentro do limite de capacidade; não descontá-lo novamente.
- Fórmula atualmente definida por linha: quantidade necessária × tempo por peça + tempo de setup. Saldo = quantidade necessária − quantidade realizada.
- Os totais de um agrupamento somam os valores das linhas correspondentes. Marcar uma linha como concluída não a exclui dos totais atuais.

## Questões em aberto

1. Qual é o limite específico de setup excessivo: duração por ordem, soma diária, porcentagem da jornada ou outro critério? Qual alerta deve aparecer ao excedê-lo?
2. Na comparação com a capacidade, considerar quantidade necessária ou saldo ainda não produzido? Ordens concluídas participam da carga planejada ou da carga restante?
3. A jornada e a eficiência são globais ou configuráveis por máquina, setor e dia? Como tratar paradas planejadas, horas extras e jornadas diferentes? Mudanças de eficiência devem afetar análises anteriores?
4. Quais limites e precisão são permitidos para o percentual de eficiência e como lidar com arredondamento?
5. O supervisor apenas consulta e corrige o plano ou também precisa aprová-lo formalmente, com registro de responsável e data?
6. Permanecem pendentes as regras de identificação de materiais e bitolas e de cálculo do resumo da serraria, necessárias para liberar a exportação existente.

## Referências

- [Definição de projeto e regras anteriores](../../../docs/project-definition.md)
- [Plano de implementação e situação das funcionalidades](../../../docs/implementation-plan.md)
- [Comparação futura com prazos da planilha](../prazos-por-setor/spec.md)

## Registro de implementação

- **2026-11-24 22:10 (America/Sao_Paulo) — Implementado:** associação na importação passou a exigir seleção manual de máquina, seguida da escolha do PDF; cadastro de máquina disponível apenas com nome. Essa decisão substitui a identificação automática anterior.
- **2026-11-24 22:07 (America/Sao_Paulo) — Implementado:** limpeza do PDF selecionado antes de importar, desvinculação do relatório pela visão geral ou pelo relatório aberto e acesso direto à exclusão permanente no relatório. Validação visual depende do usuário.
- **2026-11-24 22:02 (America/Sao_Paulo) — Implementado:** substituída a imagem da página do PDF por uma tabela editável gerada pelo sistema, com as colunas do modelo e apenas as ordens da data escolhida. A visualização separada do PDF original continua disponível. Validação visual depende do usuário.
- **2026-11-24 21:55 (America/Sao_Paulo) — Implementado:** mapa exibe as páginas renderizadas a partir do PDF, incluindo cores, com campos editáveis posicionados sobre elas; resumo por data e acompanhamento de conclusão continuam disponíveis. O resumo da serraria mantém os valores do documento original, pois o recálculo permanece pendente. Validação visual depende do usuário.
- **2026-11-24 21:46 (America/Sao_Paulo) — Implementado:** filtros de relatórios por nome, máquina, mês e dia de entrega, paginação e remoção permanente com confirmação, permissão de edição e controle de versão. A visão geral seleciona mês e dia e usa resumos por relatório, sem baixar todos os documentos. Validação visual depende do usuário.
- **2026-11-24 21:38 (America/Sao_Paulo) — Implementado:** visualização autenticada do PDF original ao lado do mapa; o arquivo enviado permanece inalterado pelas edições no sistema. Conferência automatizada das 24 ordens e respectivas datas no PDF de referência; outros PDFs e a validação visual permanecem pendentes.
- **2026-11-24 21:29 (America/Sao_Paulo) — Implementado:** cadastro e edição de máquinas, associação automática pelo título do PDF ou seleção manual, vínculo de relatórios existentes e visão da área planejada por data. Seleções de relatórios sobrepostos são locais à visualização; não são persistidas. Identificação automática verificada no PDF de referência; outros modelos precisam de validação. Migration testada em PostgreSQL isolado; validação visual depende do usuário.
- **2026-11-24 21:18 (America/Sao_Paulo) — Implementado:** login centralizado sem menu público; navegação autenticada para sequenciamentos e, para administradores, administração de usuários e eficiência. Alternar as seções mantém o relatório aberto durante a sessão; validação visual depende do usuário.
- **2026-11-24 21:13 (America/Sao_Paulo) — Implementado:** área de trabalho ampliada para utilizar a largura disponível da tela, com margens adaptáveis; validação visual depende do usuário. A organização por máquina permanece em definição.
- **2026-11-24 21:05 (America/Sao_Paulo) — Implementado:** área total planejada no mapa por data, somando a área das linhas do dia selecionado, inclusive as concluídas; a apresentação usa duas casas decimais.
- **2026-11-24 10:21 (America/Sao_Paulo) — Implementado:** comparação da capacidade planejada diária com a jornada de 8h48 e eficiência global. A carga é calculada com quantidade necessária × tempo por peça mais setup, usando todas as ordens do dia, inclusive concluídas. O excesso é sinalizado; peças e setup são apresentados separadamente. A análise usa as informações importadas ou editadas, sem alterar os totais persistidos.
- **2026-11-24 10:21 (America/Sao_Paulo) — Implementado:** configuração global persistida de eficiência, acessível a usuários autenticados e alterável apenas por administrador. Padrão de 80%; alterações aplicam-se a todos os relatórios, inclusive existentes. A tela atualiza a configuração periodicamente.
- **2026-11-24 10:21 (America/Sao_Paulo) — Pendente:** limite separado para setup excessivo e regras de carga restante ainda dependem de definição; a funcionalidade de prazos por setor foi explicitamente adiada pelo usuário. A exportação permanece bloqueada pela regra da serraria.

- **2026-11-24 20:08 (America/Sao_Paulo) — Refatoração técnica:** fluxo de configuração de capacidade separado em domínio, casos de uso, contrato e persistência; nomes internos padronizados progressivamente e lógica de apresentação de PDF deslocada para infraestrutura. Contratos HTTP e formato persistido preservados; permanece pendente a separação completa do conteúdo do PDF do modelo de domínio.
