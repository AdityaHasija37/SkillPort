import PDFDocument from "pdfkit";

/** Streams a one-page, landscape certificate of completion to `stream`. */
export function writeCertificate(stream, { learnerName, courseTitle, instructorName, completedAt, certificateId }) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 56, info: { Title: `${courseTitle} certificate` } });
  doc.pipe(stream);

  const { width, height } = doc.page;
  const ink = "#111111";
  const blue = "#3F86C6";

  doc.rect(28, 28, width - 56, height - 56).lineWidth(2).stroke(ink);
  doc.rect(36, 36, width - 72, height - 72).lineWidth(0.5).stroke(blue);

  doc.fillColor(ink).font("Helvetica-Bold").fontSize(14).text("SKILL", 0, 82, { width: width / 2 - 2, align: "right", continued: false });
  doc.fillColor(blue).font("Helvetica-Bold").fontSize(14).text("PORT", width / 2 + 2, 82, { align: "left" });

  doc.fillColor(ink).font("Helvetica").fontSize(13).text("CERTIFICATE OF COMPLETION", 0, 140, { width, align: "center", characterSpacing: 3 });
  doc.font("Helvetica").fontSize(14).fillColor("#555555").text("This certifies that", 0, 190, { width, align: "center" });
  doc.font("Helvetica-Bold").fontSize(36).fillColor(ink).text(learnerName, 0, 220, { width, align: "center" });
  doc.font("Helvetica").fontSize(14).fillColor("#555555").text("has completed every lesson of", 0, 282, { width, align: "center" });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(blue).text(courseTitle, 80, 310, { width: width - 160, align: "center" });

  const date = completedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.font("Helvetica").fontSize(12).fillColor(ink);
  doc.text(`Taught by ${instructorName}`, 80, height - 150, { width: (width - 160) / 2, align: "left" });
  doc.text(`Completed ${date}`, width / 2, height - 150, { width: (width - 160) / 2, align: "right" });
  doc.fontSize(9).fillColor("#777777").text(`Certificate ID ${certificateId}`, 0, height - 92, { width, align: "center" });

  doc.end();
}
