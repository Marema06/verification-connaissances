const fs = require("fs");
const PDFDocument = require("pdfkit");

function generatePDF(qcmMd, codeATrous, outputPath) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text("QCM Automatique", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(qcmMd, { lineGap: 4 });

  doc.addPage();
  doc.fontSize(18).text("Exercice Code à Trous", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(codeATrous.maskedCode, { lineGap: 4 });
  doc.moveDown();
  doc.fontSize(14).text("À compléter :");
  codeATrous.holes.forEach((h, i) => {
    doc.text(`${i + 1}. (token original : ${h})`);
  });

  doc.end();
}

module.exports = { generatePDF };
