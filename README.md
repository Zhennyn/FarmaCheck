# FarmaCheck

FarmaCheck is an offline-first React Native application for pharmacy expiration auditing and inventory operations.

It helps teams scan EAN barcodes, register medication batches, monitor expiry risks, and export actionable reports directly from mobile devices.

## Problem This Project Solves

Pharmacy teams often track expiration in spreadsheets or paper notes, which creates delays, lost information, and preventable waste.

FarmaCheck provides a field-ready workflow to:
- scan products quickly
- keep inventory data local and available without internet
- identify high-risk products by expiry window
- export structured reports for operations and compliance

## Features

- EAN barcode scanning with camera
- Local product cache and offline-first operations
- Inventory CRUD with collaborator metadata
- Expiry analysis and discount/status strategy
- Advanced filtering by status, collaborator, measure, and package type
- XLSX export with multiple report tabs
- CSV/XLSX import workflow
- Local reminders and in-app notifications
- Historical audit trail in SQLite

## Tech Stack

- React Native
- Expo (Expo Router)
- TypeScript
- SQLite (expo-sqlite)
- AsyncStorage
- ExcelJS for spreadsheet generation
- Jest for unit testing
- React Native Testing Library (available for UI tests)

## Architecture Overview

The project is being refactored to a feature-driven architecture that separates UI from business rules and external integrations.

### Main principles

- Keep screens focused on rendering and user interaction
- Move business logic to pure, testable modules
- Centralize database concerns in dedicated services
- Encapsulate external API calls behind service boundaries
- Reuse domain types across all layers

## Folder Structure

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

## Installation

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI via npx

### Install dependencies

```bash
npm install
```

## Running the Project

### Development

```bash
npm run start
```

### Platform shortcuts

```bash
npm run android
npm run ios
npm run web
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm run test
```

## Screenshots

Replace these placeholders with real screenshots.

- [ ] Home dashboard
- [ ] Product registration form
- [ ] Barcode scanner
- [ ] Expiry analytics and filters
- [ ] Export/report flow

## Testing Strategy

Current automated tests focus on domain-level reliability:

- inventory calculation functions
- inventory validation rules
- repository behavior with mocked SQLite adapters

Suggested next coverage steps:
- import/export parser edge cases
- critical UI flows with React Native Testing Library
- integration tests for SQLite schema initialization

## Future Improvements

- Modularize the remaining large screen code into independent feature screens
- Add dependency injection for easier integration testing
- Add E2E tests (Detox)
- Add i18n (English/Portuguese) and accessibility audit
- Add CI pipeline with lint, test, and type checks
- Add cloud sync option while preserving offline-first behavior

## License

This repository can be adapted for portfolio or internal operational use.
Add a formal license (MIT/Apache-2.0) before public distribution.
