from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import uuid
import json
import os

app = Flask(__name__, static_folder="dist")
CORS(app)

DATA_FILE = "qcm_data.json"

# Chargement et sauvegarde des données
def load_data():
    if not os.path.exists(DATA_FILE):
        return {"qcms": {}, "responses": []}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

# Générateur de QCM simulé avec 10 questions
def fake_qcm_generator(code_block: str):
    return [
        {
            "question": "Que fait ce code ?",
            "choices": ["A. Additionne deux nombres", "B. Multiplie deux nombres", "C. Crée une chaîne"],
            "answer": "A",
            "explanation": "Le code additionne deux nombres via return a + b"
        },
        {
            "question": "Quelle est la sortie de la fonction si a = 2 et b = 3 ?",
            "choices": ["A. 5", "B. 6", "C. 23"],
            "answer": "A",
            "explanation": "2 + 3 = 5"
        },
        {
            "question": "Quel est le type de retour de la fonction ?",
            "choices": ["A. Entier", "B. Chaîne", "C. Booléen"],
            "answer": "A",
            "explanation": "La fonction retourne un entier"
        },
        {
            "question": "Quelle structure de contrôle est utilisée dans ce code ?",
            "choices": ["A. Boucle for", "B. Condition if", "C. Fonction récursive"],
            "answer": "B",
            "explanation": "Le code utilise une condition if"
        },
        {
            "question": "Quelle est la portée de la variable a ?",
            "choices": ["A. Locale à la fonction", "B. Globale", "C. Statique"],
            "answer": "A",
            "explanation": "La variable a est locale à la fonction"
        },
        {
            "question": "Quel est le type de la variable b ?",
            "choices": ["A. Entier", "B. Liste", "C. Chaîne"],
            "answer": "A",
            "explanation": "b est un entier"
        },
        {
            "question": "Quel mot-clé est utilisé pour définir une fonction en Python ?",
            "choices": ["A. func", "B. def", "C. function"],
            "answer": "B",
            "explanation": "def est utilisé pour définir une fonction"
        },
        {
            "question": "Comment appelle-t-on une fonction qui s'appelle elle-même ?",
            "choices": ["A. Fonction itérative", "B. Fonction récursive", "C. Fonction lambda"],
            "answer": "B",
            "explanation": "Une fonction récursive s'appelle elle-même"
        },
        {
            "question": "Quelle est la bonne syntaxe pour un commentaire en Python ?",
            "choices": ["A. // commentaire", "B. # commentaire", "C. <!-- commentaire -->"],
            "answer": "B",
            "explanation": "Le symbole # sert pour les commentaires"
        },
        {
            "question": "Quelle est la sortie de print(2 ** 3) ?",
            "choices": ["A. 6", "B. 8", "C. 9"],
            "answer": "B",
            "explanation": "2 puissance 3 est égal à 8"
        }
    ]

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code = data.get("code_block", "")
    author = data.get("author", "anonymous")

    if not code.strip():
        return jsonify({"error": "Code manquant"}), 400

    qcm_data = fake_qcm_generator(code)
    qcm_id = str(uuid.uuid4())

    db = load_data()
    db["qcms"][qcm_id] = {
        "author": author,
        "code": code,
        "questions": qcm_data
    }
    save_data(db)

    return jsonify({
        "qcm_id": qcm_id,
        "questions": qcm_data
    })

@app.route("/submit_answers", methods=["POST"])
def submit_answers():
    data = request.get_json()
    qcm_id = data.get("qcm_id")
    student_name = data.get("student_name")
    answers = data.get("answers")

    if not all([qcm_id, student_name, answers]):
        return jsonify({"error": "Champs requis manquants"}), 400

    db = load_data()
    db["responses"].append({
        "qcm_id": qcm_id,
        "student_name": student_name,
        "answers": answers
    })
    save_data(db)

    return jsonify({"status": "Réponses reçues avec succès !"})
# 🧑‍🏫 Route : Accès prof – Voir toutes les réponses
@app.route("/all_responses")
def all_responses():
    db = load_data()
    results = []
    for r in db['responses']:
        qcm = db['qcms'].get(r['qcm_id'], {})
        results.append({
            "student_name": r["student_name"],
            "qcm_id": r["qcm_id"],
            "questions": qcm.get("questions", []),
            "answers": r["answers"]
        })
    return jsonify(results)
@app.route("/healthz")
def health():
    return jsonify({"status": "ok"})

# Servir le frontend Angular (build production)
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
