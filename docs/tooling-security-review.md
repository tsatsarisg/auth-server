# Tooling and security review — 2026-10-24

The refresh replaces ESLint with type-aware Oxlint, centralizes shared tooling at
the pnpm workspace root and upgrades eligible dependencies. The nested
`auth-server/` application layout is preserved.

## Tooling and compatibility

- Node 24.22.1 LTS is selected in `.nvmrc`, both manifests and both Dockerfiles.
  pnpm 12.14.0 has one SHA-512-verified root `packageManager` pin; CI and
  Dockerfiles use it through Corepack. pnpm 12.15.0 remains quarantined.
- pnpm configuration is centralized in `pnpm-workspace.yaml`: exact versions,
  strict engines, seven-day release quarantine, blocked exotic transitive
  sources, provenance downgrade protection and explicitly denied build scripts.
  New unreviewed build scripts fail installation. No quarantine or trust
  exceptions were introduced. See [pnpm guidance](https://pnpm.io/supply-chain-security).
- Shared Oxlint, TypeScript, Node types and Prettier dependencies live at the
  root. Application dependencies remain in the application package. The
  TypeScript compiler stays on 6.0.3 because ts-jest does not support TypeScript
  7; Node typings stay on the selected LTS major.
- `pnpm check` runs typecheck, type-aware linting, formatting, architecture
  checks, unit tests, HTTP lifecycle tests and the application build. The
  Identity/Authentication import restrictions and PostgreSQL foreign-key
  exception are preserved and verified by four regression tests.
- Nest packages move to their eligible 12.x versions. Jest uses Node's
  `--experimental-vm-modules` support to load Nest's ESM packages. Explicit
  TypeScript source roots preserve the `dist/main.js` runtime entrypoint.
- Removed unsupported MongoDB connection options, corrected health checks to use
  Nest's actual MongoDB connection, and declared Express directly,
  since `main.ts` imports it. Replaced the untyped logout request and removed two
  unnecessary test assertions exposed by the new lint configuration.
- Authentication cookies, bearer authorization and response `Set-Cookie` headers
  are now removed from request logs. A regression test checks actual Pino output.

## Dependency audit and remaining issues

The full npm audit drops from **48 advisories** (3 critical, 25 high, 14 moderate,
6 low) to **6** (0 critical, 2 high, 2 moderate, 2 low).

| Package     | Installed | Remaining finding                                        | Follow-up                                        |
| ----------- | --------- | -------------------------------------------------------- | ------------------------------------------------ |
| body-parser | 2.3.0     | High, GHSA-27r3-jxmh-p828 / CVE-2026-111181              | Upgrade to 2.4.0 after October 29, 11:39:39 UTC. |
| multer      | 2.4.0     | High, GHSA-q7qp-rjg7-q26m / CVE-2026-113872              | Upgrade to 2.5.0 after October 29, 11:58:47 UTC. |
| fast-uri    | 3.1.8     | Development tooling: two moderate and two low advisories | 3.1.9 becomes eligible October 26, 23:05:27 UTC. |

The fast-uri IDs are GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h,
GHSA-wjr9-j795-jxcr and GHSA-333x-w4r6-6crp. Eligibility dates follow registry
publication timestamps plus the existing seven-day policy. Reaudit before
upgrading; no vulnerability exclusions were added.

Retained a targeted, exact esbuild 0.28.2 override for Drizzle's legacy loader;
without it the loader selects vulnerable esbuild 0.18.20. Drizzle SQL export was
validated with the updated dependency. Removed redundant legacy security-floor
overrides after refreshing the dependency graph. Drizzle still pulls deprecated
`@esbuild-kit/core-utils` and `@esbuild-kit/esm-loader`; migration requires an
upstream tooling change. The existing glob 10.5.0 deprecation also remains.

All **771 packages** passed registry-signature verification, with no missing or
invalid signatures. An independent review of both lockfile documents checked
all **376 newly selected versions** for release age, deprecation, registry
tarball source and integrity hashes. Dependency installation scripts remain
blocked; the package-manager bootstrap is separately integrity-pinned. These
checks authenticate artifacts and reduce risk; they cannot establish that every
package's source is harmless.

## Containers

Both Dockerfiles use the verified, digest-pinned Node
`24.22.1-alpine3.24` image. Compose pins PostgreSQL
`17.11-alpine3.24` and MongoDB `8.0.34`, preserving existing database majors and
volume paths. Dockerfile frontend `1.27.1` is also digest-pinned. Container pins
are independently verified/scanned; npm's release quarantine applies to npm
packages.

The production image deploys compiled files and production dependencies only,
removes unused bundled package managers and runs as the built-in non-root Node
user. Compose provides PID 1 handling with `init: true`, replacing the unpinned
`apk add dumb-init` installation. Standalone Docker users should pass `--init`.
Development mounts only application source read-only and binds published ports
to localhost. Production defaults to localhost behind a reverse proxy; set
`HTTP_BIND_ADDRESS` explicitly when another bind address is required. The new
`.dockerignore` excludes credentials, dependencies and build artifacts.

Trivy 0.76.0 with the refreshed October 24 database reports:

| Image                        | Architecture    | Critical | High | Medium | Low | Unknown |
| ---------------------------- | --------------- | -------- | ---- | ------ | --- | ------- |
| Built production auth server | arm64           | 0        | 2    | 0      | 0   | 0       |
| PostgreSQL 17.11 Alpine      | arm64 and amd64 | 1        | 25   | 31     | 3   | 1       |
| MongoDB 8.0.34               | arm64 and amd64 | 1        | 68   | 172    | 15  | 9       |

The application findings are the two quarantined runtime fixes above. The
database images still contain upstream findings, including CVE-2025-68121 in
the Go runtime embedded in `gosu`. Scanner detection does not establish whether
those code paths are exploitable. These upstream images require corrected
releases and rescanning; no vulnerability-free claim is made. MongoDB results
reuse the same exact digest and same-day two-platform scan from the AgroHands
review. The [scan summary](container-security-review.json) records exact image
references and high/critical IDs. Existing production data was not upgraded.

## Verification

- `pnpm check`: typecheck, type-aware Oxlint, formatting, four architecture
  checks, 53 unit tests across 10 suites, three HTTP lifecycle tests and build.
- Registry signatures and independent lockfile review passed.
- Production and development Docker images build on arm64; CI also builds both
  images on Linux amd64 using immutable action revisions and read-only token
  permissions.
- Drizzle exports the current PostgreSQL schema successfully.
- The production image passed real PostgreSQL and MongoDB health, registration,
  login, refresh rotation, replay rejection, cascade revocation and logout
  checks. Both runs also verified credential redaction, non-root execution and
  read-only operation, using disposable databases and loopback-only ports.

The PR remains a draft because known runtime and upstream database image
vulnerabilities remain. CI checks application/tooling compatibility and registry
signatures; a green result does not mean the vulnerability audit is clean. This
repository had no vulnerability gate to weaken, and this refresh adds no audit
ignore rules. Rerun audit, checks and container scans when the quarantined fixes
become eligible.
