# NETRECON — Network Reconnaissance & Security Dashboard

> **Discover. Analyze. Secure.**

NETRECON is a modern, full-stack cybersecurity SOC dashboard designed for authorized network reconnaissance, non-destructive host discovery, port enumeration, service fingerprinting, and defensive risk visibility.

---

## 🔒 Important Security Safeguards & Authorization Notice

**This application is intended ONLY for systems and networks that the user owns or has explicit authorization to assess.**

NETRECON explicitly excludes offensive attack vectors:
- ❌ No credential theft or password brute-forcing
- ❌ No vulnerability exploitation or malware payload delivery
- ❌ No stealth/evasion techniques or packet manipulation
- ❌ No destructive scanning or Denial of Service (DoS) functionality
- ❌ No unauthorized data exfiltration

The application focuses exclusively on defensive visibility, network inventorying, observable exposure classification, and PDF/CSV/JSON security report generation.

---

## 🚀 Key Features

1. **Professional Dark SOC Console**: Designed with charcoal/slate backgrounds, deep blue accents, and responsive layout.
2. **Safe Nmap & Native Subprocess Integration**: Safely executes Nmap argument arrays (`subprocess.run(["nmap", "-sV", target])`) avoiding `shell=True` and command injection. Includes a pure Python native socket scanner fallback when Nmap CLI is not installed on system PATH.
3. **Multi-Target Support & Strict Validation**: Supports IPv4, IPv6, FQDN Hostnames, and Subnet CIDRs (e.g. `192.168.1.0/24`) with strict regex and IP range validation.
4. **Authorization Confirmation Safeguard**: Requires user confirmation of target ownership before launching any scan job.
5. **Interactive Network Topology Map**: Built with React Flow for drag-and-drop visualization of gateway routers, host nodes, exposed ports, and color-coded risk levels.
6. **Defensive Risk Exposure Engine**: Classifies unencrypted or directly exposed services (e.g. Telnet, unencrypted FTP, exposed databases, cleartext HTTP) with actionable defensive remediation steps.
7. **Multi-Format Report Generator**: Generates formatted PDF executive reports (ReportLab), CSV spreadsheets, and SIEM-ready JSON telemetry data.
8. **Demo Mode**: Instant simulation mode with realistic SOC dataset for safe testing without active network scanning.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, React Flow (`@xyflow/react`), Axios, React Router v6.
- **Backend**: Python 3.12+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, PyJWT, ReportLab.
- **Database**: SQLite for development, PostgreSQL ready.
- **Reconnaissance Engine**: Subprocess Nmap CLI wrapper + Python socket fallback engine.

---

## ⚡ Quickstart & Running the Application

### Option A: Local Development Setup

#### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be available at: `http://localhost:8000`  
Swagger UI Docs: `http://localhost:8000/docs`

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend Web Console will be available at: `http://localhost:5173`

---

### Option B: Docker Compose

```bash
docker compose up --build
```
Access the application at `http://localhost:5173`.

---

## 📊 End-to-End Workflow

1. Open the dashboard at `http://localhost:5173`.
2. Login with default credentials (`admin` / `admin123`).
3. Click **"Start New Scan"**.
4. Enter an authorized target (e.g. `192.168.1.0/24` or toggle **DEMO MODE**).
5. Check the mandatory authorization confirmation box: `[x] I confirm that I am authorized to scan this target.`
6. Select a scan profile (`QUICK`, `STANDARD`, `DETAILED`).
7. Watch real-time stage progress (`Target Validation` → `Host Discovery` → `Port Scanning` → `Risk Analysis` → `Report Generation`).
8. Inspect discovered hosts, exposed ports, network topology diagram, and defensive recommendations.
9. Download executive PDF or CSV reports.

---

## 🧪 Running Unit Tests

```bash
cd backend
.venv/bin/python -m pytest
```

---

## 📜 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture, module structure, and database schema.
- [API.md](API.md) — Complete REST API endpoint reference.
- [SECURITY.md](SECURITY.md) — Defensive security controls, input validation, and hardening measures.
