from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.config import settings
from app.models.activity import Activity
from app.models.data_source import DataSource
from app.models.employee import Employee
from app.models.lead import Lead
from app.models.sync_run import SyncRun
from app.models.target import Target
from app.models.user import User
from app.seed_config import DEFAULT_SOURCES, DEFAULT_TARGETS
from app.services.normalize import row_to_lead_record
from app.services.sheets_client import GoogleSheetsClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def seed_database(db: Session):
    for name in ["Dawood", "Hanya"]:
        if not db.query(Employee).filter(Employee.name == name).first():
            db.add(Employee(name=name, email=f"{name.lower()}@vectoriseinc.dev"))

    db.flush()
    employees = {e.name: e for e in db.query(Employee).all()}

    for src in DEFAULT_SOURCES:
        existing = (
            db.query(DataSource)
            .filter(DataSource.sheet_gid == src["sheet_gid"])
            .first()
        )
        if not existing:
            db.add(
                DataSource(
                    name=src["name"],
                    employee_name=src["employee_name"],
                    category=src["category"],
                    spreadsheet_id=settings.google_spreadsheet_id,
                    sheet_gid=src["sheet_gid"],
                    data_type=src["data_type"],
                )
            )

    for target in DEFAULT_TARGETS:
        employee = employees.get(target["employee_name"])
        if not employee:
            continue
        exists = (
            db.query(Target)
            .filter(
                Target.employee_id == employee.id,
                Target.activity_type == target["activity_type"],
                Target.period == target["period"],
            )
            .first()
        )
        if not exists:
            db.add(
                Target(
                    employee_id=employee.id,
                    activity_type=target["activity_type"],
                    target_value=target["target_value"],
                    period=target["period"],
                )
            )

    if not db.query(User).filter(User.email == settings.admin_email).first():
        db.add(
            User(
                email=settings.admin_email,
                hashed_password=pwd_context.hash(settings.admin_password),
                role="admin",
            )
        )
    db.commit()


class SyncService:
    def __init__(self, db: Session):
        self.db = db
        self.client = GoogleSheetsClient()

    def run(self) -> SyncRun:
        run = SyncRun(status="running")
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        try:
            titles = self.client.get_sheet_titles(settings.google_spreadsheet_id)
            sources = db_sources(self.db)
            duplicate_map: dict[str, list[int]] = {}
            leads_upserted = 0
            activities_upserted = 0
            rows_processed = 0

            for source in sources:
                title = titles.get(source.sheet_gid) or source.name
                source.sheet_title = title
                rows = self.client.fetch_sheet_rows(settings.google_spreadsheet_id, title)
                employee = (
                    self.db.query(Employee)
                    .filter(Employee.name == source.employee_name)
                    .first()
                )
                if not employee:
                    continue

                for idx, row in enumerate(rows, start=2):
                    record = row_to_lead_record(
                        row,
                        row_number=idx,
                        source={
                            "name": source.name,
                            "category": source.category,
                            "sheet_gid": source.sheet_gid,
                            "sheet_title": title,
                            "data_type": source.data_type,
                        },
                        employee_id=employee.id,
                        spreadsheet_id=settings.google_spreadsheet_id,
                    )
                    if not record:
                        continue
                    rows_processed += 1
                    lead = (
                        self.db.query(Lead)
                        .filter(
                            Lead.source_gid == source.sheet_gid,
                            Lead.source_row == idx,
                        )
                        .first()
                    )
                    if not lead:
                        lead = Lead(external_id=record["external_id"])
                        self.db.add(lead)
                    for field in [
                        "external_id",
                        "company_name",
                        "contact_name",
                        "email",
                        "linkedin_url",
                        "industry",
                        "category",
                        "employee_id",
                        "current_stage",
                        "reply_status",
                        "meeting_status",
                        "opportunity_status",
                        "source_sheet",
                        "source_sheet_id",
                        "source_row",
                        "source_gid",
                        "last_activity_date",
                        "next_follow_up_date",
                    ]:
                        setattr(lead, field, record[field])
                    lead.synced_at = datetime.utcnow()
                    lead.updated_at = datetime.utcnow()
                    self.db.flush()
                    leads_upserted += 1

                    self.db.query(Activity).filter(Activity.lead_id == lead.id).delete()
                    for act in record["activities"]:
                        self.db.add(
                            Activity(
                                lead_id=lead.id,
                                employee_id=employee.id,
                                activity_type=act["activity_type"],
                                activity_date=act.get("activity_date"),
                                source=title,
                            )
                        )
                        activities_upserted += 1

                    dup_key = record.get("duplicate_key")
                    if dup_key:
                        duplicate_map.setdefault(dup_key, []).append(lead.id)

                source.last_sync_at = datetime.utcnow()
                source.last_sync_status = "success"

            mark_duplicates(self.db, duplicate_map)
            run.status = "success"
            run.rows_processed = rows_processed
            run.leads_upserted = leads_upserted
            run.activities_upserted = activities_upserted
            run.message = f"Synced {leads_upserted} leads from {len(sources)} sources"
        except Exception as exc:
            run.status = "failed"
            run.message = str(exc)
            self.db.rollback()
            self.db.add(run)
        finally:
            run.finished_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(run)
        return run


def db_sources(db: Session) -> list[DataSource]:
    return db.query(DataSource).filter(DataSource.is_active.is_(True)).all()


def mark_duplicates(db: Session, duplicate_map: dict[str, list[int]]):
    for lead in db.query(Lead).all():
        lead.is_duplicate = False
        lead.duplicate_group = None
    for key, lead_ids in duplicate_map.items():
        if len(lead_ids) < 2:
            continue
        for lead_id in lead_ids:
            lead = db.get(Lead, lead_id)
            if lead:
                lead.is_duplicate = True
                lead.duplicate_group = key
