FROM gcc:12-bookworm

# Install minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -u 1000 coderunner

# Set working directory
WORKDIR /app

# Copy execution script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER coderunner

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
