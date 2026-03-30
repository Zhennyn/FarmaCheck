# FarmaCheck

FarmaCheck e um aplicativo React Native com foco offline-first para auditoria de validade em farmacias e operacoes de inventario.

Ele ajuda equipes a escanear codigos EAN, registrar lotes de medicamentos, monitorar riscos de vencimento e exportar relatorios acionaveis diretamente no dispositivo movel.

## Problema Que Este Projeto Resolve

Equipes de farmacia frequentemente controlam validade em planilhas ou anotacoes em papel, o que gera atrasos, perda de informacao e desperdicio evitavel.

O FarmaCheck oferece um fluxo pronto para operacao para:
- escanear produtos rapidamente
- manter dados de inventario locais e disponiveis sem internet
- identificar produtos de alto risco por janela de vencimento
- exportar relatorios estruturados para operacao e conformidade

## Funcionalidades

- Escaneamento de codigo EAN com camera
- Cache local de produtos e operacao offline-first
- CRUD de inventario com metadados do colaborador
- Analise de vencimento e estrategia de desconto/status
- Filtros avancados por status, colaborador, medida e tipo de embalagem
- Exportacao XLSX com multiplas abas de relatorio
- Fluxo de importacao CSV/XLSX
- Lembretes locais e notificacoes no app
- Trilha historica de auditoria em SQLite

## Stack Tecnica

- React Native
- Expo (Expo Router)
- TypeScript
- SQLite (expo-sqlite)
- AsyncStorage
- ExcelJS para geracao de planilhas
- Jest para testes unitarios
- React Native Testing Library (disponivel para testes de UI)

## Visao Geral da Arquitetura

O projeto esta sendo refatorado para uma arquitetura orientada a features, separando UI de regras de negocio e integracoes externas.

### Principios principais

- Manter as telas focadas em renderizacao e interacao do usuario
- Mover logica de negocio para modulos puros e testaveis
- Centralizar responsabilidades de banco em servicos dedicados
- Encapsular chamadas de APIs externas atras de limites de servico
- Reutilizar tipos de dominio em todas as camadas

## Estrutura de Pastas

```text
src/
  features/
    inventory/
      utils/
      inventory.repository.ts
      constants.ts
      index.ts
    scanner/
      index.ts
    reports/
      index.ts
  components/
  services/
    open-food-facts.service.ts
    index.ts
  hooks/
    use-debounced-value.ts
  database/
    sqlite-client.ts
    schema.ts
  utils/
    string.ts
  types/
    inventory.ts

app/
  (tabs)/
    index.tsx
```

## Instalacao

### Pre-requisitos

- Node.js 18+
- npm 9+
- Expo CLI via npx

### Instalar dependencias

```bash
npm install
```

## Execucao do Projeto

### Desenvolvimento

```bash
npm run start
```

### Atalhos de plataforma

```bash
npm run android
npm run ios
npm run web
```

### Lint

```bash
npm run lint
```

### Testes

```bash
npm run test
```

## Capturas de Tela

Substitua estes placeholders por capturas reais da aplicacao.

- [ ] Painel inicial
- [ ] Formulario de cadastro de produto
- [ ] Leitor de codigo de barras
- [ ] Analise de vencimento e filtros
- [ ] Fluxo de exportacao/relatorio

## Estrategia de Testes

Os testes automatizados atuais focam em confiabilidade de dominio:

- funcoes de calculo de inventario
- regras de validacao de inventario
- comportamento do repositorio com adaptadores SQLite mockados

Proximos passos sugeridos de cobertura:
- casos de borda no parser de importacao/exportacao
- fluxos criticos de UI com React Native Testing Library
- testes de integracao para inicializacao do schema SQLite

## Melhorias Futuras

- Modularizar o restante do codigo da tela principal em telas independentes por feature
- Adicionar injecao de dependencia para facilitar testes de integracao
- Adicionar testes E2E (Detox)
- Expandir i18n no futuro e realizar auditoria de acessibilidade
- Adicionar pipeline de CI com lint, testes e checagem de tipos
- Adicionar opcao de sincronizacao em nuvem preservando o comportamento offline-first

## Licenca

Este repositorio pode ser adaptado para portfolio ou uso operacional interno.
Adicione uma licenca formal (MIT/Apache-2.0) antes da distribuicao publica.
