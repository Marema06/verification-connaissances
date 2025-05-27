from flask import Flask, request, jsonify
import uuid
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Pour autoriser les appels depuis Angular (frontend)

# Stockage en mémoire (à remplacer par une vraie base plus tard)
qcm_store = {}

@app.route('/generate_qcm', methods=['POST'])
def generate_qcm():
    data = request.json
    code_block = data.get('code_block', '')
    author = data.get('author', 'anonymous')

    # Ici on simule la génération du QCM depuis le code (à remplacer par LLM réel)
    qcm = [
        {
            "question": "Que fait cette ligne de code ?",
            "options": ["Affiche Hello", "Calcule", "Rien", "Erreur"],
            "correct_answer_index": 0
        },
        {
            "question": "Quelle est la sortie de ce code ?",
            "options": ["Hello World", "Erreur", "Rien", "42"],
            "correct_answer_index": 0
        }
    ]

    qcm_id = str(uuid.uuid4())

    # Stockage du QCM avec l’auteur
    qcm_store[qcm_id] = {
        "author": author,
        "qcm": qcm
    }

    return jsonify({"qcm": qcm, "qcm_id": qcm_id})

@app.route('/get_qcm/<author>', methods=['GET'])
def get_qcm(author):
    # Cherche le dernier QCM généré par cet author
    for qcm_id, data in reversed(list(qcm_store.items())):
        if data['author'] == author:
            return jsonify({"qcm": data['qcm'], "qcm_id": qcm_id})
    # Pas de QCM trouvé pour cet author
    return jsonify({"qcm": [], "qcm_id": None})

@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    data = request.json
    author = data.get('author')
    qcm_id = data.get('qcm_id')
    answers = data.get('answers')

    if not author or not qcm_id or answers is None:
        return jsonify({"error": "Données manquantes"}), 400

    # Ici on pourrait stocker les réponses, pour l'instant on confirme juste la réception
    # Par exemple, on peut vérifier les réponses correctes
    if qcm_id not in qcm_store:
        return jsonify({"error": "QCM introuvable"}), 404

    qcm = qcm_store[qcm_id]['qcm']
    score = 0
    for i, answer in enumerate(answers):
        if i < len(qcm) and answer == qcm[i]['correct_answer_index']:
            score += 1

    return jsonify({"message": "Réponses reçues", "score": score, "total": len(qcm)})
@app.route('/results', methods=['GET'])
def results():
    results_list = []
    for qcm_id, data in qcm_store.items():
        results_list.append({
            "qcm_id": qcm_id,
            "author": data["author"],
            "qcm": data["qcm"]
        })
    return jsonify(results_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
