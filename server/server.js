require("dotenv").config();
const fetch = require("node-fetch");

const HF_API_TOKEN = process.env.HF_API_KEY;
const MODEL = "tiiuae/falcon-7b-instruct";
const prompt = "Explique le concept de programmation orientée objet à un débutant.";

async function callLLM() {
  const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        top_p: 0.9
      }
    })
  });

  const data = await res.json();

  const output = Array.isArray(data)
    ? data[0]?.generated_text
    : data.generated_text || JSON.stringify(data);

  console.log("🧠 Réponse du modèle :", output);
}

callLLM().catch(console.error);
