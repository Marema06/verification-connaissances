// src/generatePDF.js
const fs = require("fs");
const PDFDocument = require("pdfkit");

/**
 * Génère un PDF combinant :
 *  - le QCM (markdown)
 *  - l’exercice « code à trous »
 *
 * @param {string} qcmMd         — Le markdown du QCM
 * @param {{maskedCode:string, holes:string[]}} codeATrous
 * @param {string} outputPath    — Chemin du PDF généré
 */
function generatePDF(qcmMd, codeATrous, outputPath) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(outputPath));

  // Page 1 : QCM
  doc.fontSize(18).text("QCM Automatique", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(qcmMd, { lineGap: 4 });

  // Page 2 : Code à trous
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
