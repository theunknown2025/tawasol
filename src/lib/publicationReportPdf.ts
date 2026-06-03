import { jsPDF } from "jspdf";
import type { PublicationAnalysis } from "@/pages/admin/MURAI/types";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function addSection(
  doc: jsPDF,
  y: number,
  title: string,
  body: string,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(title, MARGIN, y);
  y += LINE_HEIGHT + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(body, CONTENT_WIDTH);
  for (const line of lines) {
    if (y > 275) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }

  return y + SECTION_GAP;
}

/** Télécharge le rapport de publication au format PDF. */
export function downloadPublicationReportPdf(analysis: PublicationAnalysis): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("Rapport de publication", MARGIN, y);
  y += LINE_HEIGHT + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${formatGeneratedAt(analysis.generatedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Publication : ${analysis.publicationId}`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP;

  y = addSection(doc, y, "Vue d'ensemble", analysis.summary);
  y = addSection(doc, y, "Publication", analysis.postReport);
  y = addSection(doc, y, "Commentaires", analysis.commentsSummary);

  if (y > 250) {
    doc.addPage();
    y = MARGIN;
  }

  y = addSection(
    doc,
    y,
    "Statistiques",
    [
      `Likes : ${analysis.engagement.likes}`,
      `Commentaires : ${analysis.engagement.comments}`,
      `Clics : ${analysis.engagement.clicks}`,
      `Total interactions : ${analysis.engagement.total}`,
    ].join("\n"),
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`REMESS — Page ${i} / ${pageCount}`, PAGE_WIDTH / 2, 290, { align: "center" });
  }

  doc.save(`rapport-publication-${analysis.publicationId}-${Date.now()}.pdf`);
}
