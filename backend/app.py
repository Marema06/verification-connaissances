import os
import uuid
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "orca-mini"
QCM_DIR = "qcms"
os.makedirs(QCM_DIR, exist_ok=True)

# Endpoint de santé pour le CI
@app.route('/healthz')
def health_check():
    return jsonify({"status": "ok", "timestamp": time.time()}), 200

def generate_qcm_prompt(code: str) -> str:
    return f"""
    [INSTRUCTIONS]
    Tu es un expert en Python. Génère un QCM technique de 5 questions basé sur le code suivant.
    Format JSON strict:
    {{
      "questions": [
        {{
          "question": "Texte de la question",
          "choices": ["A. Option 1", "B. Option 2", "C. Option 3"],
          "answer": "A",
          "explanation": "Explication technique détaillée"
        }}
      ]
    }}

    Code:
    {code}
    """

def call_ollama(prompt: str, max_retries=3) -> dict:
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.5}
                },
                timeout=120
            )
            response.raise_for_status()
            return response.json().get("response")
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            print(f"Tentative {attempt+1} échouée: {str(e)}")
            if attempt < max_retries - 1:
                print("Nouvelle tentative dans 5 secondes...")
                time.sleep(5)
    return None

@app.route('/generate_qcm', methods=['POST'])
def generate_qcm():
    # Vérification du Content-Type
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "Le champ 'code' est requis"}), 400

    # Génération du prompt
    prompt = generate_qcm_prompt(code)

    # Appel à Ollama
    qcm_response = call_ollama(prompt)

    if not qcm_response:
        return jsonify({"error": "Échec de la génération du QCM après plusieurs tentatives"}), 500

    try:
        qcm_data = json.loads(qcm_response)

        # Validation de la structure
        if "questions" not in qcm_data or not isinstance(qcm_data["questions"], list):
            raise ValueError("Structure JSON invalide: 'questions' manquant ou incorrect")

        # Sauvegarde du QCM
        qcm_id = str(uuid.uuid4())
        with open(f"{QCM_DIR}/{qcm_id}.json", "w", encoding="utf-8") as f:
            json.dump(qcm_data, f, ensure_ascii=False, indent=2)

        return jsonify({
            "qcm_id": qcm_id,
            "message": "QCM généré avec succès",
            "question_count": len(qcm_data["questions"])
        })
    except Exception as e:
        print(f"Erreur de traitement: {str(e)}")
        return jsonify({
            "error": "Erreur de traitement",
            "details": str(e),
            "raw_response": qcm_response
        }), 500

@app.route('/qcm/<qcm_id>', methods=['GET'])
def get_qcm(qcm_id):
    try:
        file_path = f"{QCM_DIR}/{qcm_id}.json"

        # Vérification que le fichier existe
        if not os.path.exists(file_path):
            return jsonify({
                "error": "QCM non trouvé",
                "qcm_id": qcm_id,
                "available_qcms": os.listdir(QCM_DIR)
            }), 404

        # Lecture du fichier
        with open(file_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({
            "error": "Erreur de lecture",
            "details": str(e)
        }), 500

@app.route('/submit', methods=['POST'])
def submit_answers():
    data = request.json
    return jsonify({
        "status": "success",
        "message": "Réponses enregistrées",
        "received_data": data
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)import os
import uuid
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "orca-mini"
QCM_DIR = "qcms"
os.makedirs(QCM_DIR, exist_ok=True)

# Endpoint de santé pour le CI
@app.route('/healthz')
def health_check():
    return jsonify({"status": "ok", "timestamp": time.time()}), 200

def generate_qcm_prompt(code: str) -> str:
    return f"""
    [INSTRUCTIONS]
    Tu es un expert en Python. Génère un QCM technique de 5 questions basé sur le code suivant.
    Format JSON strict:
    {{
      "questions": [
        {{
          "question": "Texte de la question",
          "choices": ["A. Option 1", "B. Option 2", "C. Option 3"],
          "answer": "A",
          "explanation": "Explication technique détaillée"
        }}
      ]
    }}

    Code:
    {code}
    """

def call_ollama(prompt: str, max_retries=3) -> dict:
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.5}
                },
                timeout=120
            )
            response.raise_for_status()
            return response.json().get("response")
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            print(f"Tentative {attempt+1} échouée: {str(e)}")
            if attempt < max_retries - 1:
                print("Nouvelle tentative dans 5 secondes...")
                time.sleep(5)
    return None

@app.route('/generate_qcm', methods=['POST'])
def generate_qcm():
    # Vérification du Content-Type
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "Le champ 'code' est requis"}), 400

    # Génération du prompt
    prompt = generate_qcm_prompt(code)

    # Appel à Ollama
    qcm_response = call_ollama(prompt)

    if not qcm_response:
        return jsonify({"error": "Échec de la génération du QCM après plusieurs tentatives"}), 500

    try:
        qcm_data = json.loads(qcm_response)

        # Validation de la structure
        if "questions" not in qcm_data or not isinstance(qcm_data["questions"], list):
            raise ValueError("Structure JSON invalide: 'questions' manquant ou incorrect")

        # Sauvegarde du QCM
        qcm_id = str(uuid.uuid4())
        with open(f"{QCM_DIR}/{qcm_id}.json", "w", encoding="utf-8") as f:
            json.dump(qcm_data, f, ensure_ascii=False, indent=2)

        return jsonify({
            "qcm_id": qcm_id,
            "message": "QCM généré avec succès",
            "question_count": len(qcm_data["questions"])
        })
    except Exception as e:
        print(f"Erreur de traitement: {str(e)}")
        return jsonify({
            "error": "Erreur de traitement",
            "details": str(e),
            "raw_response": qcm_response
        }), 500

@app.route('/qcm/<qcm_id>', methods=['GET'])
def get_qcm(qcm_id):
    try:
        file_path = f"{QCM_DIR}/{qcm_id}.json"

        # Vérification que le fichier existe
        if not os.path.exists(file_path):
            return jsonify({
                "error": "QCM non trouvé",
                "qcm_id": qcm_id,
                "available_qcms": os.listdir(QCM_DIR)
            }), 404

        # Lecture du fichier
        with open(file_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({
            "error": "Erreur de lecture",
            "details": str(e)
        }), 500

@app.route('/submit', methods=['POST'])
def submit_answers():
    data = request.json
    return jsonify({
        "status": "success",
        "message": "Réponses enregistrées",
        "received_data": data
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
