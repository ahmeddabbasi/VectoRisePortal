from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import Activity
from app.models.data_source import DataSource
from app.models.employee import Employee
from app.models.lead import Lead
from app.models.sync_run import SyncRun
from app.schemas.common import (
    ActivityResponse,
    DataSourceResponse,
    EmployeeResponse,
    LeadDetailResponse,
    LeadResponse,
    LoginRequest,
    SyncStatusResponse,
    TokenResponse,
)
from app.services.auth import authenticate_user, create_access_token
from app.services.metrics import MetricsService
from app.services.sync import SyncService

router = APIRouter(prefix="/api")


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.email))


@router.get("/dashboard/overview")
def dashboard_overview(
    period: str = Query("this_month"),
    employee: str | None = Query(None),
    category: str | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return MetricsService(db).overview(period, employee, category, start_date, end_date)


@router.get("/dashboard/activity")
def dashboard_activity(
    period: str = Query("this_month"),
    employee: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return {"series": MetricsService(db).activity_trend(period, employee, category)}


@router.get("/dashboard/pipeline")
def dashboard_pipeline(
    employee: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    service = MetricsService(db)
    return {
        "funnel": service.pipeline_funnel(employee, category),
        "stage_distribution": service.overview("all", employee, category)["stage_distribution"],
    }


@router.get("/dashboard/conversion")
def dashboard_conversion(
    employee: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return MetricsService(db).conversion(employee, category)


@router.get("/employees", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.name).all()


@router.get("/employees/{employee_id}/performance")
def employee_performance(
    employee_id: int,
    period: str = Query("this_month"),
    db: Session = Depends(get_db),
):
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    perf = MetricsService(db).employee_performance(period)
    row = next((p for p in perf if p["employee"] == employee.name), None)
    targets = MetricsService(db).targets_vs_actual("today", employee.name)
    return {"employee": employee.name, "metrics": row, "targets": targets}


@router.get("/leads", response_model=list[LeadResponse])
def list_leads(
    search: str | None = Query(None),
    employee: str | None = Query(None),
    category: str | None = Query(None),
    stage: str | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = db.query(Lead, Employee.name).join(Employee)
    if employee and employee.lower() != "all":
        q = q.filter(Employee.name == employee)
    if category and category.lower() != "all":
        q = q.filter(Lead.category == category)
    if stage and stage.lower() != "all":
        q = q.filter(Lead.current_stage == stage)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            (Lead.company_name.ilike(like))
            | (Lead.contact_name.ilike(like))
            | (Lead.email.ilike(like))
            | (Lead.linkedin_url.ilike(like))
        )
    rows = q.order_by(Lead.updated_at.desc()).offset(offset).limit(limit).all()
    results = []
    for lead, employee_name in rows:
        item = LeadResponse.model_validate(lead)
        item.employee_name = employee_name
        results.append(item)
    return results


@router.get("/leads/{lead_id}", response_model=LeadDetailResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Lead, Employee.name)
        .join(Employee)
        .filter(Lead.id == lead_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead, employee_name = row
    activities = (
        db.query(Activity)
        .filter(Activity.lead_id == lead.id)
        .order_by(Activity.activity_date.asc(), Activity.id.asc())
        .all()
    )
    detail = LeadDetailResponse.model_validate(lead)
    detail.employee_name = employee_name
    detail.activities = [ActivityResponse.model_validate(a) for a in activities]
    return detail


@router.get("/activities")
def list_activities(
    period: str = Query("this_month"),
    employee: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return {"series": MetricsService(db).activity_trend(period, employee, category)}


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = [row[0] for row in db.query(Lead.category).distinct().order_by(Lead.category).all()]
    return {"categories": cats}


@router.get("/reports/summary")
def reports_summary(
    period: str = Query("this_month"),
    employee: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    service = MetricsService(db)
    return {
        "overview": service.overview(period, employee, category),
        "employees": service.employee_performance(period, category),
        "categories": service.category_performance(period),
        "conversion": service.conversion(employee, category),
        "targets": service.targets_vs_actual(period if period in {"today", "this_week", "this_month"} else "today", employee),
    }


@router.get("/settings/sources", response_model=list[DataSourceResponse])
def list_sources(db: Session = Depends(get_db)):
    return db.query(DataSource).order_by(DataSource.employee_name, DataSource.name).all()


@router.get("/settings/targets")
def list_targets(db: Session = Depends(get_db)):
    return MetricsService(db).targets_vs_actual("today")


@router.post("/sync", response_model=SyncStatusResponse)
def trigger_sync(db: Session = Depends(get_db)):
    run = SyncService(db).run()
    return SyncStatusResponse(
        status=run.status,
        last_sync_at=run.finished_at,
        message=run.message,
        rows_processed=run.rows_processed,
        leads_upserted=run.leads_upserted,
    )


@router.get("/sync/status", response_model=SyncStatusResponse)
def sync_status(db: Session = Depends(get_db)):
    run = db.query(SyncRun).order_by(SyncRun.finished_at.desc()).first()
    if not run:
        return SyncStatusResponse(status="never")
    return SyncStatusResponse(
        status=run.status,
        last_sync_at=run.finished_at,
        message=run.message,
        rows_processed=run.rows_processed,
        leads_upserted=run.leads_upserted,
    )
