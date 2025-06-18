import os
import uuid
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"

def analyze_code_and_generate_qcm(code: str):
    """Analyse le code et génère un QCM pertinent"""
    prompt = f"""
    Tu es un expert en pédagogie Python. Génère un QCM de 5 questions spécifiques à ce code.
    Chaque question doit tester la compréhension réelle du code, pas juste la syntaxe.

    Règles strictes:
    1. Questions sur l'intention du code, pas sur la syntaxe
    2. Distracteurs plausibles mais incorrects
    3. Format JSON strict:
    [
      {{
        "question": "...",
        "choices": ["A. ...", "B. ...", "C. ..."],
        "answer": "A|B|C",
        "explanation": "..."
      }}
    ]

    Code à analyser:
    {code}
    """

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "format": "json",
                "options": {"temperature": 0.3}
            },
            timeout=60
        )
        return json.loads(response.json()["response"])
    except Exception as e:
        print(f"Erreur Ollama: {str(e)}")
        return None

@app.route("/generate_from_push", methods=["POST"])
def generate_from_push():
    # Récupère le code depuis la push GitHub
    push_data = request.json
    files = push_data.get("commits", [{}])[0].get("modified", [])

    # Ici vous devriez récupérer le contenu des fichiers
    # Pour l'exemple, on suppose qu'on a accès au code
    sample_code = """
    def factorial(n):
        if n == 0:
            return 1
        else:
            return n * factorial(n-1)
    """

    qcm = analyze_code_and_generate_qcm(sample_code)
    if not qcm:
        return jsonify({"error": "Échec de génération"}), 500

    # Sauvegarde en base de données ou fichier
    qcm_id = str(uuid.uuid4())
    save_to_db(qcm_id, qcm)

    return jsonify({
        "qcm_id": qcm_id,
        "questions": qcm
    })

def save_to_db(qcm_id, qcm_data):
    """Simule une sauvegarde en base"""
    os.makedirs("qcms", exist_ok=True)
    with open(f"qcms/{qcm_id}.json", "w") as f:
        json.dump(qcm_data, f)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
