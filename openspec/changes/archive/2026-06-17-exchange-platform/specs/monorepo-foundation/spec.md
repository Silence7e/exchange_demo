## ADDED Requirements

### Requirement: pnpm workspace structure
The monorepo SHALL use pnpm workspaces with `apps/` for deployable applications and `packages/` for shared libraries.

#### Scenario: Workspace layout
- **WHEN** a developer clones the repository
- **THEN** they find `apps/web` (Next.js), `apps/api` (NestJS), and at least `packages/shared` and `packages/config-eslint`

### Requirement: Unified development scripts
The root `package.json` SHALL expose scripts to run, build, and lint all packages via a task runner (Turborepo).

#### Scenario: Start all services
- **WHEN** developer runs `pnpm dev` from the repository root
- **THEN** both the Next.js frontend and NestJS API start concurrently with hot reload

### Requirement: TypeScript project references
All packages SHALL share a base `tsconfig` and use TypeScript project references for cross-package type checking.

#### Scenario: Shared package import
- **WHEN** `apps/web` imports a type from `packages/shared`
- **THEN** TypeScript resolves the type without duplicate compilation errors

### Requirement: Environment variable convention
Each app SHALL use `.env.example` files documenting required variables; secrets MUST NOT be committed.

#### Scenario: Missing env var
- **WHEN** the API starts without `DATABASE_URL`
- **THEN** it fails fast with a clear error message listing the missing variable
