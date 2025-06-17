import os
import uuid
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Configuration ---
app = Flask(__name__)
CORS(app)

# Dossiers de stockage
QCM_DIR = "qcms"
ANSWERS_DIR = "answers"
os.makedirs(QCM_DIR, exist_ok=True)
os.makedirs(ANSWERS_DIR, exist_ok=True)

# API Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "mixtral-8x7b-32768"

# --- Endpoints ---

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json() or {}
    code = data.get("code_block", "")
    author = data.get("author", "anonymous")

    if not code:
        return jsonify(error="code_block manquant"), 400

    prompt = f"""
Génère un QCM de 3 questions sur ce code.
Pour chaque question, 3 choix (A, B, C) et indique la bonne réponse.
Répond strictement au format JSON suivant :

[
  {{
    "question": "…",
    "choices": ["A. …", "B. …", "C. …"],
    "answer": "A"
  }},
  …
]

Code :
{code}
"""

    resp = requests.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=30
    )
    if resp.status_code != 200:
        return jsonify(error="Erreur API Groq", details=resp.text), 500

    body = resp.json()
    try:
        content_str = body["choices"][0]["message"]["content"]
        qcm_list = json.loads(content_str)

        qcm_id = str(uuid.uuid4())
        author_dir = os.path.join(QCM_DIR, author)
        os.makedirs(author_dir, exist_ok=True)

        obj = {
            "qcm_id": qcm_id,
            "qcm": qcm_list
        }

        filepath = os.path.join(author_dir, f"{qcm_id}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

        return jsonify(status="ok", qcm_id=qcm_id), 200

    except Exception as e:
        return jsonify(error="Parsing Groq échoué", details=str(e), raw=body), 500


@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcms(author):
    author_dir = os.path.join(QCM_DIR, author)
    if not os.path.isdir(author_dir):
        return jsonify(qcms=[]), 200

    result = []
    for fname in sorted(os.listdir(author_dir), reverse=True):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(author_dir, fname)
        try:
            data = json.loads(open(path, "r", encoding="utf-8").read())
            data["qcm_id"] = fname[:-5]
            result.append(data)
        except:
            continue

    return jsonify(qcms=result), 200


@app.route("/submit_answers", methods=["POST"])
def submit_answers():
    """
    Reçoit les réponses d’un étudiant pour un QCM donné et les sauvegarde.
    Payload attendu : { author, qcm_id, answers: [ "A", "B", "C", ... ] }
    """
    data = request.get_json() or {}
    author = data.get("author")
    qcm_id = data.get("qcm_id")
    answers = data.get("answers")

    if not author or not qcm_id or not answers:
        return jsonify(error="author, qcm_id et answers sont requis"), 400

    author_dir = os.path.join(ANSWERS_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    filepath = os.path.join(author_dir, f"{qcm_id}.json")
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({"author": author, "qcm_id": qcm_id, "answers": answers}, f, ensure_ascii=False, indent=2)
        return jsonify(status="ok", message="Réponses sauvegardées"), 200
    except Exception as e:
        return jsonify(error="Erreur sauvegarde réponses", details=str(e)), 500


@app.route("/generate_teacher_pdf", methods=["POST"])
def generate_teacher_pdf():
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    data   = request.get_json() or {}
    author = data.get("author", "anonymous")
    qcm_id = data.get("qcm_id")
    author_dir = os.path.join(QCM_DIR, author)
    qcm_path   = os.path.join(author_dir, f"{qcm_id}.json")

    if not os.path.isfile(qcm_path):
        return jsonify(error="QCM introuvable"), 404

    qcm_data = json.loads(open(qcm_path, "r", encoding="utf-8").read())
    pdf_path = os.path.join(author_dir, f"{qcm_id}_teacher.pdf")

    doc    = SimpleDocTemplate(pdf_path)
    styles = getSampleStyleSheet()
    elems  = [Paragraph(f"QCM Professeur – {author}", styles["Title"]), Spacer(1,12)]
    for i, q in enumerate(qcm_data.get("qcm", []), start=1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Heading3"]))
        for choice in q.get("choices", []):
            elems.append(Paragraph(choice, styles["Normal"]))
        elems.append(Spacer(1,12))
    doc.build(elems)

    return jsonify(pdf_url=f"/qcms/{author}/{qcm_id}_teacher.pdf"), 200


@app.route("/qcms/<path:filename>")
def serve_qcm_file(filename):
    return send_from_directory(QCM_DIR, filename)


@app.route("/healthz", methods=["GET"])
def healthz():
    return "OK", 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
