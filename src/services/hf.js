// src/services/hf.js
const axios = require("axios");
require("dotenv").config();

const HF_API_KEY = process.env.HF_API_KEY;
if (!HF_API_KEY) {
  console.error("❌ Merci de définir HF_API_KEY dans votre fichier .env");
  process.exit(1);
}

// Modèle instruction‑tuned, relativement léger et disponible en inference API
const MODEL = "HuggingFaceH4/zephyr-7b-beta";
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

/**
 * Envoie un prompt à Hugging Face pour générer 3 questions QCM au format Markdown.
 * @param {string} code — le bloc de code source à interroger
 * @returns {Promise<string>} — le Markdown des questions générées
 */
async function generateQCMwithHF(code) {
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

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 200,
      temperature: 0.7,
      top_p: 0.9
    },
    options: { wait_for_model: true }
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      });

      // Certains endpoints renvoient un tableau…
      const data = response.data;
      const text = Array.isArray(data)
        ? data[0]?.generated_text
        : data.generated_text;
      if (!text) throw new Error("Réponse vide de l’API HF");
      return text.trim();
    } catch (err) {
      lastError = err;
      console.warn(`❗ Tentative ${attempt} échouée (${err.response?.status || err.code}), retry dans ${attempt}s…`);
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }

  throw lastError;
}

module.exports = { generateQCMwithHF };
