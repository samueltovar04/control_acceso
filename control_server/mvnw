#!/usr/bin/env bash
# Universal Maven Wrapper Fallback

if command -v mvn &> /dev/null; then
    exec mvn "$@"
else
    echo "==> Local 'mvn' not found in PATH. Using Docker Maven wrapper..."
    exec docker run --rm -v "$(pwd)":/code -w /code maven:3.9-eclipse-temurin-17 mvn "$@"
fi
