# backend/app.py
import os, uuid, json, smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
CORS(app)

QCM_DIR = "qcms"
os.makedirs(QCM_DIR, exist_ok=True)
TEACHER_EMAIL = os.getenv("TEACHER_EMAIL")  # configuré dans ton .env
SMTP_URL      = os.getenv("SMTP_URL")
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASS     = os.getenv("SMTP_PASS")

def send_pdf(to_addr, subject, body, pdf_path):
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"]   = to_addr
    msg["Subject"] = subject
    msg.set_content(body)
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    msg.add_attachment(pdf_data, maintype="application", subtype="pdf",
                       filename=os.path.basename(pdf_path))
    with smtplib.SMTP_SSL(SMTP_URL) as smtp:
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data   = request.get_json()
    code   = data.get("code_block","")
    author = data.get("author","anonymous")
    # … appelle Groq / Ollama, parse ton JSON list → qcm_list …

    qcm_id = str(uuid.uuid4())
    author_dir = os.path.join(QCM_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    # 1) PDF étudiant (juste questions + choix)
    student_pdf = os.path.join(author_dir, f"student_{qcm_id}.pdf")
    doc1 = SimpleDocTemplate(student_pdf)
    styles = getSampleStyleSheet()
    elems = []
    for i,q in enumerate(qcm_list,1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            elems.append(Paragraph(f"• {c}", styles["Normal"]))
        elems.append(Spacer(1,12))
    doc1.build(elems)

    # 2) PDF prof (avec bonnes réponses)
    teacher_pdf = os.path.join(author_dir, f"teacher_{qcm_id}.pdf")
    doc2 = SimpleDocTemplate(teacher_pdf)
    elems = [Paragraph("QCM Prof – corrigé", styles["Title"]), Spacer(1,12)]
    for i,q in enumerate(qcm_list,1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            marker = "✔" if c.startswith(q["answer"]) else "  "
            elems.append(Paragraph(f"{marker} {c}", styles["Normal"]))
        elems.append(Spacer(1,12))
    doc2.build(elems)

    # Envoie automatique du PDF prof
    send_pdf(
        TEACHER_EMAIL,
        f"Nouveau QCM {qcm_id} par {author}",
        f"Vous pouvez télécharger le corrigé en pièce jointe.",
        teacher_pdf
    )

    return jsonify(qcm_id=qcm_id), 200
