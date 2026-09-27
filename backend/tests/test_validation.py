import pytest
from app.utils.validation import validate_target

def test_valid_ip():
    is_valid, t_type, clean = validate_target("192.168.1.1")
    assert is_valid is True
    assert t_type == "IP"
    assert clean == "192.168.1.1"

def test_valid_cidr():
    is_valid, t_type, clean = validate_target("192.168.1.0/24")
    assert is_valid is True
    assert t_type == "CIDR"
    assert clean == "192.168.1.0/24"

def test_valid_hostname():
    is_valid, t_type, clean = validate_target("router.internal.local")
    assert is_valid is True
    assert t_type == "HOSTNAME"
    assert clean == "router.internal.local"

def test_command_injection_prevention():
    is_valid, t_type, err = validate_target("192.168.1.1; cat /etc/passwd")
    assert is_valid is False
    assert "invalid or dangerous" in err

def test_invalid_cidr_prefix():
    is_valid, t_type, err = validate_target("10.0.0.0/8")
    assert is_valid is False
    assert "prefix too large" in err
