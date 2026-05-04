#!/bin/bash

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "이 스크립트는 sudo로 실행해야 합니다."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_SRC="$SCRIPT_DIR/rebloom-voice.service"
SERVICE_DST="/etc/systemd/system/rebloom-voice.service"

chmod +x "$SCRIPT_DIR/run_voice_chat.sh"

sed \
    -e "s|__LLM_DIR__|$SCRIPT_DIR|g" \
    "$SERVICE_SRC" > "$SERVICE_DST"

systemctl daemon-reload
systemctl enable rebloom-voice.service
systemctl restart rebloom-voice.service

echo "Re:Bloom voice service installed."
echo "상태 확인: sudo systemctl status rebloom-voice --no-pager"
echo "로그 확인: sudo journalctl -u rebloom-voice -f"
