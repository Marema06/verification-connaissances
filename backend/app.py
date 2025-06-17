import os
import uuid
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Configuration ---
app = Flask(__name__)
CORS(app)

# Dossier où seront stockés les QCM et PDFs
QCM_DIR = "qcms"
os.makedirs(QCM_DIR, exist_ok=True)

# API Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "mixtral-8x7b-32768"

# --- Endpoints ---

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data   = request.get_json() or {}
    code   = data.get("code_block", "")
    author = data.get("author", "anonymous")

    if not code:
        return jsonify(error="code_block manquant"), 400

    # Construire le prompt
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

    # Appel à l'API Groq
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
        content = body["choices"][0]["message"]["content"]
        qcm_id  = str(uuid.uuid4())
        author_dir = os.path.join(QCM_DIR, author)
        os.makedirs(author_dir, exist_ok=True)

        # Sauvegarder le JSON tel quel
        filepath = os.path.join(author_dir, f"{qcm_id}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        return jsonify(status="ok", qcm_id=qcm_id), 200

    except Exception as e:
        return jsonify(error="Parsing Groq échoué", details=str(e), raw=body), 500


@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcms(author):
    """
    Renvoie la liste des QCM pour un author sous la forme :
    { qcms: [ { qcm_id, question…, choices…, answer? }… ] }
    """
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


@app.route("/generate_teacher_pdf", methods=["POST"])
def generate_teacher_pdf():
    """
    Génère un PDF professeur à partir d'un qcm_id.
    """
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

    # Génération du PDF
    doc    = SimpleDocTemplate(pdf_path)
    styles = getSampleStyleSheet()
    elems  = [Paragraph(f"QCM Professeur – {author}", styles["Title"]), Spacer(1,12)]
    for i, q in enumerate(qcm_data, start=1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Heading3"]))
        for choice in q.get("choices", []):
            elems.append(Paragraph(choice, styles["Normal"]))
        elems.append(Spacer(1,12))
    doc.build(elems)

    return jsonify(pdf_url=f"/qcms/{author}/{qcm_id}_teacher.pdf"), 200


@app.route("/qcms/<path:filename>")
def serve_qcm_file(filename):
    return send_from_directory(QCM_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
