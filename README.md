# App de Auditoria de Validade

Aplicativo mobile em Expo e React Native para auditoria de validade de produtos, com foco em operação de farmácia e loja.

## Screenshots

> Para adicionar screenshots reais: rode o app com `npx expo start`, abra no celular/emulador, tire print e salve em `assets/images/screenshots/`.

| Tela Principal | Menu Lateral | Onboarding |
|:-:|:-:|:-:|
| ![Lista de produtos](assets/images/screenshots/lista.png) | ![Menu lateral](assets/images/screenshots/menu.png) | ![Onboarding](assets/images/screenshots/onboarding.png) |

| Conferência Rápida | Gráfico de Status | Como Usar |
|:-:|:-:|:-:|
| ![Conferência](assets/images/screenshots/conferencia.png) | ![Gráfico](assets/images/screenshots/grafico.png) | ![Como Usar](assets/images/screenshots/como-usar.png) |

O projeto trabalha com:
- cadastro rápido de produtos com validade
- leitura de EAN pela câmera
- busca automática em base interna e fallback online
- cálculo por medida de produto
- filtros de vencimento e conferência
- importação e exportação de planilhas
- histórico local de alterações
- notificações locais de lembrete e risco

## Visão Geral

O app foi estruturado para uso operacional no dia a dia.

Hoje ele permite:
- registrar produtos manualmente ou por leitura de código de barras
- classificar automaticamente produtos por status de vencimento
- calcular total por unidade de medida, como `ml`, `g`, `comp`, `caps`, `gotas`
- separar embalagem da medida de cálculo, por exemplo:
  - `frasco 120 ml` -> embalagem `frasco`, cálculo em `ml`
  - `bisnaga 20 g` -> embalagem `bisnaga`, cálculo em `g`
- manter uma base interna local de EAN
- importar produtos via `CSV` ou `XLSX`
- exportar relatório em `XLSX` com múltiplas abas

## Recursos

### Cadastro e busca

- leitura de EAN por câmera com `expo-camera`
- preenchimento automático por base interna local
- fallback online via OpenFoodFacts quando o código não existe na base local
- suporte a cadastro manual

### Validade e risco

- classificação automática por dias restantes
- status visuais de vencimento:
  - `VENCIDO`
  - `RETIRAR`
  - `60% DESC`
  - `40% DESC`
  - `30% DESC`
  - `20% DESC`
  - `NO PRAZO`

### Medidas e embalagem

- medidas suportadas:
  - `unidades`
  - `comprimidos`
  - `capsulas`
  - `drageas`
  - `ml`
  - `g`
  - `gotas`
  - `ampolas`
  - `envelopes`
  - `bisnagas`
  - `frascos`
  - `sprays`
- identificação separada de embalagem:
  - `frasco`
  - `bisnaga`
  - `envelope`
  - `spray`
  - `ampola`
- inferência automática a partir da apresentação do produto
- validação de inconsistência antes de salvar

### Organização operacional

- loja, regional e colaborador persistidos localmente
- campo de setor
- campo de lote
- campo de observação
- status de conferência:
  - `pendente`
  - `conferido`
  - `resolvido`

### Filtros e resumos

- busca por nome ou EAN
- filtros rápidos por validade:
  - `Todos`
  - `Próximos`
  - `Vencidos`
- filtros avançados por:
  - colaborador
  - setor
  - status de conferência
  - medida
  - embalagem
- ordenação automática por prioridade de risco
- resumo por colaborador
- alertas agregados para:
  - 7 dias
  - 15 dias
  - 30 dias

### Importação e exportação

- importação de produtos em `CSV` e `XLSX`
- suporte a layout antigo e layout novo com cabeçalhos
- exportação em `XLSX` com compartilhamento
- abas geradas na exportação:
  - `Produtos`
  - `Vencidos`
  - `Proximos`
  - `Resumo_Colaborador`
  - `Historico`

### Base interna

- base embarcada em JSON local
- cache em SQLite para consulta rápida
- importação manual de base EAN pela sidebar temporária

### Histórico e notificações

- histórico local de:
  - cadastro
  - edição
  - importação
  - exclusão
- notificações locais com `expo-notifications`
- lembrete recorrente de auditoria
- alerta local de risco resumido quando houver itens críticos

