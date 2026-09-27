# SECURITY.md — Defensive Security Controls & Safeguards

## 🛡️ Defensive Engineering Guidelines

NETRECON is architected strictly as an authorized network reconnaissance, inventorying, and risk visibility tool.

### 1. Command Injection & Subprocess Hardening
- **No `shell=True` Execution**: All Nmap CLI interactions are executed via explicit argument arrays (e.g. `["nmap", "-sV", "-T4", target]`).
- **Target Sanitization**: Raw target inputs are rigorously validated against strict regular expressions for IPv4 addresses, IPv6 addresses, FQDN hostnames, and CIDR notation before reaching the subprocess layer.
- **Character Blacklisting**: Input strings containing shell metacharacters (`;`, `&`, `|`, `` ` ``, `$`, `>`, `<`, `(`, `)`, `\`, `'`, `"`, whitespace) are immediately rejected with HTTP 400.

### 2. Authorization Verification Requirement
- Users must explicitly check a mandatory authorization confirmation box: `[ ] I confirm that I am authorized to scan this target.`
- The backend API verifies `user_confirmed_auth: true` before initializing any scan job.

### 3. Non-Destructive Scanning Profiles
- **QUICK**: Host discovery + top 100 common TCP ports (`-F -T4`).
- **STANDARD**: Host discovery + TCP service detection (`-sV -T4 --top-ports 100`).
- **DETAILED**: Host discovery + extended TCP port enumeration (`-sV -T4 --top-ports 1000`).
- **Forbidden Modes**: Aggressive scan profiles (`-A`), vulnerability script suites (`--script=vuln`), brute force modules, or packet manipulation are intentionally excluded.

### 4. Non-Blocking Async Worker Architecture
- Scanning jobs run asynchronously in FastAPI background tasks (`asyncio.create_subprocess_exec` / `BackgroundTasks`).
- Prevents FastAPI request thread starvation and API denial-of-service.

### 5. Audit Logging
- Every login, scan launch, target IP, timestamp, user identity, and report export is recorded in the `audit_logs` database table.
