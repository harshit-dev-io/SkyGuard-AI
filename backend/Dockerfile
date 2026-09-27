# =============================================================================
# SkyGuard AI - Production & Railway Compatible Dockerfile
# =============================================================================
FROM python:3.12-slim-bookworm AS base

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app"

# Install essential runtime and build system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    libpq-dev \
    netcat-traditional \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager from official image
COPY --from=ghcr.io/astral-sh/uv:0.6.5 /uv /uvx /bin/

# Set working directory to /app
WORKDIR /app

# Cache dependency resolution: Copy lockfiles and manifests first
COPY pyproject.toml uv.lock README.md ./

# Install python dependencies in isolated virtual environment
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source code and connector dependencies
COPY lib/ ./lib/
COPY app/ ./app/

# Final sync to link the application package
RUN uv sync --frozen --no-dev

# Create data directory for WIS2 object storage and temporary runtimes
RUN mkdir -p /app/data/wis2_objects

# Expose default application port
EXPOSE 8000

# Railway and Docker healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Default command: Bind to dynamic Railway $PORT or fallback to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]