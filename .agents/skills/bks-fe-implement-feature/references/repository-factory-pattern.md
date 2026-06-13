# Repository pattern (no runtime factory in this codebase)

> **Status:** This Next.js codebase does **not** use a repository factory or an Http/Mock adapter
> swap. There is exactly **one** repository implementation per feature, and mocking happens at the
> network layer with **MSW** (see `mock-repo-patterns.md`). The "factory / dual-adapter" pattern that
> used to be documented here does not apply — do not introduce `*-repository.factory.ts`,
> `import.meta.env`, or a `RepositoryMode` union.

## The actual pattern

Canonical reference: `features/auth/services/`.

```
features/<feature>/services/
├── <feature>.repository.ts        # interface I<Feature>Repository (the port) — returns domain types
├── <feature>.repository.impl.ts   # class <Feature>Repository extends BaseRepository implements I…  + singleton
├── <feature>.service.ts           # orchestrates repository ↔ Zustand store ↔ sonner toast
└── <feature>.server.ts            # (optional) server-side repo for Server Components
```

- **Port:** `export interface I<Feature>Repository { … }` — methods return mapped **domain types**.
- **Implementation:** `export class <Feature>Repository extends BaseRepository implements I<Feature>Repository`
  with `constructor(http: IHttpAdapter = HttpService) { super(http) }`, then
  `export const <feature>Repository: I<Feature>Repository = new <Feature>Repository()`.
- **Mode switching** between mock and real API is done by the `NEXT_PUBLIC_USE_MOCK` env flag toggling
  MSW — the repository is identical in both modes.
- **Server Components:** inject a server-side `IHttpAdapter` via a `create<Feature>ServerRepository()`
  factory in `<feature>.server.ts` (this is the only "factory" used, and it's about server vs client
  HTTP, not mock vs http).

See `../bks-fe-api-integration/SKILL.md` §1 for the full repository code, and `project-patterns.md`
for the `BaseRepository` / `HttpService` API.
