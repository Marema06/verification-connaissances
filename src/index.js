// src/index.js
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { generateCodeWithHoles } = require("./generateHoles");

// 1️⃣ Génération QCM via HF
async function generateQCMwithHF(code) {
  const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error("HF_API_KEY manquant");

  const prompt = `
Tu es un assistant pédagogique. À partir du bloc de code suivant :

\`\`\`javascript
${code}
\`\`\`

► Génère **exactement 3 questions QCM** en Markdown, chacune avec 4 choix (A, B, C, D)
► Pour chaque question, indique la bonne réponse à la fin.
► Ne rajoute **aucune** autre explication ni titre.

**Format strict** :
1. Question…
   - A) …
   - B) …
   - C) …
   - D) …
**Réponse : [lettre]**
`.trim();

  const { data } = await axios.post(
    API_URL,
    { inputs: prompt, parameters: { max_new_tokens: 200, temperature: 0.7, top_p: 0.9 }, options:{ wait_for_model:true } },
    { headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type":"application/json" }, timeout:60000 }
  );
  const text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
  if (!text) throw new Error("Réponse vide de l'API HF");
  return text.trim();
}

// 2️⃣ Génération du PDF
function generatePDF(qcmMd, codeATrous, outputPath) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text("QCM Automatique", { underline: true }).moveDown();
  doc.fontSize(12).text(qcmMd, { lineGap: 4 });

  doc.addPage()
    .fontSize(18).text("Exercice Code à Trous", { underline: true }).moveDown()
    .fontSize(12).text(codeATrous.maskedCode, { lineGap: 4 }).moveDown()
    .fontSize(14).text("À compléter :");
  codeATrous.holes.forEach((h,i) => doc.text(`${i+1}. (token original : ${h})`));

  doc.end();
}

// 3️⃣ Envoi email via Nodemailer
async function sendEmail(pdfPath) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: `"Auto‑QCM" <${process.env.SMTP_USER}>`,
    to: process.env.STUDENT_EMAIL,
    subject: "Votre QCM généré automatiquement",
    text: "Bonjour,\n\nVous trouverez en pièce jointe votre QCM et l’exercice code à trous.\n\nBonne révision !",
    attachments: [{ filename: "exo_etudiant.pdf", path: pdfPath }]
  });
}

async function main() {
  try {
    const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question("Entrez un bloc de code JavaScript :\n", async code => {
      rl.close();

      console.log("⏳ Génération du QCM…");
      const qcmMd = await generateQCMwithHF(code);
      console.log(qcmMd);

      console.log("🔧 Génération du code à trous…");
      const codeATrous = generateCodeWithHoles(code, 3);

      console.log("📄 Création du PDF…");
      const pdfPath = "exo_etudiant.pdf";
      generatePDF(qcmMd, codeATrous, pdfPath);

      console.log("✉️ Envoi du PDF par email…");
      await sendEmail(pdfPath);
      console.log("✅ Email envoyé à", process.env.STUDENT_EMAIL);

      // Note : la création d’une Issue pour le prof
      // se fera dans le workflow GitHub avec actions/github-script
    });
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  }
}

main();
