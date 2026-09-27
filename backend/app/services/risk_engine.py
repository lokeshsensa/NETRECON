from typing import List, Dict, Any
from app.models.models import SeverityLevel

RISK_RULES = [
    {
        "port": 21,
        "service": "ftp",
        "title": "Unencrypted FTP Service Detected",
        "severity": SeverityLevel.MEDIUM,
        "description": "File Transfer Protocol (FTP) transmits credentials and data in cleartext.",
        "why_it_matters": "Network sniffers can capture sensitive files and login passwords.",
        "remediation": "Disable plain FTP and replace with SFTP (SSH File Transfer Protocol) or FTPS (FTP over TLS)."
    },
    {
        "port": 22,
        "service": "ssh",
        "title": "SSH Remote Console Access Service Exposed",
        "severity": SeverityLevel.LOW,
        "description": "Secure Shell (SSH) service detected accessible over the network.",
        "why_it_matters": "Exposed SSH ports are targets for brute-force credential guessing if password authentication is enabled.",
        "remediation": "Enforce SSH key-based authentication, disable root login in sshd_config, and restrict access via firewall."
    },
    {
        "port": 23,
        "service": "telnet",
        "title": "Telnet Unencrypted Remote Shell Exposed",
        "severity": SeverityLevel.HIGH,
        "description": "Telnet is an legacy unencrypted remote administration protocol.",
        "why_it_matters": "All session traffic including administrative passwords are sent unencrypted over the wire.",
        "remediation": "Immediately replace Telnet with SSH (Port 22) for remote console access."
    },
    {
        "port": 445,
        "service": "smb",
        "title": "SMB Network File Sharing Exposed",
        "severity": SeverityLevel.MEDIUM,
        "description": "Server Message Block (SMB) service is accessible on the network.",
        "why_it_matters": "Misconfigured SMB shares can lead to anonymous file access and internal lateral movement.",
        "remediation": "Restrict SMB access via firewall rules to trusted subnets and enforce SMBv3 signing."
    },
    {
        "port": 3389,
        "service": "ms-wbt-server",
        "title": "Remote Desktop Protocol (RDP) Service Exposed",
        "severity": SeverityLevel.MEDIUM,
        "description": "Microsoft RDP service detected on standard port 3389.",
        "why_it_matters": "Directly accessible RDP ports are frequent targets for credential guessing and remote compromise.",
        "remediation": "Place RDP endpoints behind a VPN or Remote Desktop Gateway and enable Network Level Authentication (NLA)."
    },
    {
        "port": 3306,
        "service": "mysql",
        "title": "Database Service Exposed (MySQL)",
        "severity": SeverityLevel.HIGH,
        "description": "MySQL database server is directly accessible over the network.",
        "why_it_matters": "Direct database exposure increases attack surface and risk of unauthorized data access.",
        "remediation": "Bind database to localhost (127.0.0.1) or restrict network access strictly to application servers via firewall."
    },
    {
        "port": 5432,
        "service": "postgresql",
        "title": "Database Service Exposed (PostgreSQL)",
        "severity": SeverityLevel.HIGH,
        "description": "PostgreSQL database server is directly accessible over the network.",
        "why_it_matters": "Exposing database ports directly to broad subnets allows unauthorized network connectivity attempts.",
        "remediation": "Configure listen_addresses in pg_hba.conf and enforce access control list filters."
    },
    {
        "port": 27017,
        "service": "mongodb",
        "title": "NoSQL Database Exposed (MongoDB)",
        "severity": SeverityLevel.HIGH,
        "description": "MongoDB server detected on standard port 27017.",
        "why_it_matters": "MongoDB instances exposed without mandatory authentication lead to database leakage.",
        "remediation": "Enable authorization in mongod.conf and restrict binding to internal networks."
    },
    {
        "port": 6379,
        "service": "redis",
        "title": "In-Memory Data Store Exposed (Redis)",
        "severity": SeverityLevel.HIGH,
        "description": "Redis data store detected.",
        "why_it_matters": "Redis servers without passwords or authentication can allow arbitrary command execution.",
        "remediation": "Set requirepass in redis.conf, bind to loopback interface, and block port 6379 on firewalls."
    },
    {
        "port": 80,
        "service": "http",
        "title": "Unencrypted HTTP Web Service",
        "severity": SeverityLevel.LOW,
        "description": "Web server detected serving content over plain HTTP.",
        "why_it_matters": "Traffic can be intercepted or altered by man-in-the-middle network entities.",
        "remediation": "Implement HTTPS using TLS/SSL certificates and configure HTTP-to-HTTPS redirect rules."
    }
]

class RiskEngine:
    @staticmethod
    def analyze_host(ip: str, hostname: str, open_ports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        findings = []

        for p in open_ports:
            port_num = p.get("port_number")
            service_name = (p.get("service_name") or "").lower()
            product = p.get("product", "")
            version = p.get("version", "")
            
            # Match against risk rules
            matched = False
            for rule in RISK_RULES:
                if port_num == rule["port"] or (rule["service"] in service_name):
                    findings.append({
                        "title": rule["title"],
                        "severity": rule["severity"],
                        "port_number": port_num,
                        "service_name": service_name or rule["service"],
                        "description": rule["description"],
                        "evidence": f"Port {port_num}/TCP is OPEN running {product} {version}".strip(),
                        "why_it_matters": rule["why_it_matters"],
                        "recommended_remediation": rule["remediation"]
                    })
                    matched = True
                    break
            
            if not matched and port_num is not None:
                # General finding for open ports
                findings.append({
                    "title": f"Open Port {port_num} ({service_name or 'Unknown Service'})",
                    "severity": SeverityLevel.INFO,
                    "port_number": port_num,
                    "service_name": service_name or "unknown",
                    "description": f"Port {port_num} is open and responding to network queries.",
                    "evidence": f"Port {port_num}/tcp state: OPEN. {product} {version}".strip(),
                    "why_it_matters": "Every open network port increases the active attack surface of the host.",
                    "recommended_remediation": "Verify whether this service is required for business operations. Close port if unused."
                })
                
        return findings

    @staticmethod
    def calculate_host_risk_level(findings: List[Dict[str, Any]]) -> str:
        severities = [f.get("severity") for f in findings]
        if SeverityLevel.CRITICAL in severities:
            return SeverityLevel.CRITICAL.value
        if SeverityLevel.HIGH in severities:
            return SeverityLevel.HIGH.value
        if SeverityLevel.MEDIUM in severities:
            return SeverityLevel.MEDIUM.value
        if SeverityLevel.LOW in severities:
            return SeverityLevel.LOW.value
        return SeverityLevel.INFO.value
