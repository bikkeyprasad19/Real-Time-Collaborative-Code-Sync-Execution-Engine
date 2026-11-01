FROM node:18-slim

# Create a non-root user (node:18-slim already has a user with UID 1000, so we'll use a different UID)
RUN useradd -m -u 1001 coderunner

# Set working directory
WORKDIR /app

# Copy execution script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER coderunner

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
