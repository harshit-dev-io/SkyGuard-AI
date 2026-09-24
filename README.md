# 🛰️ SkyGuard AI
### Real-Time Anomaly Detection, Fault Classification & Self-Healing QC for Automatic Weather Station (AWS) Networks

[![Python Version](https://img.shields.io/badge/Python-3.12+-blue.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostGIS-PostgreSQL_15-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![MQTT](https://img.shields.io/badge/MQTT-Eclipse_Mosquitto-660066.svg?logo=eclipse-mosquitto&logoColor=white)](https://mosquitto.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

---

## 📌 Executive Summary

Modern meteorological networks and numerical weather prediction models depend entirely on high-fidelity, uninterrupted surface observations. However, Automatic Weather Stations (AWS) deployed in extreme, remote terrains frequently suffer from **sensor drift, biological fouling, electronic failure, power degradation, and transient telemetry dropouts**. 

Traditional quality control systems either flag genuine extreme weather (e.g., cloudbursts, microbursts) as false-positive hardware faults or allow subtle sensor drift to contaminate regional climatological baselines.

**SkyGuard AI** delivers an end-to-end, dual-tier validation and self-healing system:
1. **Edge-Level Physical & Temporal Invariants**: Executes thermodynamic boundaries (Sonntag physical formulation) and quantized INT8 TinyML temporal residual inference under strict embedded constraints (<32KB arena).
2. **Centralized Geospatial Consensus & XAI**: Employs KD-Tree spatial topology, dynamic Uber H3 hexagonal clustering, and Unscented Kalman Filtering (UKF) to distinguish between genuine localized extreme weather and hardware anomalies.
3. **Raw Immutability**: Guarantees raw sensor observations are written once and never mutated, generating fully auditable derived corrections aligned with WMO WIGOS standards.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph EdgeLayer ["1. Edge Tier (AWS Node)"]
        Sensors["Weather Sensors\n(Temp, Humidity, Pressure, Wind, Precip)"]
        RawIngest["Raw Observation Capture"]
        Sonntag["Sonntag Physical Gate\n(Tdew <= Traw invariant)"]
        TinyML["TinyML INT8 Residual Engine\n(Harmonic Baseline Drift)"]
        Transport["Edge Transport\n(MQTT / WIS2 BUFR Template)"]

        Sensors --> RawIngest --> Sonntag --> TinyML --> Transport
    end

    subgraph CentralLayer ["2. Central Ingestion & Fusion Tier"]
        Broker["MQTT Broker / Redis Stream"]
        SpatialEngine["Spatial Consensus Engine\n(KD-Tree + H3 Hex Topology)"]
        FaultClassifier["4-Point Regional Fault Discriminator\n(Anomaly vs Genuine Event)"]
        UKF["Unscented Kalman Filter (UKF)\nSensor Health State Estimator"]
        Postgres["PostgreSQL + PostGIS\n(Immutable Observational Lineage)"]

        Transport --> Broker
        Broker --> SpatialEngine
        SpatialEngine --> FaultClassifier
        FaultClassifier --> UKF
        UKF --> Postgres
    end

    subgraph PresentationLayer ["3. Operation & Presentation Tier"]
        API["FastAPI REST & WebSocket Layer"]
        Dashboard["Operator Fleet Dashboard\n(India Geospatial Map & Live Stream)"]
        XAI["XAI Inspector\n(Sonntag, Drift & Residual Attribution)"]
        Admin["AWS Station Provisioning & Fleet Simulator"]

        Postgres --> API
        API --> Dashboard
        API --> XAI
        API --> Admin
    end
```

---

## ✨ Key Capabilities

| Feature | Description |
| :--- | :--- |
| **Sonntag Thermodynamic Invariant** | Enforces $T_{\text{dew}} \le T_{\text{raw}}$ physical laws before any probabilistic or neural classifier executes. |
| **TinyML Residual Drift Detection** | S1/S2 diurnal harmonics combined with cumulative sum (CUSUM) drift detection to catch subtle calibration decay. |
| **Spatial Consensus Engine** | Evaluates spatial topology via dynamic neighbor weighting and bad-neighbor guards to avoid contamination from adjacent faulty stations. |
| **Extreme Event vs. Fault Discriminator** | Decouples local weather extremes (microbursts, sudden temperature drops) from physical sensor breakdown. |
| **Raw Data Immutability** | Strict write-once storage for raw telemetry; flags, calibrations, and repairs are stored as auditable lineage metadata. |
| **Interactive Geospatial Console** | Live pan/zoom network map of India AWS deployment with status signals (Healthy, Drift, Local Extreme, Sensor Fault). |
| **Role-Based Access Control (RBAC)** | Strict access tiers for `Field Operator` (monitoring, inspections, active review) and `System Administrator` (hardware provisioning, fleet simulations). |
| **Adaptive Light / Dark Theme** | Curated editorial typography (`DM Sans`, `Instrument Serif`, `JetBrains Mono`) with light canvas and low-light tactical dark terminal themes. |

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com) (Python 3.12+)
- **ORM & Database**: [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org), [asyncpg](https://github.com/MagicStack/asyncpg), [PostgreSQL 15](https://www.postgresql.org) with [PostGIS](https://postgis.net) ([GeoAlchemy2](https://geoalchemy-2.readthedocs.io))
- **Messaging & Cache**: [Eclipse Mosquitto](https://mosquitto.org) (MQTT), [aiomqtt](https://github.com/sbtinstruments/aiomqtt), [Redis 7](https://redis.io)
- **Security & Auth**: PBKDF2 Password Hashing, JWT (HMAC-SHA256), OAuth2 Bearer Tokens
- **Testing**: [pytest](https://docs.pytest.org), `pytest-asyncio`

### Frontend
- **Framework**: [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vitejs.dev)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com), Custom Editorial Theme Design Tokens
- **Animations & Icons**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev)
- **State & Routing**: Context API (`ThemeContext`, `AuthContext`, `DashboardContext`), Role-guarded dashboard routing

---

## 📂 Project Structure

```
SkyGuard-AI/
├── backend/
│   ├── app/
│   │   ├── auth/                 # Authentication, JWT, user schemas, RBAC
│   │   │   ├── models.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── services.py
│   │   ├── config/               # Database, settings, and logging configuration
│   │   │   ├── database.py       # Async SQLAlchemy engine & PostGIS setup
│   │   │   ├── logging.py
│   │   │   └── settings.py
│   │   ├── core/                 # Auth dependencies, security utilities
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── edge_simulator/       # Hardware provisioning, MQTT transport, simulator
│   │   │   ├── models.py         # Static topology & AWS metadata
│   │   │   ├── mqtt_client.py
│   │   │   ├── router.py         # Station management & fault injection APIs
│   │   │   ├── schemas.py
│   │   │   ├── services.py
│   │   │   └── simulator.py
│   │   └── main.py               # FastAPI entrypoint, CORS, sub-routers
│   ├── docker-compose.yml        # Multi-container orchestration (App, Postgres, Redis, Mosquitto)
│   ├── Dockerfile
│   ├── pyproject.toml            # Python project dependencies (uv / pip)
│   └── uv.lock
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # AWS Station Lifecycle & Provisioning (ManageAWS)
│   │   │   ├── layout/           # Sticky Header, profile avatar, role indicators
│   │   │   ├── operator/         # Fleet View, TopKPICards, IndiaSpatialMap, AnomalyTable
│   │   │   ├── profile/          # User Profile, Theme Switcher, Session Security
│   │   │   ├── shared/           # ExplainabilityDrawer (XAI), MetricCard
│   │   │   ├── AuthModal.tsx     # Sign In & Registration modal
│   │   │   ├── EvidenceGrid.tsx  # Four evidence engines display
│   │   │   ├── Hero.tsx          # Landing page hero with animated triggers
│   │   │   ├── Navbar.tsx        # Public navigation with theme toggle
│   │   │   ├── PipelineFlow.tsx  # Interactive multi-stage QC pipeline cards
│   │   │   └── ThemeToggle.tsx   # Smooth animated sun/moon theme switch
│   │   ├── config/
│   │   │   └── api.ts            # Centralized API base URL config
│   │   ├── context/
│   │   │   ├── AuthContext.tsx   # Auth persistence & role state
│   │   │   ├── DashboardContext.tsx # Telemetry polling, station filtering, alert feeds
│   │   │   └── ThemeContext.tsx  # Light/Dark mode provider with localStorage persistence
│   │   ├── services/
│   │   │   ├── skyguardApi.ts    # REST API endpoints & fallback mocks
│   │   │   └── telemetryService.ts
│   │   ├── types/
│   │   │   └── dashboard.ts      # TypeScript interfaces for AWS, telemetry & QC
│   │   ├── App.tsx               # Root component & role-based dashboard router
│   │   └── index.css             # Base layer variables & typography
│   ├── package.json
│   ├── tailwind.config.js        # Extended palette (paper, ink, surface, borderMuted)
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **Docker & Docker Compose** (optional, recommended for full stack deployment)

---

### Option A: Running with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshit-dev-io/SkyGuard-AI.git
   cd SkyGuard-AI
   ```

2. **Configure environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Start services**:
   ```bash
   cd backend
   docker-compose up -d --build
   ```
   *Spins up PostgreSQL (PostGIS), Redis, Mosquitto MQTT Broker, and the FastAPI application server.*

4. **Launch the Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Access the application**:
   - Frontend UI: `http://localhost:5173`
   - Backend API Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

---

### Option B: Local Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies (using uv or pip)
pip install -e .

# Create .env from template
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```ini
# Application
PROJECT_NAME="SkyGuard AI"
API_V1_PREFIX="/api/v1"

# Security & JWT
SECRET_KEY="your-super-secret-key-change-in-production"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
PBKDF2_ITERATIONS=100000
PBKDF2_SALT_SIZE=16

# Database (PostgreSQL + PostGIS)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app_db
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/app_db"

# Redis
REDIS_URL="redis://localhost:6379/0"

# MQTT Broker
MQTT_BROKER_HOST="localhost"
MQTT_BROKER_PORT=1883
```

### Frontend Configuration (`frontend/.env`)

```ini
# Centralized Backend API endpoint
VITE_API_URL=http://localhost:8000
```

---

## 📡 API Reference Overview

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System and health status check |
| `POST` | `/api/v1/auth/signup` | Public | Register new user (`operator` or `admin`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token pair |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/v1/edge/stations` | Authenticated | List registered AWS stations with filters |
| `POST` | `/api/v1/edge/stations` | Admin | Provision and register new AWS station node |
| `PUT` | `/api/v1/edge/stations/{id}` | Admin | Update AWS station coordinates & metadata |
| `POST` | `/api/v1/edge/stations/{id}/inject-fault` | Admin | Inject synthetic sensor fault for simulation |
| `POST` | `/api/v1/edge/stations/{id}/inject-event` | Admin | Simulate localized extreme weather microburst |
| `POST` | `/api/v1/edge/simulate/start` | Admin | Start automated telemetry generation loop |
| `POST` | `/api/v1/edge/simulate/stop` | Admin | Terminate active telemetry simulation loop |

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## 🧪 Testing & Verification

```bash
# Run backend test suite
cd backend
pytest -v

# Run frontend linting & TypeScript type checking
cd frontend
npm run lint
npx tsc --noEmit
```

---

## 👥 Roles & Permissions

- **Field Operator**:
  - View real-time fleet telemetry stream and India spatial map.
  - Review active anomalies and explainability reports (Sonntag gate results, INT8 residuals, UKF health status).
  - Submit rule flags and verify suspicious station events.
  - Customize interface appearance (Light Canvas / Dark Terminal).
- **System Administrator**:
  - All operator capabilities.
  - Exclusive access to **Manage AWS** station lifecycle suite.
  - Provision new AWS hardware, configure terrain/climate segments, and assign WIGOS identifiers.
  - Run dynamic fault injection experiments and telemetry fleet simulations.

---

## 📜 License & Acknowledgments

This project is built for real-time Automated Weather Station network validation and extreme event classification, following WMO WIGOS standards and Ministry of Earth Sciences specifications.

Licensed under the **MIT License**.