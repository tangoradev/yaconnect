from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


revision = "c1a2b3c4d5e6"
down_revision = "b7d2c0e5a1f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gamification_levels",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("min_score", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("name", name="uq_gamification_levels_name"),
        sa.UniqueConstraint("sort_order", name="uq_gamification_levels_sort_order"),
    )
    op.create_index("ix_gamification_levels_id", "gamification_levels", ["id"])
    op.create_index("ix_gamification_levels_name", "gamification_levels", ["name"])
    op.create_index("ix_gamification_levels_min_score", "gamification_levels", ["min_score"])
    op.create_index("ix_gamification_levels_sort_order", "gamification_levels", ["sort_order"])
    op.create_index("ix_gamification_levels_is_active", "gamification_levels", ["is_active"])

    op.create_table(
        "gamification_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("multiplier", sa.Numeric(6, 3), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("action_type", name="uq_gamification_rules_action_type"),
    )
    op.create_index("ix_gamification_rules_id", "gamification_rules", ["id"])
    op.create_index("ix_gamification_rules_action_type", "gamification_rules", ["action_type"])
    op.create_index("ix_gamification_rules_is_active", "gamification_rules", ["is_active"])
    op.create_index("ix_gamification_rules_updated_at", "gamification_rules", ["updated_at"])

    op.create_table(
        "user_activity_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("reference_id", sa.String(), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_activity_log_id", "user_activity_log", ["id"])
    op.create_index("ix_user_activity_log_user_id", "user_activity_log", ["user_id"])
    op.create_index("ix_user_activity_log_action_type", "user_activity_log", ["action_type"])
    op.create_index("ix_user_activity_log_reference_id", "user_activity_log", ["reference_id"])
    op.create_index("ix_user_activity_log_created_at", "user_activity_log", ["created_at"])
    op.create_index("ix_user_activity_log_user_created", "user_activity_log", ["user_id", "created_at"])
    op.create_index("ix_user_activity_log_action_created", "user_activity_log", ["action_type", "created_at"])

    op.create_table(
        "user_scores_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_scores_history_id", "user_scores_history", ["id"])
    op.create_index("ix_user_scores_history_user_id", "user_scores_history", ["user_id"])
    op.create_index("ix_user_scores_history_created_at", "user_scores_history", ["created_at"])
    op.create_index("ix_user_scores_history_user_created", "user_scores_history", ["user_id", "created_at"])

    op.create_table(
        "leaderboard_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("type", name="uq_leaderboard_cache_type"),
    )
    op.create_index("ix_leaderboard_cache_id", "leaderboard_cache", ["id"])
    op.create_index("ix_leaderboard_cache_type", "leaderboard_cache", ["type"])
    op.create_index("ix_leaderboard_cache_updated_at", "leaderboard_cache", ["updated_at"])

    op.create_table(
        "gamification_badge_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("badge_id", sa.Integer(), sa.ForeignKey("forum_badges.id"), nullable=False),
        sa.Column("rule_type", sa.String(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=True),
        sa.Column("threshold", sa.Integer(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("badge_id", "rule_type", name="uq_gamification_badge_rules_badge_rule_type"),
    )
    op.create_index("ix_gamification_badge_rules_id", "gamification_badge_rules", ["id"])
    op.create_index("ix_gamification_badge_rules_badge_id", "gamification_badge_rules", ["badge_id"])
    op.create_index("ix_gamification_badge_rules_rule_type", "gamification_badge_rules", ["rule_type"])
    op.create_index("ix_gamification_badge_rules_action_type", "gamification_badge_rules", ["action_type"])
    op.create_index("ix_gamification_badge_rules_active", "gamification_badge_rules", ["is_active"])

    op.create_table(
        "gamification_missions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("requirements", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("reward_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("starts_at", sa.DateTime(), nullable=True),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("code", name="uq_gamification_missions_code"),
    )
    op.create_index("ix_gamification_missions_id", "gamification_missions", ["id"])
    op.create_index("ix_gamification_missions_code", "gamification_missions", ["code"])
    op.create_index("ix_gamification_missions_is_active", "gamification_missions", ["is_active"])
    op.create_index("ix_gamification_missions_starts_at", "gamification_missions", ["starts_at"])
    op.create_index("ix_gamification_missions_ends_at", "gamification_missions", ["ends_at"])
    op.create_index("ix_gamification_missions_created_at", "gamification_missions", ["created_at"])

    op.create_table(
        "user_mission_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("mission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gamification_missions.id"), nullable=False),
        sa.Column("progress", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("claimed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "mission_id", name="uq_user_mission_progress_user_mission"),
    )
    op.create_index("ix_user_mission_progress_id", "user_mission_progress", ["id"])
    op.create_index("ix_user_mission_progress_user_id", "user_mission_progress", ["user_id"])
    op.create_index("ix_user_mission_progress_mission_id", "user_mission_progress", ["mission_id"])
    op.create_index("ix_user_mission_progress_is_completed", "user_mission_progress", ["is_completed"])
    op.create_index("ix_user_mission_progress_created_at", "user_mission_progress", ["created_at"])
    op.create_index("ix_user_mission_progress_updated_at", "user_mission_progress", ["updated_at"])
    op.create_index("ix_user_mission_progress_user_updated", "user_mission_progress", ["user_id", "updated_at"])

    op.execute(
        "INSERT INTO gamification_levels (id, name, min_score, sort_order, is_active) VALUES "
        "(1, 'Explorer', 0, 1, true),"
        "(2, 'Actor', 50, 2, true),"
        "(3, 'Leader', 200, 3, true),"
        "(4, 'Ambassador', 500, 4, true) "
        "ON CONFLICT (id) DO NOTHING"
    )

    rules_table = sa.table(
        "gamification_rules",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("action_type", sa.String()),
        sa.column("points", sa.Integer()),
        sa.column("multiplier", sa.Numeric(6, 3)),
        sa.column("is_active", sa.Boolean()),
        sa.column("metadata", postgresql.JSONB(astext_type=sa.Text())),
    )
    op.bulk_insert(
        rules_table,
        [
            {"id": uuid.uuid4(), "action_type": "FORUM_POST_CREATE", "points": 5, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_COMMENT_CREATE", "points": 3, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_REACTION_RECEIVED_PERTINENT", "points": 2, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_REACTION_RECEIVED_INNOVATIVE", "points": 4, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_REACTION_RECEIVED_ENVIRONMENTAL_IMPACT", "points": 6, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_REACTION_RECEIVED_SOLIDARITY", "points": 3, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "FORUM_REACTION_RECEIVED_INSPIRING", "points": 4, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_SUBMIT", "points": 10, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_RECOMMENDED", "points": 25, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_VOTE_CAST", "points": 1, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_VOTE_TOGGLE_OFF", "points": -1, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_VOTE_SUPPORT", "points": 1, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "PROJECT_COMMENT_CREATE", "points": 2, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "MISSION_COMPLETED", "points": 0, "multiplier": 1, "is_active": True, "metadata": {}},
            {"id": uuid.uuid4(), "action_type": "MULTIPLIER_NEW_USER", "points": 0, "multiplier": 1.2, "is_active": True, "metadata": {"days": 7}},
            {"id": uuid.uuid4(), "action_type": "MULTIPLIER_REGION_ACTIVITY", "points": 0, "multiplier": 1.1, "is_active": True, "metadata": {"top_regions": 2}},
            {"id": uuid.uuid4(), "action_type": "MULTIPLIER_WEEKLY_CHALLENGE", "points": 0, "multiplier": 1.15, "is_active": True, "metadata": {"enabled": True}},
        ],
    )

    missions_table = sa.table(
        "gamification_missions",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("code", sa.String()),
        sa.column("title", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("requirements", postgresql.JSONB(astext_type=sa.Text())),
        sa.column("reward_points", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        missions_table,
        [
            {
                "id": uuid.uuid4(),
                "code": "MISSION_POST_3",
                "title": "Publier 3 discussions",
                "description": "Publiez 3 posts sur le forum",
                "requirements": {"actions": [{"action_type": "FORUM_POST_CREATE", "count": 3}]},
                "reward_points": 10,
                "is_active": True,
            },
            {
                "id": uuid.uuid4(),
                "code": "MISSION_COMMENT_5",
                "title": "Commenter 5 fois",
                "description": "Ajoutez 5 commentaires sur le forum",
                "requirements": {"actions": [{"action_type": "FORUM_COMMENT_CREATE", "count": 5}]},
                "reward_points": 10,
                "is_active": True,
            },
            {
                "id": uuid.uuid4(),
                "code": "MISSION_SUPPORT_2_PROJECTS",
                "title": "Soutenir 2 projets",
                "description": "Votez SUPPORT sur 2 projets",
                "requirements": {"actions": [{"action_type": "PROJECT_VOTE_SUPPORT", "count": 2}]},
                "reward_points": 10,
                "is_active": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_user_mission_progress_user_updated", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_updated_at", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_created_at", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_is_completed", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_mission_id", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_user_id", table_name="user_mission_progress")
    op.drop_index("ix_user_mission_progress_id", table_name="user_mission_progress")
    op.drop_table("user_mission_progress")

    op.drop_index("ix_gamification_missions_created_at", table_name="gamification_missions")
    op.drop_index("ix_gamification_missions_ends_at", table_name="gamification_missions")
    op.drop_index("ix_gamification_missions_starts_at", table_name="gamification_missions")
    op.drop_index("ix_gamification_missions_is_active", table_name="gamification_missions")
    op.drop_index("ix_gamification_missions_code", table_name="gamification_missions")
    op.drop_index("ix_gamification_missions_id", table_name="gamification_missions")
    op.drop_table("gamification_missions")

    op.drop_index("ix_gamification_badge_rules_active", table_name="gamification_badge_rules")
    op.drop_index("ix_gamification_badge_rules_action_type", table_name="gamification_badge_rules")
    op.drop_index("ix_gamification_badge_rules_rule_type", table_name="gamification_badge_rules")
    op.drop_index("ix_gamification_badge_rules_badge_id", table_name="gamification_badge_rules")
    op.drop_index("ix_gamification_badge_rules_id", table_name="gamification_badge_rules")
    op.drop_table("gamification_badge_rules")

    op.drop_index("ix_leaderboard_cache_updated_at", table_name="leaderboard_cache")
    op.drop_index("ix_leaderboard_cache_type", table_name="leaderboard_cache")
    op.drop_index("ix_leaderboard_cache_id", table_name="leaderboard_cache")
    op.drop_table("leaderboard_cache")

    op.drop_index("ix_user_scores_history_user_created", table_name="user_scores_history")
    op.drop_index("ix_user_scores_history_created_at", table_name="user_scores_history")
    op.drop_index("ix_user_scores_history_user_id", table_name="user_scores_history")
    op.drop_index("ix_user_scores_history_id", table_name="user_scores_history")
    op.drop_table("user_scores_history")

    op.drop_index("ix_user_activity_log_action_created", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_user_created", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_created_at", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_reference_id", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_action_type", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_user_id", table_name="user_activity_log")
    op.drop_index("ix_user_activity_log_id", table_name="user_activity_log")
    op.drop_table("user_activity_log")

    op.drop_index("ix_gamification_rules_updated_at", table_name="gamification_rules")
    op.drop_index("ix_gamification_rules_is_active", table_name="gamification_rules")
    op.drop_index("ix_gamification_rules_action_type", table_name="gamification_rules")
    op.drop_index("ix_gamification_rules_id", table_name="gamification_rules")
    op.drop_table("gamification_rules")

    op.drop_index("ix_gamification_levels_is_active", table_name="gamification_levels")
    op.drop_index("ix_gamification_levels_sort_order", table_name="gamification_levels")
    op.drop_index("ix_gamification_levels_min_score", table_name="gamification_levels")
    op.drop_index("ix_gamification_levels_name", table_name="gamification_levels")
    op.drop_index("ix_gamification_levels_id", table_name="gamification_levels")
    op.drop_table("gamification_levels")
