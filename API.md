# API.md — REST API Endpoint Specification

All endpoints are prefixed with `/api`.

## 🔑 Authentication Endpoints

- `POST /api/auth/login` — Authenticate user and return JWT bearer token.
- `POST /api/auth/register` — Register new SOC analyst user.
- `GET /api/auth/me` — Fetch current logged-in user profile.

---

## 📡 Scan Management Endpoints

- `POST /api/scans` — Create and trigger a background network scan job.
  - **Body**: `{ "target": "192.168.1.0/24", "profile": "STANDARD", "user_confirmed_auth": true, "is_demo": false }`
- `GET /api/scans` — List all scan jobs ordered by date.
- `GET /api/scans/{scan_id}` — Get single scan detail, progress percentage, and log messages.
- `DELETE /api/scans/{scan_id}` — Delete scan record and associated host metrics.

---

## 🖥️ Hosts & Reconnaissance Endpoints

- `GET /api/scans/{scan_id}/hosts` — Get list of discovered hosts for a given scan.
- `GET /api/hosts/{host_id}` — Get host details including MAC address, vendor, and open ports.
- `GET /api/hosts/{host_id}/ports` — List open ports for host.
- `GET /api/hosts/{host_id}/services` — List enumerated services for host.
- `GET /api/hosts/{host_id}/dns` — Get DNS A/AAAA/PTR records for host.

---

## 🛡️ Findings & Reports Endpoints

- `GET /api/findings` — Retrieve all defensive risk findings across all scans.
- `GET /api/findings/{finding_id}` — Get single finding detail and remediation guidance.
- `GET /api/reports/{scan_id}/pdf` — Generate and download executive PDF report.
- `GET /api/reports/{scan_id}/csv` — Export tabular CSV report.
- `GET /api/reports/{scan_id}/json` — Download raw JSON telemetry data.

---

## 📊 Dashboard & Health

- `GET /api/dashboard/summary` — Fetch SOC dashboard summary metrics and distributions.
- `GET /api/health` — Backend status and Nmap scanner availability check.
