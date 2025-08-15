FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for MariaDB
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

EXPOSE 5000

# Use Granian to run Quart application (Rust-based high-performance ASGI server)
CMD ["granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "5000", "--access-log", "run:app"]
