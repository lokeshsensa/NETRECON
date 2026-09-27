from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# Port & Service Schemas
class PortResponse(BaseModel):
    id: str
    port_number: int
    protocol: str
    state: str
    service_name: Optional[str] = None
    product: Optional[str] = None
    version: Optional[str] = None
    banner: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceResponse(BaseModel):
    id: str
    name: str
    port_number: int
    protocol: str
    product: Optional[str] = None
    version: Optional[str] = None
    status: str
    info: Optional[str] = None

    class Config:
        from_attributes = True

# DNS Record Schema
class DNSRecordResponse(BaseModel):
    id: str
    record_type: str
    value: str
    ttl: Optional[int] = None

    class Config:
        from_attributes = True

# Finding Schema
class FindingResponse(BaseModel):
    id: str
    host_id: str
    scan_id: Optional[str] = None
    title: str
    severity: str
    port_number: Optional[int] = None
    service_name: Optional[str] = None
    description: str
    evidence: Optional[str] = None
    why_it_matters: Optional[str] = None
    recommended_remediation: str
    status: str
    detected_at: datetime

    class Config:
        from_attributes = True

# Host Schema
class HostResponse(BaseModel):
    id: str
    scan_id: str
    ip_address: str
    hostname: Optional[str] = None
    status: str
    mac_address: Optional[str] = None
    vendor: Optional[str] = None
    response_time_ms: Optional[int] = None
    risk_level: str
    last_seen: datetime
    ports: List[PortResponse] = []
    services: List[ServiceResponse] = []
    findings: List[FindingResponse] = []
    dns_records: List[DNSRecordResponse] = []

    class Config:
        from_attributes = True

# Scan Schemas
class ScanCreate(BaseModel):
    target: str = Field(..., description="IP, Hostname, or CIDR network")
    profile: str = Field("STANDARD", description="QUICK, STANDARD, DETAILED")
    user_confirmed_auth: bool = Field(..., description="Must confirm authorization")
    is_demo: bool = Field(False, description="Run in demo mode with sample data")

class ScanLogResponse(BaseModel):
    id: str
    stage: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    id: str
    target: str
    target_type: str
    profile: str
    status: str
    is_demo: bool
    user_confirmed_auth: bool
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    current_stage: Optional[str] = None
    progress_percentage: int
    error_message: Optional[str] = None
    hosts_count: int
    live_hosts_count: int
    open_ports_count: int
    findings_count: int
    created_at: datetime
    hosts: List[HostResponse] = []
    scan_logs: List[ScanLogResponse] = []

    class Config:
        from_attributes = True

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    total_hosts: int
    live_hosts: int
    open_ports: int
    services_count: int
    high_risk_findings: int
    critical_risk_findings: int
    last_scan: Optional[ScanResponse] = None
    host_status_distribution: dict
    top_open_ports: List[dict]
    service_distribution: dict
    risk_overview: dict
    scanner_status: dict

# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: str
    user_email: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
