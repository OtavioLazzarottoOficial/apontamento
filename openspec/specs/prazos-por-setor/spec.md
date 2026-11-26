# Comparação de prazos por setor

## Objetivo

Em uma implementação futura, comparar o sequenciamento importado do PDF com uma planilha Excel que informa as datas em que cada lote deve sair de cada setor. O supervisor precisa identificar itens planejados depois do prazo definido para o setor.

A primeira versão da comparação foi implementada para arquivos .xlsx com uma única tabela reconhecida. O formato real ainda precisa ser validado com a planilha do usuário; regras e formatos não informados devem ser confirmados antes da ampliação.

As fotos fornecidas mostram uma planilha impressa organizada por semanas, com produtos, lotes e colunas de setores como Pré-Corte, Usi, Lix e Mont. O usuário confirmou que as datas nesses setores representam o prazo de saída de **todas as peças do lote** do respectivo setor. Uma indicação “ok” aparece na planilha, mas seu significado operacional ainda deve ser confirmado.

## Requisitos

### Requirement: Usar os prazos da planilha

O sistema DEVE permitir utilizar os prazos de lote e setor presentes na planilha de planejamento para comparar com as ordens do sequenciamento. O usuário confirmou que a correspondência deve ser por lote e setor. O formato da planilha, sua importação e a forma de identificar registros ainda precisam ser definidos com base em um arquivo de exemplo.

#### Scenario: Encontrar o prazo aplicável

- **DADO** um sequenciamento e uma planilha com identificação de programação, lote, setor e prazo
- **QUANDO** houver correspondência inequívoca entre o item sequenciado e o prazo do setor
- **ENTÃO** o sistema deve utilizar a data correspondente para a comparação.

### Requirement: Avaliar o prazo do lote no setor

O sistema DEVE considerar a data da planilha como prazo para a última peça do lote sair do setor, e não como uma data obrigatória para todas as peças ou máquinas. Peças do mesmo lote podem ser processadas em dias diferentes e em máquinas diferentes, desde que a última peça saia do setor até o prazo correspondente. A confirmação de atendimento exige dados suficientes de todas as operações relevantes; uma única máquina dentro do prazo não comprova que o lote inteiro cumprirá o prazo.

#### Scenario: Processamento em dias e máquinas diferentes

- **DADO** um lote cujo prazo de saída da usinagem é dia 17
- **E** suas peças passam por máquinas nos dias 15, 16 e 17
- **QUANDO** a última peça estiver prevista para sair do setor no dia 17
- **ENTÃO** essas datas não devem ser consideradas atrasadas apenas por serem diferentes entre si ou anteriores ao prazo.

#### Scenario: Última peça depois do prazo

- **DADO** o prazo de saída do lote do setor no dia 17
- **E** uma peça ou operação necessária estiver prevista para terminar no dia 18
- **QUANDO** a correspondência, as datas e a conclusão dessa operação no setor forem identificadas com segurança
- **ENTÃO** o sistema deve sinalizar o possível atraso e identificar a operação e o prazo envolvidos.

#### Scenario: Dados incompletos

- **DADO** que faltam sequenciamentos ou informações de máquinas ou operações necessárias para avaliar o lote completo
- **QUANDO** o sistema verificar o prazo do setor
- **ENTÃO** deve informar que a avaliação do lote está incompleta, sem afirmar que todas as peças cumprirão o prazo.

### Requirement: Avisar sobre programação após o prazo

O sistema DEVE informar quando a data relevante de uma ordem no sequenciamento for posterior à data limite aplicável ao lote e setor. O usuário confirmou que a data de entrega do PDF deve ser utilizada como a data relevante da operação para essa comparação.

#### Scenario: Item após a data limite

- **DADO** o lote 1110, programação 01/11/2026, com prazo de saída do centro de usinagem no dia 26 do mês aplicável
- **E** um item correspondente do lote com data relevante no dia 27 do mesmo mês
- **QUANDO** essas datas forem comparadas
- **ENTÃO** o sistema deve sinalizar o item como posterior ao prazo, identificando lote, setor e datas utilizadas.

#### Scenario: Item dentro do prazo

- **DADO** um item com data relevante igual ou anterior à data limite aplicável
- **QUANDO** as datas forem comparadas
- **ENTÃO** o sistema não deve classificá-lo como posterior ao prazo.

#### Scenario: Prazo não identificado

- **DADO** um item sem correspondência inequívoca na planilha
- **QUANDO** a comparação for executada
- **ENTÃO** o sistema deve informar que o prazo não pôde ser verificado, sem indicar que está dentro ou fora do prazo.

