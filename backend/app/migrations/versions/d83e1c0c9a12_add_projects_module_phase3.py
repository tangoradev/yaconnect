from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "d83e1c0c9a12"
down_revision = "0b79d8cbf540"
branch_labels = None
depends_on = None


def upgrade() -> None:
    project_status = postgresql.ENUM(
        "DRAFT",
        "IN_DISCUSSION",
        "COMMUNITY_VALIDATION",
        "RECOMMENDED",
        "AMBASSADOR_PROJECT",
        "ARCHIVED",
        name="projectstatus",
        create_type=False,
    )
    project_media_type = postgresql.ENUM("image", "document", "video", name="projectmediatype", create_type=False)
    project_vote_type = postgresql.ENUM("support", "oppose", name="projectvotetype", create_type=False)

    project_status.create(op.get_bind(), checkfirst=True)
    project_media_type.create(op.get_bind(), checkfirst=True)
    project_vote_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("problem_statement", sa.Text(), nullable=False),
        sa.Column("objectives", sa.Text(), nullable=False),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", project_status, nullable=False, server_default="DRAFT"),
        sa.Column("budget_estimate", sa.Numeric(12, 2), nullable=True),
        sa.Column("partners_needed", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(), nullable=True),
        sa.Column("source_post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("forum_posts.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_projects_id", "projects", ["id"])
    op.create_index("ix_projects_title", "projects", ["title"])
    op.create_index("ix_projects_region_id", "projects", ["region_id"])
    op.create_index("ix_projects_created_by", "projects", ["created_by"])
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_projects_source_post_id", "projects", ["source_post_id"])
    op.create_index("ix_projects_created_at", "projects", ["created_at"])
    op.create_index("ix_projects_updated_at", "projects", ["updated_at"])

    op.create_table(
        "project_media",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("file_url", sa.String(), nullable=False),
        sa.Column("type", project_media_type, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_project_media_id", "project_media", ["id"])
    op.create_index("ix_project_media_project_id", "project_media", ["project_id"])

    op.create_table(
        "project_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_project_comments_id", "project_comments", ["id"])
    op.create_index("ix_project_comments_project_id", "project_comments", ["project_id"])
    op.create_index("ix_project_comments_user_id", "project_comments", ["user_id"])
    op.create_index("ix_project_comments_created_at", "project_comments", ["created_at"])

    op.create_table(
        "project_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("vote_type", project_vote_type, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("project_id", "user_id", name="uq_project_vote_user"),
    )
    op.create_index("ix_project_votes_id", "project_votes", ["id"])
    op.create_index("ix_project_votes_project_id", "project_votes", ["project_id"])
    op.create_index("ix_project_votes_user_id", "project_votes", ["user_id"])
    op.create_index("ix_project_votes_created_at", "project_votes", ["created_at"])

    op.create_table(
        "project_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("status", project_status, nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_project_status_history_id", "project_status_history", ["id"])
    op.create_index("ix_project_status_history_project_id", "project_status_history", ["project_id"])
    op.create_index("ix_project_status_history_status", "project_status_history", ["status"])
    op.create_index("ix_project_status_history_changed_by", "project_status_history", ["changed_by"])
    op.create_index("ix_project_status_history_created_at", "project_status_history", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_project_status_history_created_at", table_name="project_status_history")
    op.drop_index("ix_project_status_history_changed_by", table_name="project_status_history")
    op.drop_index("ix_project_status_history_status", table_name="project_status_history")
    op.drop_index("ix_project_status_history_project_id", table_name="project_status_history")
    op.drop_index("ix_project_status_history_id", table_name="project_status_history")
    op.drop_table("project_status_history")

    op.drop_index("ix_project_votes_created_at", table_name="project_votes")
    op.drop_index("ix_project_votes_user_id", table_name="project_votes")
    op.drop_index("ix_project_votes_project_id", table_name="project_votes")
    op.drop_index("ix_project_votes_id", table_name="project_votes")
    op.drop_table("project_votes")

    op.drop_index("ix_project_comments_created_at", table_name="project_comments")
    op.drop_index("ix_project_comments_user_id", table_name="project_comments")
    op.drop_index("ix_project_comments_project_id", table_name="project_comments")
    op.drop_index("ix_project_comments_id", table_name="project_comments")
    op.drop_table("project_comments")

    op.drop_index("ix_project_media_project_id", table_name="project_media")
    op.drop_index("ix_project_media_id", table_name="project_media")
    op.drop_table("project_media")

    op.drop_index("ix_projects_updated_at", table_name="projects")
    op.drop_index("ix_projects_created_at", table_name="projects")
    op.drop_index("ix_projects_source_post_id", table_name="projects")
    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_projects_created_by", table_name="projects")
    op.drop_index("ix_projects_region_id", table_name="projects")
    op.drop_index("ix_projects_title", table_name="projects")
    op.drop_index("ix_projects_id", table_name="projects")
    op.drop_table("projects")

    postgresql.ENUM(name="projectvotetype").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="projectmediatype").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="projectstatus").drop(op.get_bind(), checkfirst=True)
