const axios = require("axios");
require("dotenv").config();

const HF_API_KEY = process.env.HF_API_KEY;
if (!HF_API_KEY) throw new Error("❌ Merci de définir HF_API_KEY dans votre fichier .env");

const MODEL = "HuggingFaceH4/zephyr-7b-beta";
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

/**
 * Envoie un prompt à Hugging Face pour générer 3 questions QCM.
 * Renvoie uniquement les questions, sans répéter le code.
 */
async function generateQCMwithHF(code) {
  const prompt = `
Tu es un assistant pédagogique.
À partir du code JavaScript fourni, **génère uniquement** 3 questions à choix multiples (QCM) avec 4 options (A, B, C, D) et indique la bonne réponse pour chaque question.

**Ne répète pas le code** et ne fournis **aucune information supplémentaire**.

Code :
${code}
`;

  const { data } = await axios.post(API_URL, {
    inputs: prompt,
    parameters: { max_new_tokens: 200, temperature: 0.7, top_p: 0.9 },
    options: { wait_for_model: true }
  }, {
    headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
    timeout: 60000
  });

  const raw = Array.isArray(data) ? data[0].generated_text : data.generated_text;
  if (!raw) throw new Error("❌ Réponse vide de l'API Hugging Face");

  // Extraire à partir de la première question
  const match = raw.match(/\d+\./);
  if (match) {
    return raw.slice(raw.indexOf(match[0])).trim();
  }
  return raw.trim();
}

module.exports = { generateQCMwithHF };
