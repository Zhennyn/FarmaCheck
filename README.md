# FarmaCheck

Aplicativo mobile para controle de validade e estoque farmacêutico, com foco em operação de loja, prevenção de perdas e rastreabilidade.

## Proposta de Valor

O FarmaCheck foi projetado para resolver três dores reais da operação farmacêutica:

- reduzir perdas por vencimento com visão clara de risco
- acelerar o inventário com fluxo simples e leitura de código de barras
- padronizar registro e auditoria de itens com histórico e exportação

Resultado esperado: mais segurança operacional, menos retrabalho e melhor tomada de decisão no dia a dia da farmácia.

## Escopo

- sem autenticação e sem login
- sem uso de inteligência artificial
- foco em estrutura, regras de negócio e usabilidade operacional

## Funcionalidades

- cadastro e edição de produtos com dados de validade, lote, quantidade e responsável
- validações de negócio no cadastro:
	- data de validade no formato correto
	- bloqueio de cadastro com validade no passado
	- bloqueio de quantidade negativa em estoque
- classificação automática por risco de validade
- listagem de produtos:
	- vencidos
	- próximos do vencimento (janela configurável, padrão 30 dias)
	- baixo estoque (limite configurável, padrão 5 itens)
- filtros combinados por busca, colaborador, status, unidade e embalagem
- ordenação por risco, validade, nome e estoque
- importação de base local CSV/XLSX
- exportação de planilhas XLSX com abas de produtos, vencidos, próximos e estoque baixo
- operação offline-first com SQLite
- histórico de ações para auditoria

## Arquitetura

O projeto está organizado em camadas para facilitar manutenção e evolução:

- domain: tipos e regras de domínio
- application: serviços de caso de uso e contratos de persistência
- shared: utilitários e constantes reutilizáveis
- app: camada de interface e fluxo do usuário

### Estrutura de Pastas (recorte principal)

```text
app/
	(tabs)/
		index.tsx

src/
	modules/
		inventory/
			application/
				ports/
					inventory-database.port.ts
				repositories/
					inventory.repository.ts
				services/
					inventory-business.service.ts
					inventory-business.service.test.ts
			domain/
				models/
					product.model.ts
			shared/
				constants/
					inventory.constants.ts
				utils/
					calculations.ts
					date.ts
					measurement.ts
					validation.ts
			index.ts

	features/
		inventory/
			index.ts
```

Observação: a pasta src/features/inventory funciona como camada de compatibilidade de importação, apontando para src/modules/inventory.

## Regras de Negócio Críticas

- validade deve ser data válida no formato ISO
- cadastro não permite validade no passado
- estoque não pode ser negativo
- produtos são analisados automaticamente para:
	- dias até vencimento
	- status de risco
	- embalagem calculada
	- total medido calculado

Essas regras ficam centralizadas no serviço:

- src/modules/inventory/application/services/inventory-business.service.ts

## Stack Técnica

- React Native + Expo + Expo Router
- TypeScript
- SQLite (expo-sqlite)
- Jest para testes unitários
- i18next para internacionalização
- ExcelJS para exportação de planilhas

## Como Executar

### Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- ambiente Expo (Android Studio e/ou Xcode para emuladores)

### Instalação

```bash
git clone https://github.com/Zhennyn/FarmaCheck.git
cd FarmaCheck
npm install
```

### Desenvolvimento

```bash
npm run start
```

Plataformas:

```bash
npm run android
npm run ios
npm run web
```

### Qualidade

```bash
npm run lint
npm run test
```

### Teste de importação manual da base

```bash
npm run test:import-base
```

## Testes

Cobertura atual inclui regras de inventário e comportamento de repositório, com foco em:

- validações de cadastro
- cálculos de inventário
- filtros e listagens críticas
- integração de persistência no repositório

## Melhorias Futuras (Escalabilidade)

- separar a tela principal em componentes e casos de uso menores
- criar API REST para sincronização com backend (mantendo app offline-first)
- adicionar paginação e virtualização avançada para grandes volumes
- instrumentar observabilidade de erros e métricas de uso
- ampliar testes com cenários de importação/exportação e testes de integração
- evoluir para sincronização multi-loja com resolução de conflitos

## Boas Práticas de Contribuição

- mantenha regras de negócio dentro de src/modules
- evite lógica de domínio dentro de componentes de interface
- adicione testes para cada regra crítica alterada
- preserve nomes claros, funções curtas e baixo acoplamento

## Status do Projeto

Em evolução contínua, com base estável para uso real e expansão por módulos.