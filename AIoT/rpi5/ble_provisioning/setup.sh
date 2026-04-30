#!/bin/bash

set -e

if [ "$(id -u)" -ne 0 ]; then
    echo "이 스크립트는 sudo로 실행해야 합니다."
    exit 1
fi

echo "========================================="
echo " Re:Bloom RPi5 BLE Provisioning 설치"
echo "========================================="

REBLOOM_USER="${SUDO_USER:-$USER}"
REBLOOM_HOME=$(eval echo "~$REBLOOM_USER")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_DIR/venv"

echo "  사용자: $REBLOOM_USER"
echo "  프로젝트 경로: $PROJECT_DIR"
echo "  BLE 경로     : $SCRIPT_DIR"
echo "  venv 경로    : $VENV_DIR"

echo "[1/4] 시스템 패키지 설치..."
apt-get update -qq
apt-get install -y \
    bluetooth \
    bluez \
    python3-full \
    python3-dbus \
    python3-gi \
    python3-gi-cairo \
    libglib2.0-dev \
    libdbus-glib-1-dev \
    network-manager

echo "[2/4] Python 가상환경(venv) 생성 및 패키지 설치..."
sudo -u "$REBLOOM_USER" python3 -m venv "$VENV_DIR" --system-site-packages
sudo -u "$REBLOOM_USER" "$VENV_DIR/bin/pip" install --upgrade pip
sudo -u "$REBLOOM_USER" "$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt"

echo "[3/4] bluetoothd 실험적 기능 활성화..."
BLUETOOTH_CONF="/etc/bluetooth/main.conf"
if ! grep -q "Experimental = true" "$BLUETOOTH_CONF"; then
    echo -e "\n[Policy]\nExperimental = true" >> "$BLUETOOTH_CONF"
    echo "  → main.conf 수정 완료"
else
    echo "  → 이미 설정됨"
fi

systemctl enable NetworkManager bluetooth
systemctl restart bluetooth
sleep 2

echo "[4/4] systemd 서비스 등록..."
SERVICE_SRC="$SCRIPT_DIR/rebloom-ble.service"

sed \
    -e "s|__BLE_PROVISIONING_DIR__|$SCRIPT_DIR|g" \
    -e "s|__VENV_PYTHON__|$VENV_DIR/bin/python|g" \
    "$SERVICE_SRC" > /etc/systemd/system/rebloom-ble.service

systemctl daemon-reload
systemctl enable rebloom-ble.service
systemctl restart rebloom-ble.service

echo ""
echo "✅ 설치 완료!"
echo "   venv 경로 : $VENV_DIR"
echo "   상태 확인 : sudo systemctl status rebloom-ble"
echo "   로그 확인 : sudo journalctl -u rebloom-ble -f"
