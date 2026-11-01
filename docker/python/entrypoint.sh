#!/bin/bash
set -e

# Decode code from environment variable
echo "$CODE" | base64 -d > /tmp/main.py

# Execute the Python code with resource limits
cd /tmp
timeout 5s python3 main.py 2>&1
