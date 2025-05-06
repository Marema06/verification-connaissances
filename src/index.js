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
  // 1) Récupérer tout le code JS du dépôt (dans src/)
  const codeDir = path.resolve(__dirname, "src");
  let fullCode = "";
  for (const f of fs.readdirSync(codeDir)) {
    if (f.endsWith(".js")) {
      fullCode += fs.readFileSync(path.join(codeDir, f), "utf-8") + "\n\n";
    }
  }
  if (!fullCode.trim()) throw new Error("❌ Pas de code JS trouvé dans src/");

  // 2) Générer le QCM
  console.log("⏳ Génération du QCM...");
  const qcmMd = await generateQCMwithHF(fullCode);
  console.log("✅ QCM généré");

  // 3) Envoyer le QCM par email
  await sendEmail(emailRecipient, qcmMd);
}

generateAndSendQCM().catch(err => {
  console.error("❌ Erreur :", err.message || err);
  process.exit(1);
});
