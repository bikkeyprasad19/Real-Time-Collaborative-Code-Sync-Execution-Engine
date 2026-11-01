#!/bin/bash
set -e

# Decode code from environment variable
echo "$CODE" | base64 -d > /tmp/main.js

# Execute the JavaScript code with resource limits
cd /tmp
timeout 5s node main.js 2>&1
