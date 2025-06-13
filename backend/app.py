import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

QCMS_FOLDER = "qcms"
os.makedirs(QCMS_FOLDER, exist_ok=True)

def generate_qcm_from_code(code_block, author):
    # Ici, on simule la génération via Ollama ou autre LLM
    # Retourne un dict QCM minimal
    qcm = {
        "qcm_id": f"{author}_qcm_001",
        "author": author,
        "questions": [
            {
                "question": "Quelle est la fonction principale du code fourni ?",
                "choices": ["Calcul", "Affichage", "Lecture de fichier", "Autre"],
                "answer": "Calcul"
            }
        ]
    }
    return qcm

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.json
    code_block = data.get("code_block")
    author = data.get("author", "unknown")

    if not code_block:
        return jsonify({"error": "Pas de code fourni"}), 400

    qcm = generate_qcm_from_code(code_block, author)

    # Sauvegarde dans qcms/<author>/<qcm_id>.json
    author_folder = os.path.join(QCMS_FOLDER, author)
    os.makedirs(author_folder, exist_ok=True)
    filepath = os.path.join(author_folder, f"{qcm['qcm_id']}.json")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(qcm, f, ensure_ascii=False, indent=2)

    return jsonify({"qcm_id": qcm["qcm_id"]})

@app.route("/generate_teacher_pdf", methods=["POST"])
def generate_teacher_pdf():
    data = request.json
    qcm_id = data.get("qcm_id")
    author = data.get("author", "unknown")

    if not qcm_id:
        return jsonify({"error": "Pas de qcm_id fourni"}), 400

    # Ici tu peux générer un PDF avec reportlab ou autre, simulons juste un OK
    print(f"Génération PDF pour QCM {qcm_id} de {author}")
    return jsonify({"status": "PDF généré (simulé)"})

@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcm(author):
    author_folder = os.path.join(QCMS_FOLDER, author)
    if not os.path.exists(author_folder):
        return jsonify([])

    qcm_files = [f for f in os.listdir(author_folder) if f.endswith(".json")]
    qcms = []
    for filename in qcm_files:
        with open(os.path.join(author_folder, filename), "r", encoding="utf-8") as f:
            qcms.append(json.load(f))
    return jsonify(qcms)

@app.route("/")
def home():
    return "API Flask pour QCM OK"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
