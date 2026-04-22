# FarmaCheck - Portfolio Snapshot

Aplicativo mobile para controle de validade e estoque farmacêutico, desenvolvido com foco em operacao real, rastreabilidade e qualidade de software.

## Problema Resolvido

Farmacias perdem margem e produtividade por falhas em controle de validade, registros manuais inconsistentes e pouca visibilidade de risco.

## Solucao Entregue

- ✅ fluxo de inventário mobile com leitura de código de barras
- ✅ cadastro padronizado com regras de negócio robustas
- ✅ classificação automática de risco por vencimento
- ✅ relatórios em planilha para ação operacional imediata
- ✅ operação offline-first com persistência local
- ✅ **Service Layer profissional com validações centralizadas**
- ✅ **Auditoria completa com logs de todas as operações**
- ✅ **Arquitetura limpa em camadas (Domain, Application, Shared)**

## Diferenciais Técnicos

### Arquitetura Modular em Camadas
- **Domain Layer**: Modelos de negócio e tipos TypeScript rigorosos
- **Application Layer**: Services com regras de negócio + Repositories otimizados
- **Shared Layer**: Utilitários, validações e constantes compartilhadas

### Service Layer Profissional
- Centralização de regras críticas de negócio
- Validações robustas: nome obrigatório, código único, quantidade ≥ 0, validade futura
- Tratamento de erros estruturado com Result pattern
- Auditoria automática: logs para CREATE, UPDATE, DELETE

### Repository Pattern Aprimorado
- Consultas otimizadas: `findExpiringSoon()`, `findLowStock()`, `findPendingSync()`
- Campos de sincronização: `sync_status`, `updated_at` para cloud-ready
- Operações seguras com tratamento de concorrência

### Sistema de Sincronização Offline-First
- **Sync Service Profissional**: Gerenciamento completo do estado de sincronização
- **Fake API Simulation**: Simulação realista de servidor com delays e validações
- **Retry Logic**: Estratégia robusta de tentativas com backoff exponencial
- **State Management**: Estados bem definidos (idle, syncing, success, error)
- **Background Sync**: Sincronização automática baseada em conectividade
- **Error Handling**: Tratamento consistente de falhas de rede

### Qualidade de Código
- TypeScript rigoroso em todas as camadas
- Separação clara de responsabilidades
- Código testável e manutenível
- Documentação técnica completa

## Funcionalidades-Chave

- ✅ listar produtos vencidos
- ✅ listar produtos próximos do vencimento (janela configurável, padrão 7 dias)
- ✅ listar itens com estoque baixo (limite configurável, padrão 5)
- ✅ filtros por colaborador, status, unidade, embalagem e busca textual
- ✅ exportação XLSX com abas operacionais (todos, vencidos, próximos, estoque baixo)
- ✅ **Service Layer com validações de negócio robustas**
- ✅ **Auditoria automática de todas as operações**
- ✅ **Campos de sincronização para futura integração cloud**

## Melhorias Recentes (2026)

### Evolução Arquitetural
- **De CRUD simples para arquitetura profissional**: Implementação completa de Service Layer
- **Auditoria robusta**: Tabela `logs` com rastreamento de todas as operações
- **Sincronização preparada**: Campos `sync_status` e `updated_at` para cloud
- **Consultas inteligentes**: `findExpiringSoon()` e `findLowStock()` otimizadas

### Qualidade de Engenharia
- **TypeScript rigoroso**: Tipagem forte em todas as camadas
- **Tratamento de erros profissional**: Result pattern consistente
- **Separação de responsabilidades**: Repository para dados, Service para regras
- **Código manutenível**: Estrutura modular e bem documentada

## Stack

- React Native + Expo
- TypeScript
- SQLite (offline-first)
- Jest
- i18next
- ExcelJS

## Resultado para Negocio

- ✅ maior previsibilidade de risco de perda por vencimento
- ✅ melhor rastreabilidade de alterações de estoque
- ✅ redução de retrabalho no fechamento de turno
- ✅ base pronta para evolução para sincronização cloud
- ✅ **arquitetura profissional escalável e manutenível**
- ✅ **auditoria completa para compliance e rastreabilidade**
- ✅ **validações robustas que previnem erros operacionais**

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
