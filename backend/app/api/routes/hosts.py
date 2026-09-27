from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.models import Host, Port, Service, Finding, DNSRecord
from app.schemas.schemas import HostResponse, PortResponse, ServiceResponse, FindingResponse, DNSRecordResponse

router = APIRouter(tags=["Hosts & Reconnaissance"])

@router.get("/scans/{scan_id}/hosts", response_model=List[HostResponse])
def get_hosts_by_scan(scan_id: str, db: Session = Depends(get_db)):
    hosts = db.query(Host).options(
        selectinload(Host.ports),
        selectinload(Host.services),
        selectinload(Host.findings),
        selectinload(Host.dns_records)
    ).filter(Host.scan_id == scan_id).all()
    return hosts

@router.get("/hosts/{host_id}", response_model=HostResponse)
def get_host(host_id: str, db: Session = Depends(get_db)):
    host = db.query(Host).options(
        selectinload(Host.ports),
        selectinload(Host.services),
        selectinload(Host.findings),
        selectinload(Host.dns_records)
    ).filter(Host.id == host_id).first()

    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host not found")
    return host

@router.get("/hosts/{host_id}/ports", response_model=List[PortResponse])
def get_host_ports(host_id: str, db: Session = Depends(get_db)):
    ports = db.query(Port).filter(Port.host_id == host_id).all()
    return ports

@router.get("/hosts/{host_id}/services", response_model=List[ServiceResponse])
def get_host_services(host_id: str, db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.host_id == host_id).all()
    return services

@router.get("/hosts/{host_id}/dns", response_model=List[DNSRecordResponse])
def get_host_dns(host_id: str, db: Session = Depends(get_db)):
    records = db.query(DNSRecord).filter(DNSRecord.host_id == host_id).all()
    return records

@router.get("/findings", response_model=List[FindingResponse])
def get_all_findings(db: Session = Depends(get_db)):
    findings = db.query(Finding).order_by(Finding.detected_at.desc()).all()
    return findings

@router.get("/findings/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    return finding
