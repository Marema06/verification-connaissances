import os
import time
import json
import requests
from flask import Flask, request, jsonify, abort

app = Flask(__name__)

# Stockage en mémoire (pour le prototype)
qcm_store = {}
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'orca-mini')

@app.route('/healthz')
def health_check():
    """Endpoint de santé simplifié"""
    return "OK", 200

@app.route('/debug')
def debug_connection():
    """Endpoint de débogage pour vérifier les connexions"""
    try:
        # Vérifier la connexion à Ollama
        ollama_url = f"{OLLAMA_BASE_URL}/api/tags"
        start_time = time.time()
        ollama_response = requests.get(ollama_url, timeout=30)
        ollama_time = time.time() - start_time

        return jsonify({
            "status": "running",
            "flask_port": 5000,
            "ollama_connection": {
                "url": ollama_url,
                "status_code": ollama_response.status_code,
                "response_time": f"{ollama_time:.2f}s",
                "details": ollama_response.json() if ollama_response.status_code == 200 else ollama_response.text
            },
            "environment": {
                "OLLAMA_BASE_URL": OLLAMA_BASE_URL,
                "OLLAMA_MODEL": OLLAMA_MODEL
            }
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Échec de la connexion à Ollama",
            "ollama_url": ollama_url
        }), 500

def generate_with_ollama(prompt):
    """Génère du texte avec Ollama en mode CPU"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_ctx": 4096
                }
            },
            timeout=300  # Timeout long pour les modèles CPU
        )
        response.raise_for_status()
        return response.json().get('response', '')
    except Exception as e:
        app.logger.error(f"Erreur Ollama: {str(e)}")
        return None

def parse_qcm_response(raw_response):
    """Parse la réponse brute d'Ollama en structure QCM"""
    try:
        # Ceci est un exemple - adapter à votre format réel de réponse
        if "QUESTIONS:" not in raw_response:
            return None

        questions = []
        current_question = None

        for line in raw_response.split('\n'):
            line = line.strip()
            if line.startswith("Q:"):
                if current_question:
                    questions.append(current_question)
                current_question = {
                    "question": line[2:].strip(),
                    "options": [],
                    "correct": None
                }
            elif line.startswith(("A.", "B.", "C.", "D.")):
                option_text = line[2:].strip()
                current_question["options"].append(option_text)
            elif line.startswith("Réponse:"):
                correct_letter = line.split(":")[1].strip()[0]
                current_question["correct"] = ord(correct_letter) - ord('A')

        if current_question:
            questions.append(current_question)

        return questions if questions else None
    except Exception as e:
        app.logger.error(f"Erreur parsing QCM: {str(e)}")
        return None

@app.route('/generate_qcm', methods=['POST'])
def generate_qcm():
    """Endpoint pour générer un QCM à partir d'un bloc de code"""
    try:
        data = request.get_json()
        code_block = data.get('code', '')
        author = data.get('author', 'anonymous')

        if not code_block:
            return jsonify({"error": "Le bloc de code est requis"}), 400

        app.logger.info(f"Génération QCM pour le code:\n{code_block[:200]}...")

        # Créer le prompt pour Ollama
        prompt = (
            "Tu es un expert en génération de QCM sur du code Python. "
            "Génère un QCM avec 3 questions basées sur le code suivant. "
            "Format attendu:\n\n"
            "QUESTIONS:\n"
            "Q: [Question 1]\n"
            "A. [Option A]\n"
            "B. [Option B]\n"
            "C. [Option C]\n"
            "D. [Option D]\n"
            "Réponse: [Lettre correcte]\n\n"
            "Q: [Question 2]\n"
            "...\n\n"
            "Code:\n"
            f"{code_block}\n\n"
            "Attention: Ne montre aucune explication supplémentaire, seulement le format QCM."
        )

        # Générer avec Ollama
        start_time = time.time()
        raw_response = generate_with_ollama(prompt)
        if raw_response is None:
            return jsonify({"error": "Échec de la génération avec Ollama"}), 500

        generation_time = time.time() - start_time
        app.logger.info(f"Génération Ollama terminée en {generation_time:.2f}s")

        # Parser la réponse
        questions = parse_qcm_response(raw_response)
        if not questions:
            app.logger.error(f"Format QCM invalide:\n{raw_response}")
            return jsonify({
                "error": "Format de réponse QCM invalide",
                "raw_response": raw_response
            }), 500

        # Stocker en mémoire
        qcm_id = f"qcm_{int(time.time())}"
        qcm_store[qcm_id] = {
            "id": qcm_id,
            "author": author,
            "code_snippet": code_block[:500],  # Stocker un extrait
            "generation_time": generation_time,
            "questions": questions,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        return jsonify({
            "qcm_id": qcm_id,
            "message": f"QCM généré avec succès en {generation_time:.2f} secondes",
            "question_count": len(questions)
        })

    except Exception as e:
        app.logger.exception("Erreur dans generate_qcm")
        return jsonify({
            "error": "Erreur interne du serveur",
            "details": str(e)
        }), 500

@app.route('/qcm/<qcm_id>')
def get_qcm(qcm_id):
    """Récupère un QCM généré par son ID"""
    qcm = qcm_store.get(qcm_id)
    if not qcm:
        abort(404, description="QCM non trouvé")

    # Ne pas renvoyer le code complet pour économiser de la bande passante
    response = {**qcm}
    if "code_snippet" in response:
        del response["code_snippet"]

    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
