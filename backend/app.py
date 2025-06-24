import os
import json
import re
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

import requests

app = Flask(__name__)
CORS(app)  # Autorise toutes les origines

# Configuration de l'URL de l'API Ollama locale
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Répertoire où enregistrer les QCM
QCM_FOLDER = "qcms"

# Crée le dossier s’il n’existe pas
os.makedirs(QCM_FOLDER, exist_ok=True)

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code_block = data.get("code_block")
    author = data.get("author", "anonymous")

    if not code_block:
        return jsonify({"error": "Le champ 'code_block' est requis."}), 400

    prompt = f"""
Tu es un assistant pédagogique. Génère un QCM au **format JSON strict** à partir du code suivant.
Le format **doit être uniquement** :

{{
  "questions": [
    {{
      "question": "....",
      "choices": ["...", "...", "..."],
      "answer": 0
    }}
  ]
}}

Ne donne **aucune explication** autour. Juste ce JSON.

Voici le code :
{code_block}
"""

    try:
        # Appel à Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": "llama2", "prompt": prompt, "stream": False}
        )
        result = response.json()
        generated = result.get("response", "")

        # Extraction du vrai JSON
        match = re.search(r"{[\s\S]*}", generated)
        if not match:
            return jsonify({
                "error": "Erreur de parsing du JSON généré par Ollama",
                "details": generated
            }), 500

        qcm_data = json.loads(match.group())

        # Création du dossier de l'auteur
        author_folder = os.path.join(QCM_FOLDER, author)
        os.makedirs(author_folder, exist_ok=True)

        # Enregistrement du fichier
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        file_path = os.path.join(author_folder, f"qcm_{timestamp}.json")
        with open(file_path, "w") as f:
            json.dump(qcm_data, f, indent=2)

        return jsonify({
            "message": "QCM généré et enregistré avec succès",
            "path": file_path,
            "qcm": qcm_data
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Erreur lors de la génération du QCM",
            "details": str(e)
        }), 500

@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcm(author):
    author_folder = os.path.join(QCM_FOLDER, author)
    if not os.path.exists(author_folder):
        return jsonify({"error": f"Aucun QCM trouvé pour l'auteur {author}"}), 404

    qcm_list = []
    for filename in os.listdir(author_folder):
        if filename.endswith(".json"):
            with open(os.path.join(author_folder, filename), "r") as f:
                try:
                    qcm = json.load(f)
                    qcm_list.append(qcm)
                except json.JSONDecodeError:
                    continue

    if not qcm_list:
        return jsonify({"error": "Aucun QCM valide trouvé."}), 404

    return jsonify(qcm_list), 200

@app.route("/healthz", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True)
