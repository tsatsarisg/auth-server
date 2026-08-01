# ADR 0001: Dual-database support via ports and adapters

**Status:** Accepted

## Context

The service must demonstrate that domain and application logic can be written
once and run against different persistence technologies. PostgreSQL (relational,
Drizzle ORM) and MongoDB (document, Mongoose) have meaningfully different data
models, which makes them a credible pair for proving the abstraction rather
than a token second driver.

## Decision

Persistence is accessed exclusively through per-context port interfaces
(`UserRepository`, `RefreshTokenRepository`), each with a Postgres and a Mongo
adapter. The active adapter is selected once per module from `DB_PROVIDER` at
composition time. Each bounded context owns its storage: Identity owns the
`users` table/collection, Authentication owns `refresh_tokens` — in both
databases. An in-memory adapter per port backs the test suite, which is the
same seam a third database would use.

Consequences of the alternative we rejected — a single shared ORM entity layer —
would have coupled both contexts to one persistence model and made the
"replaceable adapter" claim untestable.

## Consequences

- Handlers and domain code have zero knowledge of the storage engine; the e2e
  suite runs the full HTTP lifecycle against in-memory adapters.
- Every repository change must be implemented twice and kept semantically
  identical (e.g. `claim()` must be an atomic compare-and-swap in both). Tests
  pin the contract.
- No cross-database transactions exist; each use case writes through exactly
  one adapter, so the aggregate is the consistency boundary.
- Cost: dual maintenance is real. It is accepted here because demonstrating
  the seam is a primary goal of this repository.
