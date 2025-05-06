require("dotenv").config();
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { generateQCMwithHF } = require("./services/hf");

// Chargement des variables d'environnement
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("❌ Définis EMAIL_USER et EMAIL_PASS dans .env");
}

const emailRecipient = process.env.EMAIL_TO;
if (!emailRecipient) {
  throw new Error("❌ Définis EMAIL_TO dans .env");
}

async function sendEmail(recipient, qcmMarkdown) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    logger: true,
    debug: true
  });

  // Vérification du serveur SMTP
  transporter.verify((err, success) => {
    if (err) console.error("❌ SMTP Error:", err);
    else console.log("✅ SMTP Ready");
  });

  // Envoi de l'email
  const info = await transporter.sendMail({
    from: EMAIL_USER,
    to: recipient,
    subject: "🔎 Votre QCM de vérification de code",
    text: qcmMarkdown,
  });
  console.log("✅ Email envoyé à", recipient, "| response:", info.response);
}

async function generateAndSendQCM() {
  try {
    // Lecture des fichiers JS de src/ en excluant les utilitaires
    const codeDir = __dirname;
    let fullCode = "";

    const files = fs.readdirSync(codeDir);
    for (const file of files) {
      if (
        file.endsWith(".js") &&
        !["index.js", "generatePDF.js", "generateHoles.js"].includes(file)
      ) {
        fullCode += fs.readFileSync(path.join(codeDir, file), "utf-8") + "\n\n";
      }
    }
    if (!fullCode.trim()) {
      throw new Error("❌ Aucun code étudiant trouvé dans src/");
    }

    // Génération du QCM via Hugging Face
    console.log("⏳ Génération du QCM…");
    const qcmMd = await generateQCMwithHF(fullCode);
    console.log("✅ QCM généré");

    // Envoi du QCM par email
    await sendEmail(emailRecipient, qcmMd);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

generateAndSendQCM();
