# 0002. Use Google OAuth via google-auth Library

- Status: accepted
- Date: 2026-06-11

## Context

The application needs to authenticate users via Google Sign-In. The frontend obtains a Google ID token (via NextAuth or Google's Sign-In SDK) and the backend must verify this token, extract user identity, and create or update the local user record. The verification requires fetching Google's JWKS keys, validating the RS256 signature, checking expiry, and confirming the audience.

## Decision

We will use Google's official `google-auth` Python library for ID token verification. The library handles JWKS key fetch and caching, signature verification, expiry checks, and audience validation in a single `verify_oauth2_token()` call.

## Consequences

- Positive: Google-official library, well-maintained, follows Google's security recommendations.
- Positive: Minimal code — single function call handles the full verification pipeline.
- Positive: JWKS caching is built-in, avoiding repeated network calls to Google.
- Negative: Tight coupling to Google as the sole identity provider — adding other OAuth providers later requires additional libraries or code paths.
