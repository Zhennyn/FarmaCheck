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

- product registration and editing (expiry date, batch, quantity, operator)
- robust business validations:
  - expiry date format validation
  - block product creation with past expiry date
  - block negative stock quantity
- automatic expiry-risk classification
- inventory lists for:
  - expired products
  - near-expiry products (configurable window, default 30 days)
  - low-stock products (configurable threshold, default 5)
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

## Business Rules

Implemented in:

- src/modules/inventory/application/services/inventory-business.service.ts

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
