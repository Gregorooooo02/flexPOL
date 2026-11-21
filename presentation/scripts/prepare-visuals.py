"""Generate custom HedgeFlex pitch charts, soft glow halo, and framed UI screenshots."""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


def make_hedgie_halo() -> None:
    """Create a 512x512 transparent soft warm-gold radial glow PNG."""
    size = 512
    y, x = np.ogrid[:size, :size]
    cx = cy = (size - 1) / 2.0
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (size / 2.0)
    alpha = np.clip(1.0 - r, 0.0, 1.0) ** 2.1
    # Warm gold #FFD22E blended softly toward #FE9900 at outer edge
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[..., 0] = 255
    rgba[..., 1] = np.clip(212 - r * 32, 160, 225).astype(np.uint8)
    rgba[..., 2] = np.clip(56 - r * 20, 18, 70).astype(np.uint8)
    rgba[..., 3] = np.clip(alpha * 78, 0, 255).astype(np.uint8)
    out = ASSETS / "hedgie-halo.png"
    Image.fromarray(rgba, mode="RGBA").save(out)
    print(f"Wrote {out}")


def make_gap_chart() -> None:
    """Create a 2x2 editorial positioning chart showing the Knowledge -> Action gap."""
    plt.rcParams["font.family"] = "sans-serif"
    plt.rcParams["font.sans-serif"] = ["Segoe UI Variable Display", "Segoe UI", "DejaVu Sans"]

    fig, ax = plt.subplots(figsize=(7.6, 4.65), dpi=300)
    fig.patch.set_facecolor("#F7F8F8")
    ax.set_facecolor("#FFFFFF")

    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color("#C9D0D2")
    ax.spines["bottom"].set_color("#C9D0D2")
    ax.spines["left"].set_linewidth(1.3)
    ax.spines["bottom"].set_linewidth(1.3)
    ax.set_xticks([])
    ax.set_yticks([])

    # Subtle quadrant dividers
    ax.axvline(50, color="#E4E8E9", linestyle="--", linewidth=1.1, zorder=1)
    ax.axhline(50, color="#E4E8E9", linestyle="--", linewidth=1.1, zorder=1)

    # Quadrant 1 (Bottom-Left): Passive Content
    q_bl = FancyBboxPatch(
        (5, 7), 41, 37,
        boxstyle="round,pad=0.3,rounding_size=2.2",
        facecolor="#F2F4F5", edgecolor="#D3D8D9", linewidth=1.2, zorder=2
    )
    ax.add_patch(q_bl)
    ax.text(8.5, 36.5, "PASSIVE LEARNING", fontsize=8.5, fontweight="bold", color="#5B6466", zorder=3)
    ax.text(8.5, 29.0, "Videos, Blogs & PDFs", fontsize=12.5, fontweight="bold", color="#0D1112", zorder=3)
    ax.text(8.5, 19.5, "Explains definitions, but learners\nfreeze before their first allocation.", fontsize=9.5, color="#525C5E", linespacing=1.35, zorder=3)

    # Quadrant 2 (Bottom-Right): High-Stakes Real Markets
    q_br = FancyBboxPatch(
        (54, 7), 41, 37,
        boxstyle="round,pad=0.3,rounding_size=2.2",
        facecolor="#FDF2F0", edgecolor="#F1C2BA", linewidth=1.2, zorder=2
    )
    ax.add_patch(q_br)
    ax.text(57.5, 36.5, "REAL-MONEY STAKES", fontsize=8.5, fontweight="bold", color="#B93829", zorder=3)
    ax.text(57.5, 29.0, "Broker & Crypto Apps", fontsize=12.5, fontweight="bold", color="#0D1112", zorder=3)
    ax.text(57.5, 19.5, "Real capital on the line immediately;\nmistakes trigger panic-selling.", fontsize=9.5, color="#525C5E", linespacing=1.35, zorder=3)

    # Quadrant 3 (Top-Left): Uncontextualized Simulators
    q_tl = FancyBboxPatch(
        (5, 56), 41, 37,
        boxstyle="round,pad=0.3,rounding_size=2.2",
        facecolor="#F7F8F8", edgecolor="#DDE1E2", linewidth=1.1, zorder=2
    )
    ax.add_patch(q_tl)
    ax.text(8.5, 85.5, "UNSTRUCTURED PLAY", fontsize=8.5, fontweight="bold", color="#5B6466", zorder=3)
    ax.text(8.5, 78.0, "Gamified Stock Tickers", fontsize=12.5, fontweight="bold", color="#0D1112", zorder=3)
    ax.text(8.5, 68.5, "Rewards short-term luck & hype,\nwithout teaching life-stage tradeoffs.", fontsize=9.5, color="#525C5E", linespacing=1.35, zorder=3)

    # Quadrant 4 (Top-Right): HedgeFlex Sweet Spot
    q_tr = FancyBboxPatch(
        (54, 56), 41, 37,
        boxstyle="round,pad=0.3,rounding_size=2.2",
        facecolor="#FDF1C7", edgecolor="#EFB100", linewidth=2.2, zorder=4
    )
    ax.add_patch(q_tr)
    ax.text(57.5, 85.5, "THE HEDGEFLEX BRIDGE", fontsize=8.8, fontweight="bold", color="#7A4F00", zorder=5)
    ax.text(57.5, 77.6, "HedgeFlex", fontsize=15.0, fontweight="bold", color="#0D1112", zorder=5)
    ax.text(57.5, 65.5, "Learn + Simulate + AI Debrief\nRewarding plan quality & resilience\nwith zero real-money risk.", fontsize=9.8, fontweight="medium", color="#2B2100", linespacing=1.35, zorder=5)

    # Curved bridge arrow cleanly bridging Passive Learning -> HedgeFlex corner
    arrow = FancyArrowPatch(
        (46.2, 44.2), (53.8, 55.8),
        connectionstyle="arc3,rad=-0.22",
        arrowstyle="Simple,tail_width=2.2,head_width=9.5,head_length=9.5",
        color="#EFB100",
        zorder=6,
    )
    ax.add_patch(arrow)

    # Axis labels
    ax.set_xlabel("Practical Decision Making  (Passive Reading  →  Hands-On Allocation)", fontsize=10, fontweight="bold", color="#0D1112", labelpad=10)
    ax.set_ylabel("Safety & Coaching  (Unprotected Risk  →  Guided Sandbox)", fontsize=10, fontweight="bold", color="#0D1112", labelpad=10)

    plt.tight_layout(pad=0.9)
    out = ASSETS / "gap-chart.png"
    fig.savefig(out, dpi=300, facecolor="#F7F8F8")
    plt.close(fig)
    print(f"Wrote {out}")


