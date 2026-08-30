#!/usr/bin/env bash
set -euo pipefail

# 保留旧入口，实际执行无破坏性的部署实现。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/deploy-safe.sh" "$@"