## Tecnologias

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router
- SQLite local com `expo-sqlite`
- AsyncStorage
- `expo-camera`
- `expo-document-picker`
- `expo-file-system`
- `expo-sharing`
- `expo-notifications`
- `xlsx`

## Estrutura Atual

Principais pontos do projeto:

- [app/(tabs)/index.tsx](app/(tabs)/index.tsx)
  Tela principal, cadastro, filtros, histórico, resumo, importação e exportação.
- [assets/data/anvisa-base.json](assets/data/anvisa-base.json)
  Base interna embarcada usada no cache local.
- [scripts/generate-anvisa-json.js](scripts/generate-anvisa-json.js)
  Script utilitário relacionado à geração de base local.
- [scripts/generate-cmed-json.js](scripts/generate-cmed-json.js)
  Script utilitário para geração de base a partir de dados CMED.

## Instalação

Pré-requisitos:
- Node.js
- npm
- Expo CLI via `npx`

Instalação:

```bash
npm install
```

Executar em desenvolvimento:

```bash
npm run start
```

Outros comandos úteis:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Dependências Importantes

Se precisar reinstalar os principais módulos do projeto:

```bash
npx expo install expo-camera expo-document-picker expo-file-system expo-sharing expo-sqlite expo-notifications @react-native-community/datetimepicker
npm install xlsx
```

## Configuração do Expo

O projeto usa plugins no `app.json`, incluindo:

- `expo-router`
- `expo-splash-screen`
- `expo-notifications`
- `expo-sqlite`
- `@react-native-community/datetimepicker`

Depois de alterar plugins nativos, pode ser necessário reiniciar o app e reconstruir o ambiente nativo se estiver usando build nativo ou dev build.

## Banco de Dados Local

O app usa SQLite local e cria tabelas automaticamente na inicialização.

Tabelas principais:
- `produtos`
- `ean_cache`
- `historico_produtos`

Campos principais em `produtos`:
- `id`
- `nome`
- `codigo`
- `apresentacao`
- `embalagem`
- `unidade_medida`
- `quantidade_medida`
- `validade`
- `qtd`
- `colaborador`
- `setor`
- `lote`
- `observacao`
- `status_conferencia`

## Fluxo de Uso

### 1. Configuração inicial

No topo da tela, configure:
- loja
- regional
- colaborador

Esses dados ficam persistidos no dispositivo.

### 2. Cadastro de produto

Você pode:
- digitar o EAN manualmente
- usar a câmera
- preencher manualmente os campos

Campos operacionais relevantes:
- nome
- apresentação
- medida para cálculo
- conteúdo por embalagem
- quantidade
- validade
- setor
- lote
- status de conferência
- observação

### 3. Importação de produtos

O botão `Importar Produtos` aceita:
- `CSV`
- `XLSX`

O importador aceita:
- arquivos antigos por posição de coluna
- arquivos novos por nome de cabeçalho

### 4. Exportação de relatório

O botão `Salvar Interno` gera um arquivo `XLSX` compartilhável.

Esse arquivo inclui múltiplas abas com dados operacionais e histórico.

### 5. Base interna de EAN

Na sidebar temporária existe a ação de importação de base EAN.

Essa base substitui a base local anterior no cache.

## Política de Vencimento

Regra atual aplicada no app:

| Faixa | Resultado |
|---|---|
| menor que 0 dias | `VENCIDO` |
| até 30 dias | `RETIRAR` |
| até 60 dias | `60% DESC` |
| até 90 dias | `40% DESC` |
| até 120 dias | `30% DESC` |
| até 180 dias | `20% DESC` |
| acima de 180 dias | `NO PRAZO` |

## Notificações

O app usa notificações locais para:
- lembrete recorrente de auditoria
- alerta resumido quando houver itens em risco imediato ou próximos do vencimento

Observações:
- no primeiro uso o app solicita permissão
- em Android é criado um canal de notificação próprio
- em ambiente web essas notificações não são aplicadas da mesma forma

## Limitações Atuais

- o projeto está concentrado principalmente em [app/(tabs)/index.tsx](app/(tabs)/index.tsx)
- PDF ainda não foi implementado
- notificações dependem de permissão do sistema e funcionamento do ambiente nativo
- a base embarcada ainda usa o nome de arquivo `anvisa-base.json`, embora a base atual já tenha sido adaptada para o fluxo interno do app

## Desenvolvimento