def frame_screenshot(raw_name: str, out_name: str, url_label: str) -> None:
    """Add crisp architectural browser chrome and subtle shadow around a raw screenshot."""
    raw_path = ASSETS / raw_name
    if not raw_path.exists():
        print(f"Skipping {raw_name} (not found yet)")
        return

    img = Image.open(raw_path).convert("RGBA")
    w, h = img.size

    chrome_h = max(34, int(round(h * 0.042)))
    pad = 24
    border = 2
    inner_w = w + border * 2
    inner_h = h + chrome_h + border * 2

    canvas = Image.new("RGBA", (inner_w + pad * 2, inner_h + pad * 2), (0, 0, 0, 0))

    # Soft shadow layer
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle(
        [pad, pad + 6, pad + inner_w, pad + inner_h + 6],
        radius=12,
        fill=(13, 17, 18, 42),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(shadow)

    # Crisp frame container
    frame = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    f_draw = ImageDraw.Draw(frame)

    # Top chrome bar
    f_draw.rectangle([0, 0, inner_w, chrome_h], fill=(236, 239, 240, 255))
    f_draw.line([(0, chrome_h - 1), (inner_w, chrome_h - 1)], fill=(221, 225, 226, 255), width=2)

    # Subtle window dots (muted editorial tones)
    dot_y = chrome_h // 2
    dot_r = max(4, chrome_h // 7)
    for idx, col in enumerate([(220, 38, 38, 170), (239, 177, 0, 210), (21, 128, 61, 170)]):
        cx = 16 + idx * (dot_r * 3)
        f_draw.ellipse([cx - dot_r, dot_y - dot_r, cx + dot_r, dot_y + dot_r], fill=col)

    # URL pill text
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", max(13, int(chrome_h * 0.44)))
    except OSError:
        font = ImageFont.load_default()
    f_draw.text((16 + dot_r * 10, dot_y), url_label, fill=(91, 100, 102, 255), font=font, anchor="lm")

    # Paste screenshot inside frame
    frame.paste(img, (border, chrome_h + border))

    # Crisp 2px outer border
    f_draw.rectangle([0, 0, inner_w - 1, inner_h - 1], outline=(205, 212, 214, 255), width=border)

    canvas.paste(frame, (pad, pad), frame)
    out_path = ASSETS / out_name
    canvas.save(out_path)
    print(f"Wrote {out_path} ({canvas.size[0]}x{canvas.size[1]})")


if __name__ == "__main__":
    make_hedgie_halo()
    make_gap_chart()
    frame_screenshot("raw-learning.png", "screen-learning.png", "hedgeflex.app/learning")
    frame_screenshot("raw-sandbox.png", "screen-sandbox.png", "hedgeflex.app/scenarios/play")
    frame_screenshot("raw-coach.png", "screen-coach.png", "hedgeflex.app · Hedgie AI Coach")
