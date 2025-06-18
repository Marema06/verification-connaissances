import os
import uuid
import json
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import requests

app = Flask(__name__)
CORS(app)

QCM_DIR = "qcms"
os.makedirs(QCM_DIR, exist_ok=True)

TEACHER_EMAIL = os.getenv("PROF_EMAIL")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USERNAME")
SMTP_PASS = os.getenv("SMTP_PASSWORD")

def send_pdf(to_addr, subject, body, pdf_path):
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.set_content(body)
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    msg.add_attachment(pdf_data, maintype="application", subtype="pdf", filename=os.path.basename(pdf_path))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

def call_ollama_for_qcm(code_block):
    payload = {
        "model": "mistral",  # change selon ton modèle Ollama local
        "messages": [
            {
                "role": "system",
                "content": (
                    "Tu es un assistant qui génère des QCM à partir d'un code Python. "
                    "Retourne uniquement un JSON avec une liste de questions, choix (4 par question), "
                    "et la bonne réponse (une seule) pour chaque question."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Voici un code Python :\n{code_block}\n"
                    "Génère 3 questions QCM avec 4 choix chacune et indique la bonne réponse."
                )
            }
        ]
    }
    response = requests.post("http://localhost:11434/api/chat", json=payload)
    response.raise_for_status()
    return response.json()["message"]["content"]

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code = data.get("code_block", "")
    author = data.get("author", "anonymous")

    try:
        raw_qcm = call_ollama_for_qcm(code)
        # raw_qcm est un JSON sous forme de string, on le parse
        qcm_list = json.loads(raw_qcm)
    except Exception as e:
        return jsonify(error="Erreur lors de la génération du QCM", details=str(e)), 500

    qcm_id = str(uuid.uuid4())
    author_dir = os.path.join(QCM_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    # PDF étudiant (questions + choix)
    student_pdf = os.path.join(author_dir, f"student_{qcm_id}.pdf")
    doc1 = SimpleDocTemplate(student_pdf)
    styles = getSampleStyleSheet()
    elems = []
    for i, q in enumerate(qcm_list, 1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            elems.append(Paragraph(f"• {c}", styles["Normal"]))
        elems.append(Spacer(1, 12))
    doc1.build(elems)

    # PDF prof (avec bonnes réponses)
    teacher_pdf = os.path.join(author_dir, f"teacher_{qcm_id}.pdf")
    doc2 = SimpleDocTemplate(teacher_pdf)
    elems = [Paragraph("QCM Prof – corrigé", styles["Title"]), Spacer(1, 12)]
    for i, q in enumerate(qcm_list, 1):
        elems.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for c in q["choices"]:
            marker = "✔" if c == q["answer"] else "  "
            elems.append(Paragraph(f"{marker} {c}", styles["Normal"]))
        elems.append(Spacer(1, 12))
    doc2.build(elems)

    # Envoie automatique du PDF prof
    try:
        send_pdf(
            TEACHER_EMAIL,
            f"Nouveau QCM {qcm_id} par {author}",
            f"Vous pouvez télécharger le corrigé en pièce jointe.",
            teacher_pdf
        )
    except Exception as e:
        # Log erreur ou ignorer si pas critique
        print(f"Erreur envoi mail: {e}")

    # Sauvegarde du QCM au format JSON
    qcm_json_path = os.path.join(author_dir, f"{qcm_id}.json")
    with open(qcm_json_path, "w", encoding="utf-8") as f:
        json.dump(qcm_list, f, ensure_ascii=False, indent=2)

    return jsonify(qcm_id=qcm_id), 200

if __name__ == "__main__":
    app.run(debug=True)
