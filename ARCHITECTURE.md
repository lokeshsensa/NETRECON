# ARCHITECTURE.md — NETRECON System Design

## 🏗️ High-Level System Architecture

```
React Frontend (Vite + Tailwind CSS + React Flow + Recharts)
                      |
                      | REST API (JSON / HTTP)
                      v
FastAPI Backend (Async API + Pydantic + JWT Auth)
                      |
        +-------------+-------------+
        |                           |
Recon Engine                   Risk Analysis Engine
(Nmap CLI / Socket Fallback)   (Exposure Classification)
        |                           |
        +-------------+-------------+
                      |
                      v
          SQLAlchemy ORM Database
          (SQLite / PostgreSQL)
```

---

## 📁 Modular Folder Structure

```
backend/
    app/
        main.py                # FastAPI entrypoint & middleware setup
        config.py              # Environment configuration & settings
        database.py            # SQLAlchemy database engine & SessionLocal
        api/
            routes/
                auth_routes.py # JWT registration & login endpoints
                scans.py       # Scan job lifecycle & creation
                hosts.py       # Host inventory, ports, & services
                reports.py     # PDF, CSV, & JSON export endpoints
                dashboard.py   # SOC summary metrics & stats
        models/
            models.py          # User, Scan, Host, Port, Service, Finding, DNSRecord models
        schemas/
            schemas.py         # Pydantic request & response validation schemas
        services/
            nmap_service.py    # Subprocess Nmap CLI wrapper & socket scanner fallback
            dns_service.py     # DNS A/AAAA/PTR resolution service
            risk_engine.py     # Defensive exposure risk classification engine
            report_service.py  # ReportLab PDF & CSV generation engine
        utils/
            validation.py      # IP, CIDR, & Hostname target sanitization
            logging.py         # Structured application logger
        workers/
            scan_worker.py     # Background task worker for non-blocking execution

frontend/
    src/
        components/
          Navbar.jsx / Sidebar.jsx / StatCard.jsx / ScanModal.jsx / ScanProgressModal.jsx
        pages/
          Dashboard.jsx / Scans.jsx / Hosts.jsx / NetworkMap.jsx / Findings.jsx / Reports.jsx / Settings.jsx
        layouts/
          SOCLayout.jsx
        services/
          api.js
        App.jsx
        main.jsx
```

---

## 🗄️ Database Entity-Relationship (ER) Schema

```
Users (1) <----> (M) Scans (1) <----> (M) Hosts (1) <----> (M) Ports
                                              |
                                              +----> (M) Services
                                              |
                                              +----> (M) Findings
                                              |
                                              +----> (M) DNSRecords
```
