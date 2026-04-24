#!/bin/bash
# setup.sh — Re:Bloom RPi5 BLE Provisioning 환경 설정 스크립트
# 실행: sudo bash setup.sh

set -e

echo "========================================="
echo " Re:Bloom RPi5 BLE Provisioning 설치"
echo "========================================="

# 실행 사용자 홈 디렉토리 자동 감지 (sudo 실행 시 SUDO_USER 사용)
REBLOOM_USER="${SUDO_USER:-$USER}"
REBLOOM_HOME=$(eval echo "~$REBLOOM_USER")
REBLOOM_DIR="$REBLOOM_HOME/rebloom"

echo "  사용자: $REBLOOM_USER"
echo "  경로  : $REBLOOM_DIR"

# 1. 시스템 패키지
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

# 2. 프로젝트 디렉토리 및 venv 생성
echo "[2/4] Python 가상환경(venv) 생성 및 패키지 설치..."
mkdir -p "$REBLOOM_DIR"
sudo -u "$REBLOOM_USER" python3 -m venv "$REBLOOM_DIR/venv" --system-site-packages
sudo -u "$REBLOOM_USER" "$REBLOOM_DIR/venv/bin/pip" install --upgrade pip
sudo -u "$REBLOOM_USER" "$REBLOOM_DIR/venv/bin/pip" install cryptography

# 3. bluetoothd 실험적 기능 활성화 (GATT Server 필요)
echo "[3/4] bluetoothd 실험적 기능 활성화..."
BLUETOOTH_CONF="/etc/bluetooth/main.conf"
if ! grep -q "Experimental = true" "$BLUETOOTH_CONF"; then
    echo -e "\n[Policy]\nExperimental = true" >> "$BLUETOOTH_CONF"
    echo "  → main.conf 수정 완료"
else
    echo "  → 이미 설정됨"
fi

systemctl restart bluetooth
sleep 2

# 4. systemd 서비스 등록
echo "[4/4] systemd 서비스 등록..."
SERVICE_SRC="$REBLOOM_DIR/ble_provisioning/rebloom-ble.service"

# 서비스 파일 안의 경로를 실제 사용자 경로로 치환
sed "s|/home/pi|$REBLOOM_HOME|g" "$SERVICE_SRC" > /etc/systemd/system/rebloom-ble.service

systemctl daemon-reload
systemctl enable rebloom-ble.service
systemctl start rebloom-ble.service

echo ""
echo "✅ 설치 완료!"
echo "   venv 경로 : $REBLOOM_DIR/venv"
echo "   상태 확인 : sudo systemctl status rebloom-ble"
echo "   로그 확인 : sudo journalctl -u rebloom-ble -f"
