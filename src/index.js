require("dotenv").config();
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { generateQCMwithHF } = require("./services/hf");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
if (!EMAIL_USER || !EMAIL_PASS) throw new Error("❌ Définis EMAIL_USER et EMAIL_PASS dans .env");

const emailRecipient = process.env.EMAIL_TO;
if (!emailRecipient) throw new Error("❌ Définis EMAIL_TO dans .env");

/**
 * Envoie un email avec debug activé pour Nodemailer
 */
async function sendEmail(recipient, qcmMarkdown) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    logger: true,   // active les logs
    debug: true     // affiche la conversation SMTP
  });

  // Vérifier la connexion SMTP avant l'envoi
  transporter.verify((err, success) => {
    if (err) {
      console.error("❌ SMTP Verification Error:", err);
    } else {
      console.log("✅ SMTP ready:", success);
    }
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: recipient,
    subject: "🔎 Votre QCM de vérification de code",
    text: qcmMarkdown,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé à", recipient, "| response:", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email :", error);
  }
}

async function generateAndSendQCM() {
  try {
    // Lire tout le code JavaScript du dossier src
    const codeDir = __dirname;
    let fullCode = "";

    const files = fs.readdirSync(codeDir);
    for (const file of files) {
      if (file.endsWith(".js") && file !== "index.js") {
        fullCode += fs.readFileSync(path.join(codeDir, file), "utf-8") + "\n\n";
      }
    }
    if (!fullCode.trim()) throw new Error("❌ Aucun fichier JS à analyser dans src/");

    // Générer le QCM
    console.log("⏳ Génération du QCM...");
    const qcmMd = await generateQCMwithHF(fullCode);
    console.log("✅ QCM généré :\n", qcmMd.split("\n").slice(0,5).join("\n") + "\n…");

    // Envoyer le QCM par email
    await sendEmail(emailRecipient, qcmMd);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

// Lancer le process
generateAndSendQCM();
