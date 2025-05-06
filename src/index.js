const fs = require("fs");
const path = require("path");
const { generateQCMwithHF } = require("./services/hf");
const nodemailer = require("nodemailer");
require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const emailRecipient = "msarr0938@gmail.com"; // Email de l'étudiant

async function sendEmail(recipient, qcmMarkdown) {
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé à", recipient);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email :", error);
  }
}

async function generateAndSendQCM() {
  try {
    // Lire tout le code JavaScript du dépôt
    const codeDir = path.join(__dirname, "..", "src");
    let fullCode = "";

    // Parcours tous les fichiers du répertoire src
    const files = fs.readdirSync(codeDir);
    for (const file of files) {
      if (file.endsWith(".js")) { // Vérifier si le fichier est un JS
        const code = fs.readFileSync(path.join(codeDir, file), "utf-8");
        fullCode += code + "\n\n";
      }
    }

    // Générer le QCM à partir du code complet
    const qcmMarkdown = await generateQCMwithHF(fullCode);
    console.log("✅ QCM généré :\n", qcmMarkdown);

    // Envoyer le QCM à l'étudiant
    await sendEmail(emailRecipient, qcmMarkdown);
  } catch (err) {
    console.error("❌ Erreur globale :", err);
  }
}

generateAndSendQCM();