Para validar o projeto:

```bash
npm run lint
```

## Objetivo do Projeto

O foco do app é reduzir perdas por vencimento e melhorar a operação de auditoria com um fluxo simples, visual direto e armazenamento local confiável.

### 4️⃣ Editar Produto

1. Localize o produto na lista
2. Clique no ícone **✏️ editar** (botão azul)
3. Modifique os campos desejados
4. Clique "Atualizar DB"

### 5️⃣ Remover Produto

1. Localize o produto na lista
2. Clique no ícone **🗑️ lixeira** (botão vermelho)
3. Confirme a exclusão
4. Produto é removido imediatamente do banco

### 6️⃣ Exportar Dados

1. Clique em "Salvar Interno"
2. Selecione opção de compartilhamento
3. Escolha destino (email, cloud storage, etc)
4. Arquivo gerado: `Validades_[LOJA]_[timestamp].xlsx`

**Colunas exportadas:**
```
Nome;Apresentacao;Embalagem;Codigo_EAN;Validade;Status;Quantidade;Colaborador;Setor;Lote;Status_Conferencia;Tipo_Medida;Conteudo_Embalagem;Observacao
```

### 7️⃣ Importar Dados

1. Clique em "Importar Produtos"
2. Selecione um arquivo CSV ou XLSX
3. Confirme a adição de produtos
4. Produtos são inseridos na base de dados

---

## 🔌 API e Integração

### OpenFoodFacts API

Para produtos não encontrados na base local, o app consulta:

```
https://world.openfoodfacts.org/api/v0/product/{EAN}.json
```

**Resposta esperada:**
```json
{
  "status": 1,
  "product": {
    "product_name": "Nome do Produto",
    "generic_name": "Nome Genérico",
    "quantity": "500ml / 100g"
  }
}
```

**Nota:** Esta integração é automática e silenciosa - se falhar, o formulário continua funcionando normalmente.

---

## 🧩 Componentes Principais

### UI Components

| Componente | Descrição |
|---|---|
| **Header** | Banner superior com loja, regional e informações do colaborador |
| **KPI Cards** | Cards horizontais com métricas em tempo real (total, markdown, risco) |
| **Toolbar** | Barra de ações (exportar, importar, pesquisar) |
| **Product Card** | Card individual de cada produto com status visual |
| **Modal Formulário** | Modal deslizável para adicionar/editar produtos |
| **Modal Configurações** | Dialog para editar informações da loja |
| **Bottom Sheet** | Resumo do turno com pendências |
| **Camera View** | Interface nativa de câmera para leitura EAN |

### Hooks e Funções

| Função | Propósito |
|---|---|
| `inicializarApp()` | Carrega dados SQLite e AsyncStorage |
| `buscarNaRedeDrogaria()` | Busca EAN na base local ou API |
| `obterStatusDesconto()` | Calcula status baseado em dias para vencer |
| `formataDataBR()` | Converte AAAA-MM-DD para DD/MM/AAAA |
| `salvarProduto()` | Insere ou atualiza na base SQLite |
| `removerProduto()` | Deleta produto do banco |
| `exportarParaExcel()` | Gera XLSX compartilhável com múltiplas abas |
| `importarDeExcel()` | Importa CSV ou XLSX selecionado |

---

## 💾 Armazenamento de Dados

### AsyncStorage (Configurações)

Chaves armazenadas:
```
@loja = "SP1"
@regional = "SUL"
@colaborador = "Matheus"
```

Carregadas automaticamente ao iniciar. Persistem entre reinstalações.

### SQLite (Produtos)

Base de dados local `farmacia.db` com tabela `produtos`. Totalmente offline, não sincroniza com servidor.

**Backup:**
```bash
# Via Android File Shares
/data/data/com.myzel.AppDeValidade/databases/farmacia.db

# Via iOS (mediante permissão)
Documents/SQLite/farmacia.db
```

### Cache (Arquivos)

Arquivos XLSX são armazenados temporariamente em:
- **Android:** `/cache/Validades_[LOJA]_[timestamp].xlsx`
- **iOS:** `/tmp/Validades_[LOJA]_[timestamp].xlsx`

---

## ⌨️ Atalhos de Teclado (Desenvolvimento)

Ao executar `npx expo start`:

