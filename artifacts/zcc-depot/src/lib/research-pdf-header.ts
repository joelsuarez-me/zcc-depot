import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";

export function drawExecutivePdfHeader(layout: ResearchPdfLayout, title: string, label: string, subtitle: string, logoDataUrl?: string) {
  const { doc, margin: M, contentWidth: W } = layout;
  layout.text("PLATFORM ARCHITECT DEPOT", M, 29, 8, true, C.forest);
  layout.font(8); doc.text("ZENDESK CONTACT CENTER", 568, 29, { align: "right" });
  const name = layout.plainLines(title, W - 48 - (logoDataUrl ? 130 : 0), 28, true);
  const height = Math.max(130, 85 + name.length * 33);
  doc.setFillColor(...C.forest); doc.roundedRect(M, 48, W, height, 15, 15, "F");
  doc.setFillColor(...C.lime); doc.roundedRect(M + 22, 67, 110, 18, 7, 7, "F");
  layout.text(label, M + 30, 79, 7, true);
  name.forEach((line, i) => layout.paint(line, M + 22, 99 + i * 33, 28, true, C.white));
  layout.text(subtitle, M + 22, 48 + height - 20, 9, false, C.white);
  if (logoDataUrl) {
    try {
      const image = doc.getImageProperties(logoDataUrl), boxWidth = 106, boxHeight = 72;
      const scale = Math.min((boxWidth - 18) / image.width, (boxHeight - 18) / image.height);
      const width = image.width * scale, height = image.height * scale, x = M + W - boxWidth - 22, top = 72;
      doc.setFillColor(...C.white); doc.roundedRect(x, top, boxWidth, boxHeight, 10, 10, "F");
      doc.addImage(logoDataUrl, x + (boxWidth - width) / 2, top + (boxHeight - height) / 2, width, height);
    } catch { throw new Error("The company logo could not be added to the PDF. Refresh its lookup or export without a logo."); }
  }
  layout.y = 48 + height + 18;
}
