# SkyGuard AI Backend

High-throughput, distributed weather telemetry ingestion, real-time quality control, spatial/temporal fusion, and automated self-healing platform.

## Architecture Components
- **FastAPI Core**: RESTful API, authentication, WebSocket ingestion, and WIS2 publisher.
- **TimescaleDB / PostGIS**: Time-series observation storage and spatial topology.
- **Apache Kafka**: Multi-stage distributed event streaming pipeline.
- **Redis**: Low-latency deduplication cache, state quarantine, and Celery broker.
- **Eclipse Mosquitto**: MQTT broker for edge sensor payloads and WIS2 WNM notifications.
- **Celery Worker & Beat**: Asynchronous background jobs for sensor RUL estimation, topology graph generation, and periodic load-shedding probes.
