#!/bin/bash
set -euo pipefail

mkdir -p src-tauri/binaries
curl -L -o src-tauri/binaries/yt-dlp-x86_64-unknown-linux-gnu https://github.com/yt-dlp/yt-dlp/releases/latest/download/2024.12.23/yt-dlp_linux
chmod +x src-tauri/binaries/yt-dlp-x86_64-unknown-linux-gnu
