from alembic import op


revision = "a4c1f6d4d8b3"
down_revision = "d83e1c0c9a12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_VOTE'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_COMMENT'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_STATUS_CHANGE'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_RECOMMENDED'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_CONVERTED'")


def downgrade() -> None:
    pass
