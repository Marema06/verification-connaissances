# backend/app.py
import os
import uuid
import json
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
CORS(app)

# --- Config ---
QCM_DIR       = "qcms"
TEACHER_EMAIL = os.getenv("TEACHER_EMAIL", "")  # ex: prof@example.com
SMTP_URL      = os.getenv("SMTP_URL", "")      # ex: smtp.gmail.com
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASS     = os.getenv("SMTP_PASS", "")

os.makedirs(QCM_DIR, exist_ok=True)

# --- Helpers ---
def send_pdf(to_addr, subject, body, pdf_path):
    msg = EmailMessage()
    msg["From"]    = SMTP_USER
    msg["To"]      = to_addr
    msg["Subject"] = subject
    msg.set_content(body)
    with open(pdf_path, "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="pdf",
            filename=os.path.basename(pdf_path)
        )
    with smtplib.SMTP_SSL(SMTP_URL) as smtp:
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

def stub_generate_qcm(code: str):
    """
    Ici tu appelleras Ollama / Groq.
    Pour l'instant on renvoie un QCM bidon à 3 questions.
    """
    return [
        {"question": "Que fait print('Hello') ?",
         "choices": ["A. Affiche Hello", "B. Lit un fichier", "C. Crée une variable"],
         "answer": "A"},
        {"question": "Quel type est `42` en Python ?",
         "choices": ["A. str", "B. int", "C. float"],
         "answer": "B"},
        {"question": "Comment commente-t-on en Python ?",
         "choices": ["A. //", "B. <!-- -->", "C. #"],
         "answer": "C"},
    ]

# --- Routes ---
@app.route("/healthz", methods=["GET"])
def healthz():
    return "OK", 200

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data   = request.get_json() or {}
    code   = data.get("code_block", "")
    author = data.get("author", "anonymous")

    if not code:
        return jsonify(error="code_block manquant"), 400

    # 1) Génère la liste de questions
    qcm_list = stub_generate_qcm(code)

    # 2) Crée un dossier par auteur
    qcm_id     = str(uuid.uuid4())
    author_dir = os.path.join(QCM_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    # 3) PDF Étudiant (questions + choix)
    student_pdf = os.path.join(author_dir, f"student_{qcm_id}.pdf")
    doc1 = SimpleDocTemplate(student_pdf)
    styles = getSampleStyleSheet()
    elems = []
    for i, q in enumerate(qcm_list, start=1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            elems.append(Paragraph(f"• {c}", styles["Normal"]))
        elems.append(Spacer(1,12))
    doc1.build(elems)

    # 4) PDF Prof (avec bonnes réponses)
    teacher_pdf = os.path.join(author_dir, f"teacher_{qcm_id}.pdf")
    doc2 = SimpleDocTemplate(teacher_pdf)
    elems = [Paragraph("QCM Prof – Corrigé", styles["Title"]), Spacer(1,12)]
    for i, q in enumerate(qcm_list, start=1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            mark = "✔" if c.startswith(q["answer"]) else "  "
            elems.append(Paragraph(f"{mark} {c}", styles["Normal"]))
        elems.append(Spacer(1,12))
    doc2.build(elems)

    # 5) Envoi automatique du PDF prof
    if TEACHER_EMAIL and SMTP_URL and SMTP_USER and SMTP_PASS:
        send_pdf(
            TEACHER_EMAIL,
            f"Nouveau QCM {qcm_id} par {author}",
            "Veuillez trouver le corrigé en pièce jointe.",
            teacher_pdf
        )

    # 6) Retourne simplement l’ID du QCM
    return jsonify(qcm_id=qcm_id), 200

@app.route("/get_qcm/<author>", methods=["GET"])
def get_qcms(author):
    author_dir = os.path.join(QCM_DIR, author)
    if not os.path.isdir(author_dir):
        return jsonify(qcms=[]), 200

    out = []
    for fname in sorted(os.listdir(author_dir), reverse=True):
        if not fname.endswith(".pdf") and fname.endswith(".json"):
            # si tu as dumpé un JSON, sinon adapte
            path = os.path.join(author_dir, fname)
            try:
                data = json.load(open(path, "r", encoding="utf-8"))
                out.append(data)
            except:
                continue
    return jsonify(qcms=out), 200

@app.route("/qcms/<path:filename>")
def serve_qcm_file(filename):
    return send_from_directory(QCM_DIR, filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
