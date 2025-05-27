from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

QCM_STORAGE_FILE = "generated_qcm.json"

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code_block = data.get("code_block", "")

    # QCM fictif basé sur le code envoyé
    qcm = [
        {
            "question": "Que fait ce code ?",
            "choices": ["Affiche Bonjour", "Affiche Hello World", "Rien"],
            "answer": "Affiche Hello World"
        }
    ]

    with open(QCM_STORAGE_FILE, "w") as f:
        json.dump(qcm, f)

    return jsonify(qcm)

@app.route("/get_qcm", methods=["GET"])
def get_qcm():
    if not os.path.exists(QCM_STORAGE_FILE):
        return jsonify([])
    with open(QCM_STORAGE_FILE) as f:
        qcm = json.load(f)
    return jsonify(qcm)

if __name__ == "__main__":
    app.run(port=5000)
