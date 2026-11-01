#!/bin/bash
set -e

# Decode code from environment variable
echo "$CODE" | base64 -d > /tmp/main.cpp

cd /tmp

# Compile the C++ code with timeout
timeout 5s g++ -std=c++17 -o main main.cpp 2>&1

# Execute the compiled binary with timeout
timeout 5s ./main 2>&1
