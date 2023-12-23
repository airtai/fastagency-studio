#!/bin/bash
set -e

echo "Running mypy..."
# mkdir -p .
mypy fastagency tests

echo "Running bandit..."
bandit -c pyproject.toml -r fastagency

echo "Running semgrep..."
semgrep scan --config auto --error
