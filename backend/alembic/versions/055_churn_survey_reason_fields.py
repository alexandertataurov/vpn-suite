"""Add churn_survey reason_group, reason_code, free_text, offer_accepted.

Revision ID: 055
Revises: 054
Create Date: 2026-03-07

"""

from alembic import op
import sqlalchemy as sa

revision = "055"
down_revision = "054"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("churn_surveys", sa.Column("reason_group", sa.String(32), nullable=True))
    op.add_column("churn_surveys", sa.Column("reason_code", sa.String(32), nullable=True))
    op.add_column("churn_surveys", sa.Column("free_text", sa.String(512), nullable=True))
    op.add_column("churn_surveys", sa.Column("offer_accepted", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("churn_surveys", "offer_accepted")
    op.drop_column("churn_surveys", "free_text")
    op.drop_column("churn_surveys", "reason_code")
    op.drop_column("churn_surveys", "reason_group")
