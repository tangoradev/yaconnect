from alembic import op
import sqlalchemy as sa
import uuid


revision = "d4e5f6a7b8c9"
down_revision = "c1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO forum_badges (name, description, icon) VALUES "
        "('First Post', 'Publier votre première discussion sur le forum', '📝'),"
        "('First 100 Points', 'Atteindre 100 points', '💯'),"
        "('Project Recommended', 'Avoir un projet recommandé par la communauté', '⭐'),"
        "('Ambassador', 'Faire partie des ambassadeurs GRIN17', '🏆') "
        "ON CONFLICT (name) DO NOTHING"
    )

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, name FROM forum_badges WHERE name IN ('First Post','First 100 Points','Project Recommended','Ambassador')")).fetchall()
    badge_id = {r.name: r.id for r in rows}

    badge_rules_table = sa.table(
        "gamification_badge_rules",
        sa.column("id", sa.dialects.postgresql.UUID(as_uuid=True)),
        sa.column("badge_id", sa.Integer()),
        sa.column("rule_type", sa.String()),
        sa.column("action_type", sa.String()),
        sa.column("threshold", sa.Integer()),
        sa.column("metadata", sa.dialects.postgresql.JSONB()),
        sa.column("is_active", sa.Boolean()),
    )

    inserts = []
    if "First Post" in badge_id:
        inserts.append(
            {
                "id": uuid.uuid4(),
                "badge_id": badge_id["First Post"],
                "rule_type": "FIRST_ACTION",
                "action_type": "FORUM_POST_CREATE",
                "threshold": None,
                "metadata": {},
                "is_active": True,
            }
        )
    if "First 100 Points" in badge_id:
        inserts.append(
            {
                "id": uuid.uuid4(),
                "badge_id": badge_id["First 100 Points"],
                "rule_type": "SCORE_THRESHOLD",
                "action_type": None,
                "threshold": 100,
                "metadata": {},
                "is_active": True,
            }
        )
    if "Project Recommended" in badge_id:
        inserts.append(
            {
                "id": uuid.uuid4(),
                "badge_id": badge_id["Project Recommended"],
                "rule_type": "ON_ACTION",
                "action_type": "PROJECT_RECOMMENDED",
                "threshold": None,
                "metadata": {},
                "is_active": True,
            }
        )
    if "Ambassador" in badge_id:
        inserts.append(
            {
                "id": uuid.uuid4(),
                "badge_id": badge_id["Ambassador"],
                "rule_type": "LEVEL_REACHED",
                "action_type": None,
                "threshold": None,
                "metadata": {"level": "Ambassador"},
                "is_active": True,
            }
        )

    if inserts:
        op.bulk_insert(badge_rules_table, inserts)


def downgrade() -> None:
    op.execute("DELETE FROM gamification_badge_rules WHERE rule_type IN ('FIRST_ACTION','SCORE_THRESHOLD','ON_ACTION','LEVEL_REACHED')")
