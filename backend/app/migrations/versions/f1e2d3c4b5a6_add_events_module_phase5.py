from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f1e2d3c4b5a6"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    event_status = postgresql.ENUM("DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED", name="eventstatus", create_type=False)
    registration_status = postgresql.ENUM("REGISTERED", "CANCELLED", "ATTENDED", name="eventregistrationstatus", create_type=False)

    event_status.create(op.get_bind(), checkfirst=True)
    registration_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("banner_url", sa.String(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", event_status, nullable=False, server_default="DRAFT"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_events_id", "events", ["id"])
    op.create_index("ix_events_title", "events", ["title"])
    op.create_index("ix_events_project_id", "events", ["project_id"])
    op.create_index("ix_events_region_id", "events", ["region_id"])
    op.create_index("ix_events_created_by", "events", ["created_by"])
    op.create_index("ix_events_status", "events", ["status"])
    op.create_index("ix_events_start_date", "events", ["start_date"])
    op.create_index("ix_events_end_date", "events", ["end_date"])
    op.create_index("ix_events_created_at", "events", ["created_at"])
    op.create_index("ix_events_updated_at", "events", ["updated_at"])

    op.create_table(
        "event_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", registration_status, nullable=False, server_default="REGISTERED"),
        sa.Column("registered_at", sa.DateTime(), nullable=False),
        sa.Column("attended_at", sa.DateTime(), nullable=True),
        sa.Column("reward_granted_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_registration_user"),
    )
    op.create_index("ix_event_registrations_id", "event_registrations", ["id"])
    op.create_index("ix_event_registrations_event_id", "event_registrations", ["event_id"])
    op.create_index("ix_event_registrations_user_id", "event_registrations", ["user_id"])
    op.create_index("ix_event_registrations_status", "event_registrations", ["status"])
    op.create_index("ix_event_registrations_registered_at", "event_registrations", ["registered_at"])


def downgrade() -> None:
    op.drop_index("ix_event_registrations_registered_at", table_name="event_registrations")
    op.drop_index("ix_event_registrations_status", table_name="event_registrations")
    op.drop_index("ix_event_registrations_user_id", table_name="event_registrations")
    op.drop_index("ix_event_registrations_event_id", table_name="event_registrations")
    op.drop_index("ix_event_registrations_id", table_name="event_registrations")
    op.drop_table("event_registrations")

    op.drop_index("ix_events_updated_at", table_name="events")
    op.drop_index("ix_events_created_at", table_name="events")
    op.drop_index("ix_events_end_date", table_name="events")
    op.drop_index("ix_events_start_date", table_name="events")
    op.drop_index("ix_events_status", table_name="events")
    op.drop_index("ix_events_created_by", table_name="events")
    op.drop_index("ix_events_region_id", table_name="events")
    op.drop_index("ix_events_project_id", table_name="events")
    op.drop_index("ix_events_title", table_name="events")
    op.drop_index("ix_events_id", table_name="events")
    op.drop_table("events")

    postgresql.ENUM(name="eventregistrationstatus").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="eventstatus").drop(op.get_bind(), checkfirst=True)

