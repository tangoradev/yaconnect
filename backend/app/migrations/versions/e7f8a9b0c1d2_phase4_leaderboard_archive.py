from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e7f8a9b0c1d2"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leaderboard_archive",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("week_start", sa.DateTime(), nullable=False),
        sa.Column("week_end", sa.DateTime(), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("type", "period", "week_start", name="uq_leaderboard_archive_type_period_week"),
    )
    op.create_index("ix_leaderboard_archive_id", "leaderboard_archive", ["id"])
    op.create_index("ix_leaderboard_archive_type", "leaderboard_archive", ["type"])
    op.create_index("ix_leaderboard_archive_period", "leaderboard_archive", ["period"])
    op.create_index("ix_leaderboard_archive_week_start", "leaderboard_archive", ["week_start"])
    op.create_index("ix_leaderboard_archive_week_end", "leaderboard_archive", ["week_end"])
    op.create_index("ix_leaderboard_archive_created_at", "leaderboard_archive", ["created_at"])
    op.create_index("ix_leaderboard_archive_type_created", "leaderboard_archive", ["type", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_leaderboard_archive_type_created", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_created_at", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_week_end", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_week_start", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_period", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_type", table_name="leaderboard_archive")
    op.drop_index("ix_leaderboard_archive_id", table_name="leaderboard_archive")
    op.drop_table("leaderboard_archive")

