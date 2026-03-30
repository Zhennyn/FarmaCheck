# FarmaCheck

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-2563EB)
![Plataforma](https://img.shields.io/badge/plataforma-React%20Native%20%7C%20Expo-0F172A)
![Offline First](https://img.shields.io/badge/arquitetura-offline--first-16A34A)
![Licenca](https://img.shields.io/badge/licenca-MIT-informational)

Aplicativo mobile para auditoria de validade e operacoes de inventario em farmacia, com foco em velocidade no dia a dia, rastreabilidade e operacao sem dependencia de internet.

## Visao Geral

O FarmaCheck nasceu de uma necessidade real: substituir controles manuais em papel e planilhas por um fluxo confiavel, rapido e padronizado para equipes de farmacia.

Com ele, a operacao consegue escanear produtos, registrar lotes e validades, identificar riscos e gerar relatorios acionaveis diretamente no celular.

### Por que isso importa

Controle de validade mal executado gera perda financeira, risco sanitario e retrabalho operacional. O FarmaCheck reduz esses gargalos com dados estruturados e rotina orientada por risco.

## Demonstracao Visual

### Galeria de telas

> Salve os arquivos nesta pasta para manter o README organizado:
> `assets/images/screenshots/`

| Dashboard | Novo registro |
| --- | --- |
| ![Dashboard FarmaCheck](assets/images/screenshots/01-dashboard.png) | ![Novo registro FarmaCheck](assets/images/screenshots/02-novo-registro.png) |

| Filtros avancados | Resumo do turno |
| --- | --- |
| ![Filtros avancados FarmaCheck](assets/images/screenshots/03-filtros-avancados.png) | ![Resumo do turno FarmaCheck](assets/images/screenshots/04-resumo-turno.png) |

### GIF recomendado

- [INSERIR GIF - fluxo completo de cadastro ate aplicacao de filtros e visualizacao de resumo]

## Problema Que o Projeto Resolve

Em muitas farmacias, a conferencia de validade ainda depende de controles manuais, com baixa rastreabilidade e risco de erro humano.

O FarmaCheck resolve isso com:

- operacao offline-first para uso no piso da loja
- padronizacao do cadastro e da auditoria
- classificacao automatica de risco por vencimento
- historico auditavel de alteracoes
- exportacao estruturada para acompanhamento gerencial

### Por que isso importa

A farmacia ganha previsibilidade na operacao, resposta mais rapida para itens criticos e base de dados confiavel para tomada de decisao.

## Funcionalidades Principais

- Escaneamento de codigo EAN com camera
- Cache local e operacao offline-first (SQLite + AsyncStorage)
- CRUD de inventario com metadados de colaborador
- Analise de vencimento com classificacao de risco (critico, atencao, ok)
- Filtros avancados por status, colaborador, validade e embalagem
- Exportacao XLSX com multiplas abas de relatorio
- Importacao CSV/XLSX para carga inicial
- Lembretes e notificacoes locais
- Trilha historica de auditoria

## Stack Tecnica

### Core

- ![React Native](https://img.shields.io/badge/React%20Native-20232A?logo=react&logoColor=61DAFB) React Native
- ![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white) Expo Router
- ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) TypeScript

### Persistencia e Dados

- ![SQLite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white) expo-sqlite
- ![AsyncStorage](https://img.shields.io/badge/AsyncStorage-local%20storage-334155) AsyncStorage
- ![ExcelJS](https://img.shields.io/badge/ExcelJS-relatorios%20XLSX-15803D) ExcelJS

### Qualidade

- ![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white) Jest
- ![RNTL](https://img.shields.io/badge/React%20Native%20Testing%20Library-testes%20UI-7C3AED) React Native Testing Library

## Arquitetura e Estrutura de Pastas

Arquitetura orientada a features, separando responsabilidades de UI, dominio e infraestrutura.

```text
src/
  features/
    inventory/     # utils, repository, constants
    scanner/
    reports/
  components/      # componentes reutilizaveis
  services/        # open-food-facts.service, etc
  hooks/           # useDebouncedValue, etc
  database/        # sqlite-client, schema
  utils/           # funcoes auxiliares
  types/           # tipos compartilhados
```

### Por que isso importa

Essa organizacao facilita manutencao, reduz acoplamento e acelera evolucao do produto sem comprometer estabilidade.

## Pre-requisitos

- Node.js 18+
- npm 9+
- Expo CLI via npx
- Ambiente Android Studio e/ou Xcode (para emuladores/simuladores)

## Instalacao

1. Clone o repositorio.
2. Entre na pasta do projeto.
3. Instale as dependencias.

```bash
npm install
```

## Como Executar

### Ambiente de desenvolvimento

```bash
npm run start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

### Qualidade de codigo

```bash
npm run lint
```

## Estrategia de Testes

Cobertura atual focada em confiabilidade de regras de negocio:

- funcoes de calculo de inventario
- regras de validacao
- comportamento de repositorio com adaptadores SQLite mockados

Comandos principais:

```bash
npm run test
```

Proximos passos recomendados:

- casos de borda para parser de importacao/exportacao
- fluxos criticos de interface com React Native Testing Library
- testes de integracao para inicializacao de schema SQLite

### Por que isso importa

Em operacao de farmacia, erro de regra pode gerar impacto direto em descarte e compliance. Testes reduzindo regressao nao sao opcionais.

## Melhorias Futuras Planejadas

- modularizar trechos remanescentes da tela principal em telas por feature
- adicionar testes E2E com Detox
- adicionar pipeline de CI (lint, teste e type-check)
- ampliar observabilidade de erros e eventos operacionais
- avaliar sincronizacao em nuvem mantendo modo offline-first

## Como Contribuir

Contribuicoes sao bem-vindas.

1. Crie uma branch a partir da `master`.
2. Implemente a melhoria/correcao com testes.
3. Garanta que lint e testes passam localmente.
4. Abra um Pull Request com contexto, impacto e evidencias (prints/logs).

Checklist sugerido para PR:

- [ ] escopo claro e objetivo
- [ ] sem regressao funcional
- [ ] testes adicionados/atualizados
- [ ] documentacao atualizada (quando aplicavel)

## Licenca

Este projeto esta licenciado sob a licenca MIT.

Se sua operacao exigir distribuicao publica ou uso comercial, valide requisitos juridicos internos antes de publicar builds.
