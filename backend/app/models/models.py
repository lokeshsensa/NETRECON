import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_login = Column(DateTime(timezone=True), nullable=True)

class ScanStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    HOST_DISCOVERY = "HOST_DISCOVERY"
    PORT_SCANNING = "PORT_SCANNING"
    SERVICE_DETECTION = "SERVICE_DETECTION"
    RISK_ANALYSIS = "RISK_ANALYSIS"
    REPORT_GENERATION = "REPORT_GENERATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ScanProfile(str, enum.Enum):
    QUICK = "QUICK"
    STANDARD = "STANDARD"
    DETAILED = "DETAILED"

class TargetType(str, enum.Enum):
    IP = "IP"
    HOSTNAME = "HOSTNAME"
    CIDR = "CIDR"

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=generate_uuid)
    target = Column(String, nullable=False, index=True)
    target_type = Column(String, nullable=False)
    profile = Column(String, nullable=False, default=ScanProfile.STANDARD)
    status = Column(String, nullable=False, default=ScanStatus.QUEUED, index=True)
    is_demo = Column(Boolean, default=False)
    user_confirmed_auth = Column(Boolean, default=True)
    
    start_time = Column(DateTime(timezone=True), default=utc_now)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True, default=0)
    
    current_stage = Column(String, nullable=True, default="QUEUED")
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    hosts_count = Column(Integer, default=0)
    live_hosts_count = Column(Integer, default=0)
    open_ports_count = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=utc_now)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)

    hosts = relationship("Host", back_populates="scan", cascade="all, delete-orphan")
    scan_logs = relationship("ScanLog", back_populates="scan", cascade="all, delete-orphan")

class Host(Base):
    __tablename__ = "hosts"

    id = Column(String, primary_key=True, default=generate_uuid)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    ip_address = Column(String, nullable=False, index=True)
    hostname = Column(String, nullable=True)
    status = Column(String, nullable=False, default="UP") # UP, DOWN, UNKNOWN
    mac_address = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    risk_level = Column(String, default="LOW") # CRITICAL, HIGH, MEDIUM, LOW, INFO
    
    last_seen = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    scan = relationship("Scan", back_populates="hosts")
    ports = relationship("Port", back_populates="host", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="host", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="host", cascade="all, delete-orphan")
    dns_records = relationship("DNSRecord", back_populates="host", cascade="all, delete-orphan")

class Port(Base):
    __tablename__ = "ports"

    id = Column(String, primary_key=True, default=generate_uuid)
    host_id = Column(String, ForeignKey("hosts.id"), nullable=False, index=True)
    port_number = Column(Integer, nullable=False, index=True)
    protocol = Column(String, nullable=False, default="tcp") # tcp, udp
    state = Column(String, nullable=False, default="open") # open, closed, filtered
    service_name = Column(String, nullable=True)
    product = Column(String, nullable=True)
    version = Column(String, nullable=True)
    banner = Column(Text, nullable=True)

    host = relationship("Host", back_populates="ports")

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=generate_uuid)
    host_id = Column(String, ForeignKey("hosts.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    port_number = Column(Integer, nullable=False)
    protocol = Column(String, default="tcp")
    product = Column(String, nullable=True)
    version = Column(String, nullable=True)
    status = Column(String, default="active")
    info = Column(Text, nullable=True)

    host = relationship("Host", back_populates="services")

class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=generate_uuid)
    host_id = Column(String, ForeignKey("hosts.id"), nullable=False, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False, default=SeverityLevel.INFO, index=True)
    port_number = Column(Integer, nullable=True)
    service_name = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    recommended_remediation = Column(Text, nullable=False)
    status = Column(String, default="OPEN") # OPEN, RESOLVED, IGNORED
    detected_at = Column(DateTime(timezone=True), default=utc_now)

    host = relationship("Host", back_populates="findings")

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    host_id = Column(String, ForeignKey("hosts.id"), nullable=False, index=True)
    record_type = Column(String, nullable=False) # A, AAAA, CNAME, MX, NS, TXT
    value = Column(Text, nullable=False)
    ttl = Column(Integer, nullable=True)

    host = relationship("Host", back_populates="dns_records")

class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    stage = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    scan = relationship("Scan", back_populates="scan_logs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_email = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
