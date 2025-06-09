import os
import uuid
import json
import re
import requests
import string
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

QCM_DIR = "qcms"
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

os.makedirs(QCM_DIR, exist_ok=True)

def is_valid_author(author: str) -> bool:
    allowed = set(string.ascii_letters + string.digits + "_-")
    return all(c in allowed for c in author)

def build_prompt(code: str) -> str:
    return f"""
Tu es un assistant pédagogique. Génère un QCM sur le code suivant :

```{code}```

Répond au format JSON :

{{
  "qcm": [
    {{
      "question": "Question ici",
      "options": ["A","B","C","D"],
      "correct_answer_index": 0
    }}
  ]
}}
"""

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code = data.get("code_block","")
    author = data.get("author","anonymous")
    if not code:
        return jsonify(error="code_block manquant"),400
    if not is_valid_author(author):
        return jsonify(error="author invalide"),400

    prompt = build_prompt(code)
    try:
        resp = requests.post(OLLAMA_API_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        }, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return jsonify(error=f"Erreur Ollama: {e}"),500

    try:
        raw = resp.json().get("response","")
        m = re.search(r'\{.*"qcm"\s*:\s*\[.*?\]\s*\}', raw, re.DOTALL)
        if not m:
            raise ValueError("JSON introuvable")
        qcm_data = json.loads(m.group())
    except Exception as e:
        return jsonify(error=f"Parsing JSON: {e}", raw=resp.text),500

    qcm_id = str(uuid.uuid4())
    path = os.path.join(QCM_DIR, f"{qcm_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"author":author,"qcm_id":qcm_id,"qcm":qcm_data.get("qcm",[])}, f, indent=2)

    url = request.host_url.rstrip("/") + f"/qcms/{qcm_id}.json"
    return jsonify(qcm_id=qcm_id, url=url)

@app.route("/generate_teacher_pdf", methods=["POST"])
def generate_teacher_pdf():
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    data = request.get_json()
    qcm_id = data.get("qcm_id")
    author = data.get("author","anonymous")

    # charge JSON
    qcm_path = os.path.join(QCM_DIR, f"{qcm_id}.json")
    if not os.path.exists(qcm_path):
        return jsonify(error="QCM introuvable"),404

    with open(qcm_path, "r", encoding="utf-8") as f:
        qcm_data = json.load(f)

    pdf_path = os.path.join(QCM_DIR, f"{qcm_id}_teacher.pdf")
    doc = SimpleDocTemplate(pdf_path)
    styles = getSampleStyleSheet()
    elems = [Paragraph(f"QCM Professeur – {author}",styles["Title"]), Spacer(1,12)]
    for i, q in enumerate(qcm_data["qcm"],1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for j,opt in enumerate(q["options"],1):
            elems.append(Paragraph(f"   {chr(64+j)}. {opt}",styles["Normal"]))
        elems.append(Spacer(1,12))
    doc.build(elems)

    pdf_url = request.host_url.rstrip("/") + f"/qcms/{qcm_id}_teacher.pdf"
    return jsonify(pdf_url=pdf_url)

@app.route("/qcms/<path:filename>")
def serve_qcm_file(filename):
    return send_from_directory(QCM_DIR, filename)

@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcm_by_author(author):
    # Assure-toi que le dossier existe
    os.makedirs(QCM_DIR, exist_ok=True)

    qcms = []
    # Parcours tous les JSON du dossier
    for fname in sorted(os.listdir(QCM_DIR), reverse=True):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(QCM_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            # Ignore les fichiers corrompus ou mal formés
            print(f"⚠️ Ignoré {fname} : {e}")
            continue

        # Correspondance auteur (insensible à la casse)
        if data.get("author", "").lower() == author.lower():
            qcms.append(data)

    # Toujours renvoyer un JSON, même s'il est vide
    return jsonify({"qcms": qcms})


if __name__=="__main__":
    app.run(host="0.0.0.0", port=5000)
