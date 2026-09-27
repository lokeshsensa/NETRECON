import socket
from typing import List, Dict, Any

class DNSService:
    @staticmethod
    def resolve_dns(hostname_or_ip: str) -> List[Dict[str, Any]]:
        records = []
        
        # 1. Reverse lookup / Forward lookup using socket
        try:
            # If target is an IP, try PTR reverse DNS lookup
            if hostname_or_ip.replace('.', '').isdigit():
                try:
                    host_name, aliaslist, _ = socket.gethostbyaddr(hostname_or_ip)
                    records.append({
                        "record_type": "PTR",
                        "value": host_name,
                        "ttl": 3600
                    })
                except Exception:
                    pass
            else:
                # Forward lookup for A records
                addresses = socket.getaddrinfo(hostname_or_ip, None)
                seen = set()
                for addr in addresses:
                    ip = addr[4][0]
                    if ip not in seen:
                        seen.add(ip)
                        rectype = "AAAA" if ":" in ip else "A"
                        records.append({
                            "record_type": rectype,
                            "value": ip,
                            "ttl": 3600
                        })
        except Exception as e:
            pass

        return records
