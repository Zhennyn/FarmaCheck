# FarmaCheck 💊
Aplicativo mobile para controle de validade e estoque farmacêutico com foco em produtividade, rastreabilidade e análise operacional.

![FarmaCheck Banner](https://raw.githubusercontent.com/Zhennyn/FarmaCheck/master/assets/images/farmacheck.png)

## ✨ Funcionalidades

- 📷 Leitura de código de barras para acelerar inventário em loja
- 🗂️ Cadastro e edição de produtos com validade, lote, quantidade e responsável
- ✅ Validações robustas de negócio (validade, quantidade e consistência de cadastro)
- ⚠️ Classificação automática de risco: vencidos, próximos do vencimento e no prazo
- 📉 Identificação de estoque baixo para ação preventiva
- 🔎 Filtros e ordenação por status, colaborador, validade, unidade e embalagem
- 📥 Importação de base em CSV/XLSX para ganho de escala operacional
- 📊 Exportação de relatórios XLSX com abas táticas para rotina de conferência
- 📴 Operação offline-first com SQLite local e sincronização preparada
- 🧾 Histórico de ações para auditoria e rastreabilidade completa
- 🔄 Service Layer profissional com regras de negócio centralizadas
- 🏗️ Arquitetura limpa em camadas (Domain, Application, Shared)

## 🏗️ Arquitetura e Melhorias Recentes (2026)

### Service Layer Profissional
- **Centralização de Regras de Negócio**: Service layer dedicado com validações robustas
- **Tratamento de Erros Estruturado**: Result pattern para operações seguras
- **Auditoria Completa**: Logs automáticos para todas as operações (CREATE, UPDATE, DELETE)

### Repository Pattern Aprimorado
- **Consultas Otimizadas**: `findExpiringSoon()` e `findLowStock()` para alertas inteligentes
- **Sincronização Preparada**: Campo `sync_status` para futura integração cloud
- **Timestamps Automáticos**: `updated_at` para rastreamento de modificações

### Validações de Negócio
- ✅ Nome e código obrigatórios
- ✅ Quantidade não pode ser negativa
- ✅ Data de validade deve ser válida e futura
- ✅ Regras aplicadas consistentemente em create/update

### Estrutura de Código
```
src/modules/inventory/
├── domain/           # Modelos e tipos de domínio
├── application/      # Casos de uso e regras de negócio
│   ├── services/     # Service layer profissional
│   └── repositories/ # Acesso a dados otimizado
└── shared/           # Utilitários e constantes compartilhados
```

## 🛠️ Tecnologias Utilizadas

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-26A69A?style=for-the-badge&logo=i18next&logoColor=white)
![ExcelJS](https://img.shields.io/badge/ExcelJS-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)
![Cloud Ready](https://img.shields.io/badge/Cloud_Ready-0A66C2?style=for-the-badge&logo=microsoftazure&logoColor=white)

## 🚀 Como executar localmente

### Pré-requisitos

- Node.js 18+
- npm 9+
- Expo CLI via npx
- Android Studio (Android) e/ou Xcode (iOS)

### Passo a passo

1. Clonar o repositório:

```bash
git clone https://github.com/Zhennyn/FarmaCheck.git
```

2. Entrar na pasta do projeto:

```bash
cd FarmaCheck
```

3. Instalar dependências:

```bash
npm install
```

4. Iniciar o ambiente de desenvolvimento:

```bash
npm run start
```

5. Executar na plataforma desejada:

```bash
npm run android
```

```bash
npm run ios
```

```bash
npm run web
```

6. Rodar qualidade e testes:

```bash
npm run lint
npm run test
```

7. (Opcional) Validar importação manual da base:

```bash
npm run test:import-base
```

## 🌐 Demonstração

- 🎥 Vídeo de demonstração: 
```md
[▶️ Assistir demonstração](https://github.com/Zhennyn/FarmaCheck/assets/video/Demon.mp4)
```
- 🔗 Placeholder: https://github.com/Zhennyn/FarmaCheck


## 📌 Sobre o projeto

O FarmaCheck foi evoluído em 2026 para se tornar um case de portfólio técnico completo com aplicação prática em operação farmacêutica e demonstração de engenharia de software profissional.

### Evolução Arquitetural
- **De CRUD simples para arquitetura limpa**: Implementação de Service Layer, Repository Pattern e separação clara de responsabilidades
- **Offline-first robusto**: SQLite com campos de sincronização preparados para cloud
- **Auditoria profissional**: Tabela de logs para rastreabilidade completa de operações
- **TypeScript rigoroso**: Tipagem forte em todas as camadas da aplicação

### Habilidades Demonstradas
Além de resolver um problema real de controle de vencimento e estoque, o projeto demonstra habilidades transferíveis para vagas de Suporte TI, Help Desk, Analista de Dados, Azure e Cloud:

- ✅ **Arquitetura limpa**: Separação em camadas (Domain, Application, Shared)
- ✅ **Regras de negócio centralizadas**: Service layer com validações robustas
- ✅ **Persistência otimizada**: Consultas eficientes e estrutura preparada para sync
- ✅ **Tratamento de erros profissional**: Result pattern e logs estruturados
- ✅ **Testabilidade**: Código modular pronto para testes unitários e integração
- ✅ **Pensamento full-stack**: Fluxo completo de interface → negócio → persistência
- ✅ **Base cloud-ready**: Estrutura preparada para sincronização futura

Feito com ❤️ por Zhennyn.

Contribuições são bem-vindas: abra uma issue, sugira melhorias ou envie um pull request.