```
i → Abrir no simulador iOS
a → Abrir no emulador Android
w → Abrir no browser (Web)
r → Recarregar app
c → Limpar cache
m → Mostrar menu de desenvolvimento
```

---

## 🐛 Troubleshooting

### Problema: "Permissão de câmara negada"
**Solução:** Vá para Configurações do dispositivo > Permissões > Camera > Permitir

### Problema: "Banco de dados corrompido"
**Solução:** Use o botão "Apagar Base de Dados (SQLite)" em Definições (operação irreversível)

### Problema: "Arquivo não importa"
**Solução:** Verifique formatação:
- Para CSV: separador deve ser **ponto-e-vírgula (;)**, codificação **UTF-8**
- Cabeçalhos reconhecidos (novo layout): `Nome`, `Apresentacao`, `Codigo_EAN`, `Validade`, `Quantidade`, `Colaborador`, `Setor`, `Lote`, `Status_Conferencia`
- Layout antigo por posição de coluna também é suportado

### Problema: "EAN não encontra produto"
**Solução:** 
1. Verifique se EAN está correto (digitos = 13 ou 8)
2. Preencha manualmente os dados do produto
3. Produto será salvo para futuras consultas

---

## 📝 Exemplo de Fluxo Completo

```
1. Abrir app
   ↓
2. Configurar loja/colaborador (primeira vez)
   ↓
3. Clicar "+" para novo produto
   ↓
4. Usar câmera para ler EAN
   ↓
5. App busca na ERP local ou API
   ↓
6. Preencher campos faltantes (valdade, qtd)
   ↓
7. Salvar produto
   ↓
8. Repetir para todos os produtos
   ↓
9. Ver dashboard com KPIs atualizados
   ↓
10. Exportar CSV ao final do turno
```

---

## 📞 Suporte e Contribuições

- **Issues:** Reporte bugs em https://github.com/Zhennyn/AppDeValidade/issues
- **Contribuições:** Pull requests são bem-vindas!
- **Documentação:** Veja o código comentado em `app/(tabs)/index.tsx`

---

## 📄 Licença

Este projeto é código aberto sob licença MIT. Sinta-se livre para usar, modificar e distribuir.

---

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para farmácias e lojas que desejam melhorar gestão de validade.

**Versão:** 1.0.2  
**Data:** Março 2026  
**Framework:** React Native + Expo

---

## 🎨 Paleta de Cores

| Status | Cor | Hex |
|---|---|---|
| No Prazo | Verde | `#15803D` |
| 20% Desconto | Amarelo | `#A16207` |
| 30-60% Desconto | Laranja | `#C2410C` |
| Retirar | Vermelho | `#B91C1C` |
| Primary | Azul | `#565DF0` |
| Header | Azulete | `#2C2E7D` |

---

## 📊 Diagrama de Fluxo de Dados

```
┌─────────────────────────────────────────────┐
│         INICIO DO APLICATIVO                │
└──────────────┬──────────────────────────────┘
               │
               ↓
        ┌──────────────┐
        │AsyncStorage  │ ← Carrega config (loja, regional, colaborador)
        └──────┬───────┘
               │
               ↓
        ┌──────────────┐
        │  SQLite DB   │ ← Carrega lista de produtos
        └──────┬───────┘
               │
               ↓
        ┌──────────────────────────────┐
        │  Dashboard com KPIs           │
        │  - Total Auditado             │
        │  - Valor Markdown             │
        │  - Risco Imediato             │
        └──────┬───────────────────────┘
               │
         ┌─────┴─────────────────────────┐
         ↓                               ↓
    ┌─────────────┐              ┌──────────────┐
    │ Novo Produto│              │ Pesquisar    │
    │ (Câmera/EAN)│              │ Produto      │
    └─────┬───────┘              └──────┬───────┘
          │                             │
    ┌─────↓──────────────┐             │
    │ Buscar Base Intern │             │
    │ ou API OpenFood    │             │
    └─────┬──────────────┘             │
          │                             │
    ┌─────↓──────────────────┐         │
    │ Preencher Formulário   │         │
    │ (Nome, Qtd, Validade)  │         │
    └─────┬──────────────────┘         │
          │                             │
    ┌─────↓─────────────────────────────┘
    │ Salvar em SQLite
    │ (INSERT or UPDATE)
    │
    └─→ Atualizar Dashboard com novo KPI
```

---

**Última atualização:** Março 2026
