import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Scan, Host, Port, Service, Finding, DNSRecord, ScanLog, ScanStatus, SeverityLevel
from app.services.nmap_service import NmapService
from app.services.dns_service import DNSService
from app.services.risk_engine import RiskEngine
from app.utils.logging import logger

def get_demo_scan_data(target: str):
    """
    Generates realistic, completely fictional SOC demo dataset for instant UI testing.
    Never mixed with live scans.
    """
    return [
        {
            "ip_address": "192.168.1.1",
            "hostname": "gateway.router.internal",
            "status": "UP",
            "mac_address": "00:11:22:33:44:55",
            "vendor": "TP-Link Networking",
            "response_time_ms": 4,
            "ports": [
                {"port_number": 80, "protocol": "tcp", "state": "open", "service_name": "http", "product": "lighttpd", "version": "1.4.55"},
                {"port_number": 443, "protocol": "tcp", "state": "open", "service_name": "https", "product": "lighttpd", "version": "1.4.55"},
                {"port_number": 53, "protocol": "tcp", "state": "open", "service_name": "dns", "product": "dnsmasq", "version": "2.85"}
            ],
            "dns_records": [
                {"record_type": "A", "value": "192.168.1.1", "ttl": 3600},
                {"record_type": "PTR", "value": "gateway.router.internal", "ttl": 3600}
            ]
        },
        {
            "ip_address": "192.168.1.10",
            "hostname": "web-prod-01.local",
            "status": "UP",
            "mac_address": "AA:BB:CC:DD:EE:01",
            "vendor": "Dell Inc.",
            "response_time_ms": 12,
            "ports": [
                {"port_number": 22, "protocol": "tcp", "state": "open", "service_name": "ssh", "product": "OpenSSH", "version": "8.9p1"},
                {"port_number": 80, "protocol": "tcp", "state": "open", "service_name": "http", "product": "nginx", "version": "1.24.0"},
                {"port_number": 443, "protocol": "tcp", "state": "open", "service_name": "https", "product": "nginx", "version": "1.24.0"}
            ],
            "dns_records": [
                {"record_type": "A", "value": "192.168.1.10", "ttl": 3600}
            ]
        },
        {
            "ip_address": "192.168.1.20",
            "hostname": "db-cluster-node.local",
            "status": "UP",
            "mac_address": "AA:BB:CC:DD:EE:02",
            "vendor": "Dell Inc.",
            "response_time_ms": 9,
            "ports": [
                {"port_number": 22, "protocol": "tcp", "state": "open", "service_name": "ssh", "product": "OpenSSH", "version": "8.9p1"},
                {"port_number": 3306, "protocol": "tcp", "state": "open", "service_name": "mysql", "product": "MySQL Community Server", "version": "8.0.32"},
                {"port_number": 6379, "protocol": "tcp", "state": "open", "service_name": "redis", "product": "Redis Server", "version": "7.0.5"}
            ],
            "dns_records": [
                {"record_type": "A", "value": "192.168.1.20", "ttl": 3600}
            ]
        },
        {
            "ip_address": "192.168.1.30",
            "hostname": "dev-workstation.local",
            "status": "UP",
            "mac_address": "BC:99:11:22:33:44",
            "vendor": "Apple Inc.",
            "response_time_ms": 18,
            "ports": [
                {"port_number": 22, "protocol": "tcp", "state": "open", "service_name": "ssh", "product": "OpenSSH", "version": "9.0"},
                {"port_number": 23, "protocol": "tcp", "state": "open", "service_name": "telnet", "product": "BSD Telnetd", "version": "0.17"}
            ],
            "dns_records": []
        },
        {
            "ip_address": "192.168.1.40",
            "hostname": "camera-iot-hallway.local",
            "status": "UP",
            "mac_address": "00:E0:4C:11:22:33",
            "vendor": "Realtek Semiconductor",
            "response_time_ms": 32,
            "ports": [
                {"port_number": 21, "protocol": "tcp", "state": "open", "service_name": "ftp", "product": "vsftpd", "version": "2.3.4"},
                {"port_number": 80, "protocol": "tcp", "state": "open", "service_name": "http", "product": "Embedded Web Server", "version": "1.0"}
            ],
            "dns_records": []
        },
        {
            "ip_address": "192.168.1.50",
            "hostname": "legacy-backup.local",
            "status": "DOWN",
            "mac_address": None,
            "vendor": None,
            "response_time_ms": None,
            "ports": [],
            "dns_records": []
        }
    ]

def add_log(db: Session, scan_id: str, stage: str, message: str):
    log = ScanLog(scan_id=scan_id, stage=stage, message=message)
    db.add(log)
    db.commit()

