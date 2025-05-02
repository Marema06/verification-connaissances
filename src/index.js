// src/index.js
require("dotenv").config();
const readline = require("readline");
const { generateQCMwithHF } = require("./services/hf");
const { generateCodeWithHoles } = require("./generateHoles");
const { generatePDF } = require("./generatePDF");

// Interface CLI pour saisir le code
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Entrez un morceau de code JavaScript pour générer le QCM et le PDF :\n", async (code) => {
  rl.close();
  try {
    console.log("\n⏳ Génération du QCM via Hugging Face...");
    const qcmMd = await generateQCMwithHF(code);
    console.log("✅ QCM généré :\n", qcmMd);

    console.log("\n🔧 Génération du code à trous...");
    const codeATrous = generateCodeWithHoles(code, 3);
    console.log("Code masqué :\n", codeATrous.maskedCode);

    console.log("\n📄 Création du PDF...");
    const pdfPath = "exo_etudiant.pdf";
    generatePDF(qcmMd, codeATrous, pdfPath);
    console.log(`✅ PDF généré : ${pdfPath}`);
  } catch (err) {
    console.error("❌ Erreur dans le flux :", err.message);
  }
});
