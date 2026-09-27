from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.models import Scan, Host, Port, Service, Finding, ScanStatus, SeverityLevel
from app.schemas.schemas import DashboardSummary, ScanResponse
from app.services.nmap_service import NmapService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_hosts = db.query(Host).count()
    live_hosts = db.query(Host).filter(Host.status == "UP").count()
    open_ports = db.query(Port).filter(Port.state == "open").count()
    services_count = db.query(Service).count()
    
    high_risk = db.query(Finding).filter(Finding.severity == SeverityLevel.HIGH).count()
    critical_risk = db.query(Finding).filter(Finding.severity == SeverityLevel.CRITICAL).count()

    # Host status distribution
    down_hosts = db.query(Host).filter(Host.status == "DOWN").count()
    unknown_hosts = db.query(Host).filter(Host.status == "UNKNOWN").count()
    host_status_distribution = {
        "live": live_hosts,
        "down": down_hosts,
        "unknown": unknown_hosts
    }

    # Top open ports
    top_ports_query = db.query(
        Port.port_number,
        Port.service_name,
        func.count(Port.id).label("count")
    ).filter(Port.state == "open").group_by(Port.port_number, Port.service_name).order_by(func.count(Port.id).desc()).limit(7).all()

    top_open_ports = [
        {"port": p.port_number, "service": (p.service_name or "unknown").upper(), "count": p.count}
        for p in top_ports_query
    ]

    # Service distribution
    services_query = db.query(
        Service.name,
        func.count(Service.id).label("count")
    ).group_by(Service.name).order_by(func.count(Service.id).desc()).limit(6).all()

    service_dist = {s.name.upper(): s.count for s in services_query}
    if not service_dist:
        service_dist = {"HTTP": 0, "HTTPS": 0, "SSH": 0, "DNS": 0, "SMB": 0, "FTP": 0}

    # Risk Overview
    risk_overview = {
        "CRITICAL": db.query(Finding).filter(Finding.severity == SeverityLevel.CRITICAL).count(),
        "HIGH": db.query(Finding).filter(Finding.severity == SeverityLevel.HIGH).count(),
        "MEDIUM": db.query(Finding).filter(Finding.severity == SeverityLevel.MEDIUM).count(),
        "LOW": db.query(Finding).filter(Finding.severity == SeverityLevel.LOW).count(),
        "INFO": db.query(Finding).filter(Finding.severity == SeverityLevel.INFO).count(),
    }

    # Last Scan
    last_scan = db.query(Scan).order_by(Scan.created_at.desc()).first()

    scanner_status = {
        "nmap_available": NmapService.is_nmap_available(),
        "engine": "Nmap CLI Subprocess" if NmapService.is_nmap_available() else "Python Native Socket Fallback Engine",
        "status": "READY"
    }

    return DashboardSummary(
        total_hosts=total_hosts,
        live_hosts=live_hosts,
        open_ports=open_ports,
        services_count=services_count,
        high_risk_findings=high_risk,
        critical_risk_findings=critical_risk,
        last_scan=last_scan,
        host_status_distribution=host_status_distribution,
        top_open_ports=top_open_ports,
        service_distribution=service_dist,
        risk_overview=risk_overview,
        scanner_status=scanner_status
    )
