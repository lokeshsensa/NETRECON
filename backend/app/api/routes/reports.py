from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Scan, Host
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

def fetch_full_scan_dict(scan_id: str, db: Session) -> dict:
    scan = db.query(Scan).options(
        joinedload(Scan.hosts).joinedload(Host.ports),
        joinedload(Scan.hosts).joinedload(Host.services),
        joinedload(Scan.hosts).joinedload(Host.findings),
        joinedload(Scan.hosts).joinedload(Host.dns_records)
    ).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    # Serialize to dictionary structure
    hosts_list = []
    for h in scan.hosts:
        hosts_list.append({
            "id": h.id,
            "ip_address": h.ip_address,
            "hostname": h.hostname,
            "status": h.status,
            "mac_address": h.mac_address,
            "vendor": h.vendor,
            "risk_level": h.risk_level,
            "ports": [
                {
                    "port_number": p.port_number,
                    "protocol": p.protocol,
                    "service_name": p.service_name,
                    "product": p.product,
                    "version": p.version
                } for p in h.ports
            ],
            "findings": [
                {
                    "severity": f.severity,
                    "port_number": f.port_number,
                    "title": f.title,
                    "description": f.description,
                    "recommended_remediation": f.recommended_remediation
                } for f in h.findings
            ]
        })

    return {
        "id": scan.id,
        "target": scan.target,
        "profile": scan.profile,
        "status": scan.status,
        "start_time": scan.start_time.isoformat() if scan.start_time else None,
        "end_time": scan.end_time.isoformat() if scan.end_time else None,
        "duration_seconds": scan.duration_seconds,
        "hosts": hosts_list
    }

@router.get("/{scan_id}/json")
def download_json_report(scan_id: str, db: Session = Depends(get_db)):
    scan_dict = fetch_full_scan_dict(scan_id, db)
    json_data = ReportService.generate_json_report(scan_dict)
    return Response(
        content=json_data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=netrecon_report_{scan_id[:8]}.json"}
    )

@router.get("/{scan_id}/csv")
def download_csv_report(scan_id: str, db: Session = Depends(get_db)):
    scan_dict = fetch_full_scan_dict(scan_id, db)
    csv_data = ReportService.generate_csv_report(scan_dict)
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=netrecon_report_{scan_id[:8]}.csv"}
    )

@router.get("/{scan_id}/pdf")
def download_pdf_report(scan_id: str, db: Session = Depends(get_db)):
    scan_dict = fetch_full_scan_dict(scan_id, db)
    pdf_bytes = ReportService.generate_pdf_report(scan_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=netrecon_report_{scan_id[:8]}.pdf"}
    )
