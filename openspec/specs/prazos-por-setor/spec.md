# Comparação de prazos por setor

## Objetivo

Em uma implementação futura, comparar o sequenciamento importado do PDF com uma planilha Excel que informa as datas em que cada lote deve sair de cada setor. O supervisor precisa identificar itens planejados depois do prazo definido para o setor.

Esta especificação registra uma funcionalidade futura; ela ainda não está implementada. Regras e formatos não informados devem ser confirmados antes da implementação.

## Requisitos

### Requirement: Usar os prazos da planilha

O sistema DEVE permitir utilizar os prazos de lote e setor presentes na planilha de planejamento para comparar com as ordens do sequenciamento. O formato da planilha, sua importação e a forma de identificar registros ainda precisam ser definidos com base em um arquivo de exemplo.

#### Scenario: Encontrar o prazo aplicável

- **DADO** um sequenciamento e uma planilha com identificação de programação, lote, setor e prazo
- **QUANDO** houver correspondência inequívoca entre o item sequenciado e o prazo do setor
- **ENTÃO** o sistema deve utilizar a data correspondente para a comparação.

### Requirement: Avisar sobre programação após o prazo

O sistema DEVE informar quando a data relevante de uma ordem no sequenciamento for posterior à data limite aplicável ao lote e setor. Qual data do PDF representa a saída do setor e se ela pode ser comparada diretamente precisam ser confirmados antes da implementação.

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

1. Qual é o formato real da planilha: abas, colunas, datas, identificação de programação, lote, produto e setores? É necessário um arquivo de exemplo.
2. A correspondência é feita por programação e lote, também por produto, OP ou outro identificador? Como tratar duplicidades?
3. Qual campo do PDF representa a data de saída do setor? Há necessidade de calcular a data de conclusão a partir da sequência, da duração e da capacidade diária?
4. O mês e o ano do prazo constam da planilha? Como tratar datas ausentes, ambíguas ou inválidas?
5. Como relacionar máquina e setor, inclusive quando há mais de uma máquina ou etapa no setor?
6. A planilha será importada manualmente, substituída periodicamente ou vinculada a uma origem compartilhada? Como lidar com versões e alterações posteriores?
7. O alerta deve impedir a aprovação ou servir apenas como informação? Que tratamento dar a lotes e itens sem prazo?

## Referências

- [Validação de sequenciamento e capacidade](../validacao-sequenciamento/spec.md)
- [Definição anterior do projeto](../../../docs/project-definition.md)

## Registro de andamento

- **2026-11-24 10:21 (America/Sao_Paulo) — Adiado:** o usuário informou que ainda não possui a planilha de referência e solicitou deixar a comparação para uma implementação futura. Nenhuma comparação foi implementada.

