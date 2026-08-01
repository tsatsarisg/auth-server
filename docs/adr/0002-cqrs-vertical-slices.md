# ADR 0002: CQRS command bus with vertical slices

**Status:** Accepted

## Context

An auth server is a generic subdomain: four use cases (register, login,
refresh, logout) with modest read/write asymmetry. Full CQRS with separate
read models would be over-engineering; plain service classes would
demonstrate less structure than the project intends to showcase.

## Decision

Each use case is a vertical slice — command, handler, and domain events in one
directory — dispatched through the NestJS `CommandBus`. Commands carry their
result type at compile time (phantom-typed `TypedCommand<T>`), so controllers
get typed results from an otherwise untyped bus. Handlers return
`Result<T, AppError>` (neverthrow); a single `unwrapOrThrow` maps errors to
HTTP exceptions at the controller edge. There is deliberately **no QueryBus**:
the system currently has no query-side use case, and dead pattern samples cost
more credibility than they add.

## Consequences

- Adding a use case means adding one directory and one line of module wiring;
  no existing slice is touched.
- The bus indirection costs a level of navigation per request; in exchange,
  cross-cutting behavior (the `tryCatch` error envelope today; logging or
  metrics tomorrow) has a single seam.
- Commands returning values (login returns a token pair) is a deliberate,
  pragmatic reading of CQRS — the alternative (write, then poll a read model
  for your tokens) serves nobody in an auth flow.
- Domain events currently feed audit logging only; if a second consumer
  appears (e.g. lockout policies), the publishing seam already exists.
