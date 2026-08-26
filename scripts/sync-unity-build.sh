#!/bin/bash
# CBRS-X Unity WebGL Build Deduplication Script
# Copies the Unity WebGL build to both dashboard and trainee_view public directories
# Usage: ./sync-unity-build.sh <path-to-unity-webgl-build>

set -euo pipefail

UNITY_BUILD_DIR="${1:-}"
DASHBOARD_UNITY="dashboard/public/unity-sim"
TRAINEE_UNITY="trainee_view/public/unity-sim"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"; exit 1; }

if [ -z "${UNITY_BUILD_DIR}" ]; then
    echo "Usage: $0 <path-to-unity-webgl-build>"
    echo ""
    echo "Example:"
    echo "  $0 /path/to/Unity/Builds/WebGL"
    echo ""
    echo "This script copies the Unity WebGL build to both:"
    echo "  - ${DASHBOARD_UNITY}"
    echo "  - ${TRAINEE_UNITY}"
    exit 1
fi

if [ ! -d "${UNITY_BUILD_DIR}" ]; then
    error "Unity build directory not found: ${UNITY_BUILD_DIR}"
fi

if [ ! -f "${UNITY_BUILD_DIR}/index.html" ]; then
    error "No index.html found in ${UNITY_BUILD_DIR}. Is this a valid WebGL build?"
fi

log "Syncing Unity WebGL build from: ${UNITY_BUILD_DIR}"

# Create target directories
mkdir -p "${DASHBOARD_UNITY}"
mkdir -p "${TRAINEE_UNITY}"

# Copy build to both locations
log "Copying to ${DASHBOARD_UNITY}..."
rsync -av --delete "${UNITY_BUILD_DIR}/" "${DASHBOARD_UNITY}/" 2>/dev/null || \
    cp -r "${UNITY_BUILD_DIR}/"* "${DASHBOARD_UNITY}/"

log "Copying to ${TRAINEE_UNITY}..."
rsync -av --delete "${UNITY_BUILD_DIR}/" "${TRAINEE_UNITY}/" 2>/dev/null || \
    cp -r "${UNITY_BUILD_DIR}/"* "${TRAINEE_UNITY}/"

# Verify checksums match
DASHBOARD_HASH=$(find "${DASHBOARD_UNITY}" -type f -exec md5sum {} \; 2>/dev/null | sort | md5sum | cut -d' ' -f1)
TRAINEE_HASH=$(find "${TRAINEE_UNITY}" -type f -exec md5sum {} \; 2>/dev/null | sort | md5sum | cut -d' ' -f1)

if [ "${DASHBOARD_HASH}" = "${TRAINEE_HASH}" ]; then
    log "Build sync verified. Checksums match: ${DASHBOARD_HASH}"
else
    warn "Checksum mismatch! Dashboard: ${DASHBOARD_HASH}, Trainee: ${TRAINEE_HASH}"
fi

log "Unity WebGL build sync complete."
