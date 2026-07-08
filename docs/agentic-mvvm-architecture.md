# Agentic MVVM Architecture

This frontend is moving the agentic orchestration surfaces toward a feature-scoped MVVM split. The goal is not a repo-wide rewrite. Each touched workflow should leave domain derivation in plain model functions, browser and hook coordination in ViewModel hooks, and JSX in Views.

## Boundaries

- `model/`: pure TypeScript state builders, row mappers, labels, blockers, and action eligibility. These files should not import React, browser globals, or hooks.
- `view-model/`: React hooks that fetch data, subscribe to sockets, own local UI state, call model builders, and expose semantic actions.
- `view/`: presentational components that render a ViewModel. Views can choose icons and layout, but should not recalculate orchestration state.
- `components/`: compatibility wrappers can remain while older imports are migrated. A wrapper should call a ViewModel hook and render the new View.

## Current Slices

- Orchestration workbench and wizard steps live under `src/features/orchestration/`.
- PM backend project panels and project-inventory helpers live under `src/features/pm/projects/model`, `view-model`, and `view`.
- Client dashboard/product and developer project surfaces have matching feature-level `model`, `view-model`, and `view` folders.
- Shared journey guidance remains in `src/shared/journey/` because it is reused across PM, client, dev, and admin roles.

## Rules For New Transfers

1. Move deterministic branching first: statuses, blockers, labels, counts, badges, and visible rows belong in `model/`.
2. Keep side effects out of models: navigation, `window`, API calls, socket subscriptions, and React state belong in ViewModels or Views.
3. Preserve existing route imports with wrappers when a full call-site migration would add risk.
4. Add focused tests for every model builder that changes orchestration state or user actions.
5. Run `npm run typecheck` after each slice, then targeted Jest for the model tests touched.

## Next Good Targets

- Continue removing `@ts-nocheck` from orchestration-facing components as their state machines move into models.
- Finish migrating the larger PM projects list and project detail views from compatibility wrappers into typed ViewModels.
- Keep the live cockpit model/view split aligned with socket store semantics: the ViewModel selects stream state, while the View only renders transcript controls.
