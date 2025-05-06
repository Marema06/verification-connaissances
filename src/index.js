require("dotenv").config();
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { generateQCMwithHF } = require("./services/hf");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

if (!EMAIL_USER || !EMAIL_PASS) throw new Error("❌ Définis EMAIL_USER et EMAIL_PASS dans .env");
if (!EMAIL_TO) throw new Error("❌ Définis EMAIL_TO dans .env");

async function sendEmail(recipient, qcmMarkdown) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: EMAIL_USER,
    to: recipient,
    subject: "📋 QCM généré automatiquement",
    text: qcmMarkdown,
  });

  console.log("✅ Email envoyé à", recipient);
}

async function generateAndSendQCM() {
  try {
    const codeDir = path.join(__dirname);
    const files = fs.readdirSync(codeDir);

    let fullCode = "";
    for (const file of files) {
      const filePath = path.join(codeDir, file);
      if (fs.statSync(filePath).isFile() && file.endsWith(".js") && file !== "index.js") {
        const code = fs.readFileSync(filePath, "utf-8");
        fullCode += code + "\n\n";
      }
    }

    if (!fullCode.trim()) {
      throw new Error("❌ Aucun code étudiant trouvé dans src/");
    }

    console.log("⏳ Génération du QCM avec Hugging Face...");
    const qcm = await generateQCMwithHF(fullCode);
    console.log("✅ QCM généré !");

    await sendEmail(EMAIL_TO, qcm);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

generateAndSendQCM();
