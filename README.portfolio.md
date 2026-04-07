# FarmaCheck - Portfolio Snapshot

Aplicativo mobile para controle de validade e estoque farmacêutico, desenvolvido com foco em operacao real, rastreabilidade e qualidade de software.

## Problema Resolvido

Farmacias perdem margem e produtividade por falhas em controle de validade, registros manuais inconsistentes e pouca visibilidade de risco.

## Solucao Entregue

- fluxo de inventario mobile com leitura de codigo de barras
- cadastro padronizado com regras de negocio robustas
- classificacao automatica de risco por vencimento
- relatorios em planilha para acao operacional imediata
- operacao offline-first com persistencia local

## Diferenciais Tecnicos

- arquitetura modular em camadas (domain, application, shared, app)
- regras de negocio centralizadas em servico de inventario
- camada de compatibilidade para migracao sem quebra de imports
- validacoes criticas implementadas e testadas:
  - bloqueio de cadastro com validade no passado
  - bloqueio de estoque negativo
  - filtros e ordenacao para listas de risco
- testes unitarios cobrindo regras essenciais de inventario

## Funcionalidades-Chave

- listar produtos vencidos
- listar produtos proximos do vencimento (janela configuravel, padrao 30 dias)
- listar itens com estoque baixo (limite configuravel, padrao 5)
- filtros por colaborador, status, unidade, embalagem e busca textual
- exportacao XLSX com abas operacionais (todos, vencidos, proximos, estoque baixo)

## Stack

- React Native + Expo
- TypeScript
- SQLite (offline-first)
- Jest
- i18next
- ExcelJS

## Resultado para Negocio

- maior previsibilidade de risco de perda por vencimento
- melhor rastreabilidade de alteracoes de estoque
- reducao de retrabalho no fechamento de turno
- base pronta para evolucao para sincronizacao cloud

## Papel e Responsabilidades

- refatoracao da arquitetura para padrao profissional
- extracao de logica de negocio da interface
- implementacao de validacoes e consultas de risco
- criacao de testes para regras criticas
- documentacao tecnica e de onboarding

## Proximos Passos

- segmentar a tela principal em componentes menores
- adicionar testes de integracao para importacao/exportacao
- evoluir para API REST mantendo estrategia offline-first
- preparar sincronizacao multi-loja com resolucao de conflitos