async def run_scan_job(scan_id: str):
    db: Session = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan ID {scan_id} not found for execution worker.")
            return

        start_time = datetime.now(timezone.utc)
        scan.start_time = start_time

        # Stage 1: Target Validation
        scan.status = ScanStatus.VALIDATING
        scan.current_stage = "Target Validation"
        scan.progress_percentage = 10
        add_log(db, scan_id, "VALIDATING", f"Validating target format and parameters: {scan.target}")
        db.commit()

        await asyncio.sleep(0.5)

        # Stage 2: Host Discovery
        scan.status = ScanStatus.HOST_DISCOVERY
        scan.current_stage = "Host Discovery"
        scan.progress_percentage = 25
        add_log(db, scan_id, "HOST_DISCOVERY", "Performing host discovery & ping reachability checks...")
        db.commit()

        discovered_hosts_data = []

        if scan.is_demo:
            await asyncio.sleep(1.0)
            discovered_hosts_data = get_demo_scan_data(scan.target)
        else:
            nmap_res = await NmapService.run_nmap_scan(scan.target, scan.profile)
            discovered_hosts_data = nmap_res.get("hosts", [])

        # Stage 3: Port Scanning & Service Detection
        scan.status = ScanStatus.PORT_SCANNING
        scan.current_stage = "Port Scanning & Service Enumeration"
        scan.progress_percentage = 55
        add_log(db, scan_id, "PORT_SCANNING", f"Enumerating ports & services for {len(discovered_hosts_data)} target host(s)")
        db.commit()

        await asyncio.sleep(0.5)

        # Process each host
        total_open_ports = 0
        total_findings = 0
        live_hosts_count = 0

        for h_data in discovered_hosts_data:
            host_status = h_data.get("status", "UP")
            if host_status == "UP":
                live_hosts_count += 1

            host_obj = Host(
                scan_id=scan.id,
                ip_address=h_data["ip_address"],
                hostname=h_data.get("hostname"),
                status=host_status,
                mac_address=h_data.get("mac_address"),
                vendor=h_data.get("vendor"),
                response_time_ms=h_data.get("response_time_ms", 10),
                risk_level="INFO"
            )
            db.add(host_obj)
            db.flush()

            # Save Ports & Services
            ports_list = h_data.get("ports", [])
            for p_data in ports_list:
                total_open_ports += 1
                port_obj = Port(
                    host_id=host_obj.id,
                    port_number=p_data["port_number"],
                    protocol=p_data.get("protocol", "tcp"),
                    state=p_data.get("state", "open"),
                    service_name=p_data.get("service_name"),
                    product=p_data.get("product"),
                    version=p_data.get("version")
                )
                db.add(port_obj)

                service_obj = Service(
                    host_id=host_obj.id,
                    name=p_data.get("service_name") or "unknown",
                    port_number=p_data["port_number"],
                    protocol=p_data.get("protocol", "tcp"),
                    product=p_data.get("product"),
                    version=p_data.get("version"),
                    status="active"
                )
                db.add(service_obj)

            # DNS Reconnaissance
            dns_records = h_data.get("dns_records", [])
            if not dns_records and host_obj.hostname:
                dns_records = DNSService.resolve_dns(host_obj.hostname)

            for dns in dns_records:
                dns_obj = DNSRecord(
                    host_id=host_obj.id,
                    record_type=dns["record_type"],
                    value=dns["value"],
                    ttl=dns.get("ttl", 3600)
                )
                db.add(dns_obj)

            # Stage 4: Risk Analysis Engine
            findings_data = RiskEngine.analyze_host(
                host_obj.ip_address,
                host_obj.hostname or "",
                ports_list
            )

            host_risk = RiskEngine.calculate_host_risk_level(findings_data)
            host_obj.risk_level = host_risk

            for f_data in findings_data:
                total_findings += 1
                remediation_text = (
                    f_data.get("recommended_remediation") or
                    f_data.get("remediation") or
                    "Verify service access controls."
                )
                finding_obj = Finding(
                    host_id=host_obj.id,
                    scan_id=scan.id,
                    title=f_data.get("title", "Service Exposure"),
                    severity=f_data.get("severity", SeverityLevel.INFO),
                    port_number=f_data.get("port_number"),
                    service_name=f_data.get("service_name"),
                    description=f_data.get("description", "Exposed port detected."),
                    evidence=f_data.get("evidence"),
                    why_it_matters=f_data.get("why_it_matters"),
                    recommended_remediation=remediation_text,
                    status="OPEN"
                )
                db.add(finding_obj)

        # Stage 5: Report Generation Preparation & Finalization
        scan.status = ScanStatus.REPORT_GENERATION
        scan.current_stage = "Generating Summary & Findings Report"
        scan.progress_percentage = 90
        add_log(db, scan_id, "REPORT_GENERATION", "Aggregating metrics and building risk report index")
        db.commit()

        await asyncio.sleep(0.3)

        # Mark Complete
        end_time = datetime.now(timezone.utc)
        duration = int((end_time - start_time).total_seconds())

        scan.status = ScanStatus.COMPLETED
        scan.current_stage = "Completed"
        scan.progress_percentage = 100
        scan.end_time = end_time
        scan.duration_seconds = max(duration, 1)
        scan.hosts_count = len(discovered_hosts_data)
        scan.live_hosts_count = live_hosts_count
        scan.open_ports_count = total_open_ports
        scan.findings_count = total_findings

        add_log(db, scan_id, "COMPLETED", f"Scan successfully finished in {duration}s. {live_hosts_count} live hosts, {total_open_ports} open ports, {total_findings} risk findings.")
        db.commit()

    except Exception as e:
        logger.error(f"Scan background worker failed for scan {scan_id}: {str(e)}")
        if db:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = ScanStatus.FAILED
                scan.error_message = str(e)
                scan.current_stage = "Failed"
                add_log(db, scan_id, "FAILED", f"Scan encountered critical error: {str(e)}")
                db.commit()
    finally:
        db.close()
