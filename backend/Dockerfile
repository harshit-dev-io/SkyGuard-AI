FROM python:3.12.2 AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /

RUN pip install uv 

COPY pyproject.toml .
COPY uv.lock .

RUN uv sync 

COPY app/ /app

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]