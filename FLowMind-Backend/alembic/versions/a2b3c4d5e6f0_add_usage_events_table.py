"""add usage_events table for token usage tracking

Revision ID: a2b3c4d5e6f0
Revises: f1a2b3c4d5e6
Create Date: 2026-06-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'a2b3c4d5e6f0'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'usage_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('feature', sa.String(50), nullable=False),
        sa.Column('input_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('output_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('total_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('cached_input_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('estimated_cost', sa.Numeric(12, 6), nullable=False, server_default='0'),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_index('idx_usage_events_user_id', 'usage_events', ['user_id'])
    op.create_index('idx_usage_events_created_at', 'usage_events', ['created_at'])
    op.create_index('idx_usage_events_feature', 'usage_events', ['feature'])
    op.create_index('idx_usage_events_user_created', 'usage_events', ['user_id', 'created_at'])
    op.create_index('idx_usage_events_feature_created', 'usage_events', ['feature', 'created_at'])


def downgrade() -> None:
    op.drop_table('usage_events')
