from alembic import op


revision = "b7d2c0e5a1f4"
down_revision = "a4c1f6d4d8b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_forum_topics_fts ON forum_topics USING GIN (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'')))"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_forum_posts_fts ON forum_posts USING GIN (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(content,'')))"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_projects_fts ON projects USING GIN (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(problem_statement,'') || ' ' || coalesce(objectives,'') || ' ' || coalesce(partners_needed,'')))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_projects_fts")
    op.execute("DROP INDEX IF EXISTS ix_forum_posts_fts")
    op.execute("DROP INDEX IF EXISTS ix_forum_topics_fts")
