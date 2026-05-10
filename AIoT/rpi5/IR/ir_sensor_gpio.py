from gpiozero import DigitalInputDevice
from time import sleep

# GPIO24 = BCM 24번 핀
# 보통 IR 센서의 OUT 핀을 GPIO24에 연결
sensor = DigitalInputDevice(24)

print("IR 센서 테스트 시작 - Ctrl+C로 종료")

try:
    while True:
        if sensor.value == 1:
            print("감지됨")
        else:
            print("감지 안 됨")

        sleep(0.3)

except KeyboardInterrupt:
    print("테스트 종료")