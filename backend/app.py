import os
import uuid
import json
import re
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

QCM_DIR = "qcms"
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"  # adapte au modèle Ollama que tu utilises

os.makedirs(QCM_DIR, exist_ok=True)

def build_prompt(code: str) -> str:
    return f"""
Tu es un assistant pédagogique. Génère un QCM (questions à choix multiples) sur le code suivant :

```{code}```

Format de réponse JSON attendu :

{{
  "qcm": [
    {{
      "question": "Question ici",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer_index": 0
    }}
  ]
}}
"""

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code = data.get("code_block")
    author = data.get("author", "anonymous")

    if not code:
        return jsonify({"error": "code_block manquant"}), 400

    prompt = build_prompt(code)
    response = requests.post(
        OLLAMA_API_URL,
        json={"model": MODEL_NAME, "prompt": prompt, "stream": False}
    )

    if response.status_code != 200:
        return jsonify({"error": "Erreur avec Ollama"}), 500

    try:
        full_output = response.json()["response"]
        match = re.search(r'\{.*"qcm"\s*:\s*\[.*?\]\s*\}', full_output, re.DOTALL)
        if not match:
            raise ValueError("Format JSON introuvable dans la réponse.")
        qcm_data = json.loads(match.group())
    except Exception as e:
        return jsonify({
            "error": f"Erreur de parsing JSON: {e}",
            "raw": response.text
        }), 500

    qcm_id = str(uuid.uuid4())
    qcm_path = os.path.join(QCM_DIR, f"{qcm_id}.json")

    with open(qcm_path, "w") as f:
        json.dump({
            "author": author,
            "qcm_id": qcm_id,
            "qcm": qcm_data.get("qcm", [])
        }, f, indent=2)

    return jsonify({"qcm_id": qcm_id, "url": f"/qcms/{qcm_id}.json"})

@app.route("/qcms/<qcm_id>.json")
def get_qcm_by_id(qcm_id):
    return send_from_directory(QCM_DIR, f"{qcm_id}.json")

@app.route("/get_qcm/<author>")
def get_qcm_by_author(author):
    for filename in sorted(os.listdir(QCM_DIR), reverse=True):
        path = os.path.join(QCM_DIR, filename)
        with open(path, "r") as f:
            data = json.load(f)
            if data.get("author") == author:
                return jsonify(data)
    return jsonify({"error": "Aucun QCM trouvé"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
