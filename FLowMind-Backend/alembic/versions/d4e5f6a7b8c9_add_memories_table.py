"""add memories table with pgvector

Revision ID: d4e5f6a7b8c9
Revises: a1b2c3d4e5f6
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.create_table(
        'memories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('memory', sa.Text, nullable=False),
        sa.Column('memory_type', sa.String(64), nullable=False),
        sa.Column('importance', sa.Float, nullable=False, server_default='0.5'),
        sa.Column('access_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.execute("ALTER TABLE memories ADD COLUMN embedding vector(1536)")

    op.execute(
        "ALTER TABLE memories ADD CONSTRAINT chk_memory_type "
        "CHECK (memory_type IN ('fact', 'preference', 'project', 'skill', 'goal', 'custom'))"
    )
    op.execute(
        "ALTER TABLE memories ADD CONSTRAINT chk_importance "
        "CHECK (importance >= 0.0 AND importance <= 1.0)"
    )

    op.execute(
        "CREATE INDEX idx_memories_embedding ON memories "
        "USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 200)"
    )


def downgrade() -> None:
    op.drop_table('memories')
    op.execute('DROP EXTENSION IF EXISTS vector')
