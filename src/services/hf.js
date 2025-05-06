const axios = require("axios");

const HF_API_KEY = process.env.HF_API_KEY;
if (!HF_API_KEY) throw new Error("❌ Définis HF_API_KEY dans .env");

const model = "mistralai/Mixtral-8x7B-Instruct-v0.1";

async function generateQCMwithHF(code, language = "JavaScript") {
  const prompt = `
Tu es un assistant pédagogique expert en ${language}.
Analyse le code suivant et génère un QCM en Markdown.

Consignes :
- Génére 3 à 5 questions pertinentes sur ce code.
- Pour chaque question, propose 4 choix (a, b, c, d), une seule bonne réponse.
- Ne donne pas la réponse.
- Utilise un format lisible en Markdown.

Code étudiant :
\`\`\`${language.toLowerCase()}
${code}
\`\`\`
`;

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const output = Array.isArray(response.data)
      ? response.data[0]?.generated_text
      : response.data.generated_text;

    if (!output) throw new Error("❌ Aucun texte généré.");

    const qcmPart = extractQCM(output);
    if (!qcmPart || qcmPart.split("\n").filter(line => line.match(/^\d+\./)).length < 2) {
      throw new Error("❌ QCM incomplet ou mal généré.");
    }

    return qcmPart.trim();
  } catch (err) {
    console.error("❌ Erreur Hugging Face :", err.message);
    return "❌ Erreur lors de la génération du QCM.";
  }
}

function extractQCM(text) {
  // Cherche les questions commençant par "1." jusqu’à la fin
  const start = text.search(/1\.\s/);
  if (start === -1) return null;
  return text.slice(start);
}

module.exports = { generateQCMwithHF };
