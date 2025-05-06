const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { generateQCMwithHF } = require("./services/hf");
const { generateCodeWithHoles } = require("./generateHoles");
const { generatePDF } = require("./generatePDF");
require("dotenv").config();

// Variables d'environnement
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

/**
 * Envoie un email avec le PDF attaché
 */
async function sendEmail(recipient, qcmMarkdown, pdfPath) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: recipient,
    subject: "QCM de vérification de connaissances",
    text: qcmMarkdown,
    attachments: [
      {
        filename: "qcm_et_code.pdf",
        path: pdfPath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${recipient}`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email :", error);
  }
}

/**
 * Fonction principale
 */
async function generateAndSendQCM(code, emailRecipient) {
  try {
    // Étape 1 : générer le QCM
    const qcmMarkdown = await generateQCMwithHF(code);
    console.log("✅ QCM généré");

    // Étape 2 : générer code à trous
    const codeATrous = generateCodeWithHoles(code);
    console.log("✅ Code à trous généré");

    // Étape 3 : créer un PDF combiné
    const pdfPath = path.join(__dirname, "output_qcm.pdf");
    generatePDF(qcmMarkdown, codeATrous, pdfPath);
    console.log("✅ PDF généré :", pdfPath);

    // Étape 4 : envoyer email
    await sendEmail(emailRecipient, qcmMarkdown, pdfPath);
  } catch (error) {
    console.error("❌ Erreur globale :", error);
  }
}

// Exemple d’utilisation
const codeExample = `
function addition(a, b) {
  return a + b;
}
`;

const emailRecipient = "etudiant@example.com";

generateAndSendQCM(codeExample, emailRecipient);
