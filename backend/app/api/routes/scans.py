import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Scan, Host, User, AuditLog, ScanStatus
from app.schemas.schemas import ScanCreate, ScanResponse
from app.utils.validation import validate_target
from app.workers.scan_worker import run_scan_job
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not scan_in.user_confirmed_auth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must explicitly confirm that you are authorized to scan this target."
        )

    is_valid, target_type, clean_target_or_err = validate_target(scan_in.target)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target: {clean_target_or_err}"
        )

    target = clean_target_or_err

    # Create Scan Record
    new_scan = Scan(
        target=target,
        target_type=target_type,
        profile=scan_in.profile.upper(),
        status=ScanStatus.QUEUED,
        is_demo=scan_in.is_demo,
        user_confirmed_auth=True,
        user_id=current_user.id if current_user else None
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # Add Audit Log
    audit = AuditLog(
        user_email=current_user.email if current_user else "anonymous",
        action="Scan Started",
        details=f"Scan ID {new_scan.id} started against target {target} ({target_type}) profile {scan_in.profile} (Demo: {scan_in.is_demo})"
    )
    db.add(audit)
    db.commit()

    # Launch scan asynchronously in background task
    background_tasks.add_task(run_scan_job, new_scan.id)

    return new_scan

from sqlalchemy.orm import Session, selectinload

@router.get("", response_model=List[ScanResponse])
def list_scans(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
    return scans

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).options(
        selectinload(Scan.hosts).selectinload(Host.ports),
        selectinload(Scan.hosts).selectinload(Host.services),
        selectinload(Scan.hosts).selectinload(Host.findings),
        selectinload(Scan.hosts).selectinload(Host.dns_records),
        selectinload(Scan.scan_logs)
    ).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return scan

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    db.delete(scan)
    db.commit()

    audit = AuditLog(
        user_email=current_user.email if current_user else "anonymous",
        action="Scan Deleted",
        details=f"Scan ID {scan_id} deleted."
    )
    db.add(audit)
    db.commit()

    return None
