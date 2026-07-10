# 0003. Use HS256 JWT with Environment Variable Secret

- Status: accepted
- Date: 2026-06-11

## Context

The application issues short-lived access tokens and longer-lived refresh tokens for API authentication. The signing mechanism must be secure, simple to configure in a single-service deployment, and easy to rotate.

## Decision

We will use HS256 (HMAC with SHA-256) symmetric signing for JWT access tokens. The signing secret is provided via the `JWT_SECRET` environment variable. Token verification uses the `PyJWT` library.

## Consequences

- Positive: Simple configuration — one env var, no key management infrastructure.
- Positive: Fast verification — symmetric crypto is computationally cheaper than asymmetric.
- Positive: `PyJWT` is a mature, well-audited library.
- Negative: The same key signs and verifies — if compromised, an attacker can forge tokens. Mitigation: rotate the secret and set appropriate expiry.
- Negative: Not suitable for multi-service architectures where independent services need to verify tokens without access to the signing key. (If needed later, switch to RS256.)
