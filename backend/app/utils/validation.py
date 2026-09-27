import ipaddress
import re
import socket
from typing import Tuple

def validate_target(target: str) -> Tuple[bool, str, str]:
    """
    Validates target string and determines type (IP, CIDR, HOSTNAME).
    Returns (is_valid, target_type, error_or_cleaned_target)
    Prevent command injection characters.
    """
    if not target or not isinstance(target, str):
        return False, "", "Target cannot be empty"

    target = target.strip()

    # Prevent shell command injection characters
    illegal_chars = re.compile(r'[;&|`$><()\s\\\'"]')
    if illegal_chars.search(target):
        return False, "", "Target contains invalid or dangerous characters"

    # Try IPv4 / IPv6 Single Address
    try:
        ip = ipaddress.ip_address(target)
        target_type = "IP"
        return True, target_type, str(ip)
    except ValueError:
        pass

    # Try CIDR Network (e.g. 192.168.1.0/24 or 10.0.0.0/16)
    try:
        network = ipaddress.ip_network(target, strict=False)
        target_type = "CIDR"
        # Restrict extremely huge CIDR networks to prevent DOS/OOM (e.g. /8 or /0)
        if network.version == 4 and network.prefixlen < 16:
            return False, "", "CIDR prefix too large for scanning (minimum prefix is /16)"
        return True, target_type, str(network)
    except ValueError:
        pass

    # Try Hostname (FQDN or local hostname)
    hostname_regex = re.compile(
        r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$|^[a-zA-Z0-9-]{1,63}$'
    )
    if hostname_regex.match(target):
        # Additional safety checks
        if len(target) > 253:
            return False, "", "Hostname length exceeds maximum limits"
        return True, "HOSTNAME", target

    return False, "", "Target is not a valid IPv4, IPv6, Hostname, or CIDR network"
