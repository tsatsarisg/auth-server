# ADR 0003: AES-256-GCM encryption of stored password hashes

**Status:** Accepted

## Context

Passwords are hashed with scrypt (versioned cost parameters, per-user salt),
which is the actual defense against offline cracking. The question is whether
the stored hash itself should additionally be encrypted at rest.

Threat model: a database-only compromise (stolen backup, leaked dump, misused
read replica) where the attacker obtains table contents but not the
application's environment.

## Decision

Password hashes are encrypted with AES-256-GCM before persistence, using a key
(`ENCRYPTION_KEY_BASE64`) that lives only in the application environment. The
encryption is applied in exactly one place per database — the persistence
mapper — so domain objects always carry the plaintext scrypt hash and
repositories/handlers never see ciphertext. GCM's authenticated encryption
also detects tampering with stored values.

## Consequences

- A database-only leak yields ciphertext: the attacker cannot even begin
  offline cracking without also compromising the application environment.
- The key is a single point of failure: losing it invalidates every stored
  credential (users must reset passwords). Key rotation requires re-encrypting
  the column; the GCM payload format (`iv:ciphertext:tag`) leaves room to add
  a key-version prefix when rotation is implemented.
- Each credential read/write costs one AES operation — negligible next to the
  deliberate ~100ms scrypt cost.
- This is defense in depth, not a substitute for hashing: scrypt parameters
  are chosen as if the encryption layer did not exist.
