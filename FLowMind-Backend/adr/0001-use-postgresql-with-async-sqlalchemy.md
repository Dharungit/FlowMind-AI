# 0001. Use PostgreSQL with Async SQLAlchemy

- Status: accepted
- Date: 2026-06-11

## Context

FlowMind-Backend is a stateless FastAPI proxy with no database. Implementing user authentication, session management, and future chat persistence requires a production-grade relational database. The system needs async compatibility (FastAPI is async-native), schema migrations, and rich querying for user and session data.

## Decision

We will use PostgreSQL as the database engine with `sqlalchemy[asyncio]` as the ORM and `asyncpg` as the async driver. Schema migrations will be managed with Alembic.

## Consequences

- Positive: PostgreSQL provides relational integrity, JSONB for flexible metadata, robust concurrency, and production operational maturity.
- Positive: Async SQLAlchemy integrates natively with FastAPI's async request handling without blocking the event loop.
- Positive: Alembic provides version-controlled, repeatable schema migrations.
- Negative: Adds a database dependency to the deployment — operations must manage PostgreSQL, connection pooling, and backups.
- Negative: Schema changes require migration scripts rather than ad-hoc modifications.
