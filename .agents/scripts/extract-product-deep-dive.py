"""Render the supplied product slides faithfully using MuPDF, not Poppler.

The source's Seismic gradient shadings lose backgrounds and white text in
Poppler. MuPDF preserves them. Generated files must stay outside Git/deploys.
"""
from pathlib import Path
import pymupdf

SOURCE = Path("attached_assets/Contact_Center___Pitch_Deck_(1)_1794507289796.PDF")
OUT = Path("generated-artifacts/pitch-deck")
OUT.mkdir(parents=True, exist_ok=True)
document = pymupdf.open(SOURCE)
selection = pymupdf.open()
selection.insert_pdf(document, from_page=34, to_page=46)
selection.save(OUT / "zendesk-product-deep-dive.pdf", garbage=4, deflate=True)
for page_number in range(35, 48):
    page = document[page_number - 1]
    image = page.get_pixmap(matrix=pymupdf.Matrix(1600 / page.rect.width, 1600 / page.rect.width), alpha=False)
    image.save(OUT / f"slide-{page_number}.jpg", jpg_quality=94)
print("Extracted 13 slides, source pages 35–47.")
