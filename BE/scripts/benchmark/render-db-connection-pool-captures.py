# -*- coding: utf-8 -*-
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "docs" / "portfolio-captures" / "db-connection-pool"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_REG = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD = r"C:\Windows\Fonts\malgunbd.ttf"

COLORS = {
    "bg": "#F7F8FA",
    "ink": "#1F2937",
    "muted": "#64748B",
    "line": "#D7DEE8",
    "white": "#FFFFFF",
    "red": "#E5484D",
    "red_bg": "#FDECEC",
    "green": "#238636",
    "green_bg": "#EAF7EE",
    "blue": "#2563EB",
    "slate": "#334155",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def rounded(draw, box, radius=24, fill="#fff", outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size=28, bold=False, fill=None, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=fill or COLORS["ink"], anchor=anchor)


def metric_card(draw, x, y, w, h, label, value, sub=None, accent="blue"):
    rounded(draw, (x, y, x + w, y + h), 18, COLORS["white"], COLORS["line"], 1)
    text(draw, (x + 26, y + 24), label, 24, False, COLORS["muted"])
    text(draw, (x + 26, y + 67), value, 44, True, COLORS[accent])
    if sub:
        text(draw, (x + 26, y + 123), sub, 22, False, COLORS["muted"])


def bar(draw, x, y, w, h, total, used, failed=0, label=""):
    rounded(draw, (x, y, x + w, y + h), h // 2, "#E5EAF1")
    success_w = int(w * max(0, used - failed) / total) if total else 0
    fail_w = int(w * failed / total) if total else 0
    if success_w > 0:
        rounded(draw, (x, y, x + success_w, y + h), h // 2, COLORS["green"])
    if fail_w > 0:
        draw.rounded_rectangle((x + success_w, y, x + success_w + fail_w, y + h), radius=h // 2, fill=COLORS["red"])
    if label:
        text(draw, (x, y - 38), label, 24, True, COLORS["slate"])


def base(title, subtitle):
    img = Image.new("RGB", (1600, 900), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    text(draw, (80, 62), title, 48, True)
    text(draw, (82, 126), subtitle, 25, False, COLORS["muted"])
    draw.line((80, 175, 1520, 175), fill=COLORS["line"], width=2)
    return img, draw


def render_before():
    img, draw = base(
        "Before: DB 커넥션 슬롯 포화",
        "파드 3개 x pool 20 = 60개 연결 시도, PostgreSQL 일반 앱 슬롯은 37개",
    )
    metric_card(draw, 80, 230, 330, 170, "Attempted", "60", "3 pods x 20", "blue")
    metric_card(draw, 450, 230, 330, 170, "Successful", "37", "DB 슬롯 한계", "green")
    metric_card(draw, 820, 230, 330, 170, "Failed", "23", "연결 획득 실패", "red")
    metric_card(draw, 1190, 230, 330, 170, "Failure rate", "38.3%", "DB 병목 재현", "red")
    bar(draw, 140, 520, 1320, 66, 60, 60, 23, "60개 요청 중 37개 성공, 23개 실패")
    text(draw, (140, 625), "원인: 파드마다 커넥션풀이 따로 생겨 HPA/rolling update 시 총 DB 연결 수가 빠르게 증가", 28)
    text(draw, (140, 675), "병목 지점: API 로직 이전의 DB 커넥션 획득 단계", 28, True, COLORS["red"])
    img.save(OUT_DIR / "01-before-connection-slot-saturation.png", quality=95)


def render_after():
    img, draw = base(
        "After: 파드당 풀 상한 산정",
        "파드 3개 x pool 8 = 24개 연결 시도, 동일 DB 조건에서 실패 0건",
    )
    metric_card(draw, 80, 230, 330, 170, "Attempted", "24", "3 pods x 8", "blue")
    metric_card(draw, 450, 230, 330, 170, "Successful", "24", "전부 성공", "green")
    metric_card(draw, 820, 230, 330, 170, "Failed", "0", "실패 제거", "green")
    metric_card(draw, 1190, 230, 330, 170, "Failure rate", "0%", "38.3pp 감소", "green")
    bar(draw, 140, 520, 1320, 66, 37, 24, 0, "DB 일반 앱 슬롯 37개 중 24개 사용, 13개 headroom 확보")
    text(draw, (140, 625), "개선: HikariCP maximum-pool-size를 환경변수로 명시하고 EKS deployment에 기본값 8 적용", 28)
    text(draw, (140, 675), "효과: 파드가 늘어나도 총 연결 수를 계산 가능하게 만들고 DB 연결 실패율을 0%로 낮춤", 28, True, COLORS["green"])
    img.save(OUT_DIR / "02-after-connection-pool-sized.png", quality=95)


def render_summary():
    img, draw = base("전후 정량 비교", "Docker PostgreSQL max_connections=40, 일반 앱 슬롯 37개 기준")
    headers = ["Metric", "Before", "After", "Change"]
    rows = [
        ["Attempted DB connections", "60", "24", "60.0% lower"],
        ["Failed DB connections", "23", "0", "100% eliminated"],
        ["Failure rate", "38.3%", "0%", "38.3pp lower"],
        ["Max active DB connections", "37", "24", "35.1% lower"],
        ["DB-backed services configured", "0 / 4", "4 / 4", "100% coverage"],
    ]
    x0, y0 = 100, 240
    colw = [560, 250, 250, 300]
    rowh = 76
    rounded(draw, (x0, y0, x0 + sum(colw), y0 + rowh * (len(rows) + 1)), 18, COLORS["white"], COLORS["line"], 1)
    x = x0
    for idx, header in enumerate(headers):
        text(draw, (x + 24, y0 + 22), header, 25, True, COLORS["slate"])
        x += colw[idx]
    draw.line((x0, y0 + rowh, x0 + sum(colw), y0 + rowh), fill=COLORS["line"], width=2)
    for row_idx, row in enumerate(rows, start=1):
        y = y0 + rowh * row_idx
        x = x0
        for col_idx, cell in enumerate(row):
            fill = COLORS["ink"]
            if col_idx == 1 and ("23" in cell or "38.3" in cell or cell == "37"):
                fill = COLORS["red"]
            if col_idx in (2, 3) and (
                cell == "0" or "0%" in cell or "lower" in cell or "coverage" in cell or "eliminated" in cell
            ):
                fill = COLORS["green"]
            text(draw, (x + 24, y + 22), cell, 25, col_idx > 0, fill)
            x += colw[col_idx]
        if row_idx < len(rows):
            draw.line((x0, y + rowh, x0 + sum(colw), y + rowh), fill="#EEF2F7", width=1)
    text(draw, (100, 740), "자소서 포인트: 병목 가설 -> Docker 재현 -> 수치 검증 -> 운영 설정 반영", 28, True, COLORS["blue"])
    img.save(OUT_DIR / "03-before-after-summary.png", quality=95)


def render_config():
    img, draw = base("설정 변경: HikariCP 풀 상한 명시", "DB 사용 서비스 4개와 EKS deployment, Docker Compose에 동일 기준 반영")
    rounded(draw, (90, 230, 735, 720), 20, COLORS["red_bg"], "#F3B8BB", 1)
    text(draw, (130, 275), "Before", 34, True, COLORS["red"])
    text(draw, (130, 340), "- 서비스 설정에 pool size 명시 없음", 27)
    text(draw, (130, 392), "- 파드 수 증가 시 총 연결 수 계산 어려움", 27)
    text(draw, (130, 444), "- 운영 설정이 바뀌면 DB 슬롯 초과 위험", 27)
    text(draw, (130, 540), "예: 3 pods x pool 20 = 60", 34, True, COLORS["red"])

    rounded(draw, (865, 230, 1510, 720), 20, COLORS["green_bg"], "#A9DAB5", 1)
    text(draw, (905, 275), "After", 34, True, COLORS["green"])
    config_lines = [
        "DB_POOL_MAX_SIZE=8",
        "DB_POOL_MIN_IDLE=1",
        "DB_POOL_CONNECTION_TIMEOUT_MS=3000",
        "DB_POOL_VALIDATION_TIMEOUT_MS=1000",
    ]
    for idx, line in enumerate(config_lines):
        text(draw, (905, 345 + idx * 54), line, 28, True)
    text(draw, (905, 590), "효과: 3 pods x pool 8 = 24", 34, True, COLORS["green"])
    text(draw, (905, 645), "동일 DB 조건에서 실패율 0%", 28, True, COLORS["green"])
    img.save(OUT_DIR / "04-hikari-config-change.png", quality=95)


def main():
    render_before()
    render_after()
    render_summary()
    render_config()
    for png in sorted(OUT_DIR.glob("*.png")):
        print(png)


if __name__ == "__main__":
    main()
