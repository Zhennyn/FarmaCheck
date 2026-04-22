# FarmaCheck

Mobile app for pharmaceutical expiry and stock control, focused on real store operations, loss prevention, and traceability.

## Value Proposition

FarmaCheck addresses three critical operational problems:

- reduce losses caused by expired products
- speed up inventory routines with barcode-first workflows
- standardize audit-ready product records

## Scope

- no authentication and no login
- no artificial intelligence
- focus on architecture, business rules, and usability

## Core Features

- ✅ product registration and editing (expiry date, batch, quantity, operator)
- ✅ robust business validations:
  - expiry date format validation
  - block product creation with past expiry date
  - block negative stock quantity
- ✅ automatic expiry-risk classification
- ✅ inventory lists for:
  - expired products
  - near-expiry products (configurable window, default 7 days)
  - low-stock products (configurable threshold, default 5)
- ✅ **Professional Service Layer with centralized business rules**
- ✅ **Complete audit trail with operation logs**
- ✅ **Clean Architecture in layers (Domain, Application, Shared)**
- filtering and sorting by search term, collaborator, status, unit, and package
- CSV/XLSX import for internal product base
- XLSX export with dedicated worksheets (all products, expired, near-expiry, low-stock)
- offline-first operation with SQLite persistence
- action history for traceability

## Architecture

The project uses a layered modular structure:

- domain: business models and core concepts
- application: use-case services and persistence contracts
- shared: reusable constants and utilities
- app: UI and user interaction flow

### Main Structure

```text
app/
  (tabs)/
    index.tsx

src/
  modules/
    inventory/
      application/
        ports/
        repositories/
        services/
      domain/
        models/
      shared/
        constants/
        utils/
      index.ts
```

Note: src/features/inventory currently works as a compatibility layer pointing to src/modules/inventory.

## Recent Improvements (2026)

### Professional Service Layer
- **Centralized Business Rules**: Dedicated service layer with robust validations
- **Structured Error Handling**: Result pattern for safe operations
- **Complete Audit Trail**: Automatic logs for all operations (CREATE, UPDATE, DELETE)

### Enhanced Repository Pattern
- **Optimized Queries**: `findExpiringSoon()`, `findLowStock()`, `findPendingSync()` for smart alerts
- **Sync-Ready**: `sync_status` field for future cloud integration
- **Automatic Timestamps**: `updated_at` for change tracking

### Offline-First Synchronization System
- **Complete Sync Service**: Full synchronization state management
- **Fake API Simulation**: Realistic server simulation with delays and validations
- **Retry Logic**: Robust retry strategy with exponential backoff
- **State Management**: Well-defined states (idle, syncing, success, error)
- **Background Sync**: Automatic synchronization based on connectivity
- **Error Handling**: Consistent failure handling for network issues

### Business Validations
- ✅ Name and code required
- ✅ Quantity cannot be negative
- ✅ Expiry date must be valid and future
- ✅ Rules consistently applied in create/update

### Code Structure
```
src/modules/inventory/
├── domain/           # Domain models and types
├── application/      # Use cases and business rules
│   ├── services/     # Professional service layer
│   └── repositories/ # Optimized data access
└── shared/           # Shared utilities and constants
```

## Business Rules

Implemented in:

- src/modules/inventory/application/services/inventory-business.service.ts
- src/modules/inventory/application/services/inventory.service.ts (new professional layer)

Critical rules:

- expiry date must be valid and normalized
- create mode does not allow past expiry dates
- stock quantity cannot be negative
- product analysis includes days to expiry, risk status, inferred package, and measured total

## Tech Stack

- React Native
- Expo / Expo Router
- TypeScript
- SQLite (expo-sqlite)
- Jest
- i18next
- ExcelJS

## Run Locally

Requirements:

- Node.js 18+
- npm 9+
- Expo-capable environment (Android Studio and/or Xcode for emulators)

Install and start:

```bash
git clone https://github.com/Zhennyn/FarmaCheck.git
cd FarmaCheck
npm install
npm run start
```

Platform targets:

```bash
npm run android
npm run ios
npm run web
```

Quality:

```bash
npm run lint
npm run test
```

## Testing Focus

Current tests prioritize critical inventory behavior:

- save validations
- inventory calculations
- filter and listing behavior
- repository persistence behavior

## Scalability Roadmap

- split large UI screens into smaller feature components
- add REST API synchronization while keeping offline-first mode
- improve large-list performance with stronger pagination strategies
- add observability and error monitoring
- expand integration tests for import/export and repository scenarios
- evolve to multi-store sync with conflict resolution

## Project Status

Actively evolving, with a stable baseline for real-world operation and modular growth.
