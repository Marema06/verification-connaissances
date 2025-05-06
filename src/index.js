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

async function sendEmail(recipient, qcmMarkdown) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  await transporter.sendMail({
    from: EMAIL_USER,
    to: recipient,
    subject: "🔎 Votre QCM de vérification de code",
    text: qcmMarkdown,
  });
  console.log("✅ Email envoyé à", recipient);
}

async function generateAndSendQCM() {
  try {
    // Lire tout le code JavaScript du dépôt (dossier src)
    const codeDir = __dirname;
    let fullCode = "";

    // Parcours tous les fichiers JS dans src/
    const files = fs.readdirSync(codeDir);
    for (const file of files) {
      if (file.endsWith(".js")) {
        const code = fs.readFileSync(path.join(codeDir, file), "utf-8");
        fullCode += code + "\n\n";
      }
    }

    // Générer le QCM à partir du code complet
    console.log("⏳ Génération du QCM...");
    const qcmMd = await generateQCMwithHF(fullCode);
    console.log("✅ QCM généré");

    // Envoyer le QCM par email
    await sendEmail(emailRecipient, qcmMd);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}