## Questões em aberto

1. As fotos mostram a estrutura impressa, mas qual é o formato real do arquivo Excel: abas, colunas, tipos de data, identificação de programação, lote, produto e setores? É necessário um arquivo de exemplo.
2. A correspondência é por lote e setor, conforme confirmado. Como distinguir prazos duplicados para o mesmo lote e setor? Até que a regra seja definida, a comparação deve indicar ambiguidade.
3. A data de entrega do PDF foi confirmada para a comparação. Ainda é necessário definir como verificar a cobertura de todas as operações e se existe necessidade de calcular outros prazos a partir da duração e capacidade diária.
4. O mês e o ano do prazo constam da planilha? Como tratar datas ausentes, ambíguas ou inválidas?
5. O usuário confirmou que todas as máquinas atuais são da usinagem. Como identificar quais operações e sequenciamentos são necessários para confirmar a saída da última peça do lote, e como representar setores de futuras máquinas?
6. O usuário prefere aguardar o arquivo Excel em vez de cadastrar prazos manualmente. A importação será manual, periódica ou vinculada a uma origem compartilhada? Como lidar com versões e alterações posteriores?
7. O alerta deve impedir a aprovação ou servir apenas como informação? Que tratamento dar a lotes e itens sem prazo?

## Referências

- [Validação de sequenciamento e capacidade](../validacao-sequenciamento/spec.md)
- [Definição anterior do projeto](../../../docs/project-definition.md)

## Registro de andamento

- **2026-11-24 10:21 (America/Sao_Paulo) — Adiado:** o usuário informou que ainda não possui a planilha de referência e solicitou deixar a comparação para uma implementação futura. Nenhuma comparação foi implementada.


- **2026-11-25 23:09 (America/Sao_Paulo) — Regra esclarecida:** o usuário apresentou fotos da planilha e confirmou que a data em cada setor é o prazo para a saída da última peça do lote. Peças e máquinas podem ser distribuídas em dias anteriores; a avaliação completa precisa considerar as operações relevantes. A implementação continua futura e depende do arquivo e das regras de correspondência.

- **2026-11-25 23:13 (America/Sao_Paulo) — Implementação parcial:** criada e testada a regra de avaliação para operações já identificadas de um mesmo lote e setor. A regra informa prazo desconhecido, dados incompletos, atraso ou atendimento do prazo quando a lista estiver completa; preserva a identificação das operações atrasadas. Ainda não há importação da planilha, identificação automática das operações, persistência, endpoint nem apresentação na interface. Essas etapas dependem das decisões de correspondência, da data de saída e do formato do arquivo.

- **2026-11-25 23:15 (America/Sao_Paulo) — Regras confirmadas:** correspondência por lote e setor e uso da data de entrega do mapa como data da operação. Implementada e testada a correspondência para dados já identificados, com resultado ambíguo para registros duplicados. Ainda sem importação, persistência, integração ou interface.

- **2026-11-25 23:16 (America/Sao_Paulo) — Regras confirmadas:** todas as máquinas atualmente cadastradas pertencem à usinagem; o usuário prefere aguardar o arquivo Excel em vez de cadastrar prazos manualmente. A regra para futuras máquinas e setores permanece pendente.


- **2026-11-25 23:29 (America/Sao_Paulo) — Implementação inicial:** análise temporária de arquivo .xlsx com uma única tabela contendo cabeçalhos Lote e Usi/Usinagem; o usuário informa o ano para datas abreviadas. A interface compara a data de entrega por lote com os relatórios existentes e sinaliza possíveis atrasos, duplicidades e dados não identificados. As máquinas atuais são tratadas como usinagem; relatórios sem máquina ficam indeterminados. A ausência de atraso não confirma a conclusão do lote: a cobertura de todas as operações não é conhecida. Não há armazenamento da planilha ou dos resultados. Testes usam planilhas sintéticas; o formato real, datas, fórmulas e colunas ainda precisam ser verificados com o arquivo fornecido pelo usuário.

- **2026-11-25 23:44 (America/Sao_Paulo) — Proteção da importação:** a planilha é verificada antes da leitura pelo ExcelJS, com limite de 2.000 arquivos internos e 64 MiB de dados descompactados, além do limite de 10 MiB para o envio. As dependências indiretas Effect e UUID foram atualizadas por substituições restritas; a auditoria npm não apontou vulnerabilidades conhecidas na verificação.

