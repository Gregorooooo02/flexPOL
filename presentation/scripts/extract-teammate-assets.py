"""Extract QR code and clean UI architecture icons from the teammate PPTX."""

from pathlib import Path
import io
import zipfile
from PIL import Image

SRC = Path(
    r"C:\Users\Kamil\.gemini\antigravity\brain\416c487a-5f0c-4652-8bad-d8e811ca2d57"
    r"\.user_uploaded\media_1795286969687_4a012b90.pptx"
)
OUT = Path(__file__).resolve().parent.parent / "assets" / "teammate"
OUT.mkdir(parents=True, exist_ok=True)

MAPPING = {
    "ppt/media/image4.png": "icon-learner.png",
    "ppt/media/image5.png": "icon-cloud.png",
    "ppt/media/image6.png": "icon-lessons.png",
    "ppt/media/image7.png": "icon-sim.png",
    "ppt/media/image8.png": "icon-coach.png",
    "ppt/media/image9.png": "icon-supabase.png",
    "ppt/media/image10.png": "icon-openai.png",
    "ppt/media/image11.png": "icon-ship.png",
    "ppt/media/image12.png": "icon-arrow.png",
    "ppt/media/image13.png": "qr-code.png",
}

with zipfile.ZipFile(SRC) as z:
    for member, filename in MAPPING.items():
        raw = z.read(member)
        img = Image.open(io.BytesIO(raw))
        if filename == "qr-code.png":
            img = img.convert("RGB")
        else:
            img = img.convert("RGBA")
        dest = OUT / filename
        img.save(dest)
        print(f"Extracted {dest.name}: {img.size} {img.mode}")
