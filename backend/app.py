import os
import uuid
import json
import smtplib
import requests
from datetime import datetime
from email.message import EmailMessage
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
CORS(app)

# Configuration
QCM_DIR = "qcms"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
SMTP_CONFIG = {
    "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
    "port": int(os.getenv("SMTP_PORT", 587)),
    "user": os.getenv("SMTP_USER", "your-email@gmail.com"),
    "password": os.getenv("SMTP_PASS", "your-password")
}

os.makedirs(QCM_DIR, exist_ok=True)

# Helpers
def generate_with_ollama(code: str):
    prompt = f"""
    [INSTRUCTIONS]
    Génère un QCM de 3 questions sur ce code Python avec:
    - 1 bonne réponse
    - 2 distracteurs plausibles
    - Format JSON strict

    [FORMAT]
    [
      {{
        "question": "...",
        "choices": ["A. ...", "B. ...", "C. ..."],
        "answer": "A|B|C",
        "explanation": "..."
      }}
    ]

    [CODE]
    {code}
    """

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "format": "json",
                "options": {
                    "temperature": 0.7,
                    "num_ctx": 2048
                }
            },
            timeout=120
        )
        return json.loads(response.json()["response"])
    except Exception as e:
        app.logger.error(f"Ollama error: {str(e)}")
        return None

def send_email(to: str, subject: str, body: str, attachment_path: str = None):
    msg = EmailMessage()
    msg["From"] = SMTP_CONFIG["user"]
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    if attachment_path:
        with open(attachment_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="pdf",
                filename=os.path.basename(attachment_path)
            )

    with smtplib.SMTP(SMTP_CONFIG["host"], SMTP_CONFIG["port"]) as smtp:
        smtp.starttls()
        smtp.login(SMTP_CONFIG["user"], SMTP_CONFIG["password"])
        smtp.send_message(msg)

def generate_pdf(qcm_data: list, output_path: str, show_answers: bool = False):
    doc = SimpleDocTemplate(output_path)
    styles = getSampleStyleSheet()
    elements = []

    title = "Corrigé du QCM" if show_answers else "QCM Étudiant"
    elements.append(Paragraph(title, styles["Title"]))
    elements.append(Spacer(1, 12))

    for i, q in enumerate(qcm_data, 1):
        elements.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for j, choice in enumerate(q["choices"]):
            if show_answers:
                prefix = "✓ " if j == ord(q["answer"]) - ord('A') else "  "
                elements.append(Paragraph(f"{prefix}{choice}", styles["Normal"]))
            else:
                elements.append(Paragraph(f"○ {choice}", styles["Normal"]))
        if show_answers and "explanation" in q:
            elements.append(Paragraph(f"Explication: {q['explanation']}", styles["Italic"]))
        elements.append(Spacer(1, 12))

    doc.build(elements)

# Routes
@app.route("/healthz", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "services": {
            "ollama": OLLAMA_URL,
            "model": OLLAMA_MODEL
        }
    })

@app.route("/generate_qcm", methods=["POST"])
def api_generate_qcm():
    data = request.get_json()
    code = data.get("code_block", "").strip()
    author = data.get("author", "anonymous")

    if not code:
        return jsonify({"error": "Code block is required"}), 400

    qcm_data = generate_with_ollama(code)
    if not qcm_data:
        return jsonify({"error": "Failed to generate QCM"}), 500

    qcm_id = str(uuid.uuid4())
    author_dir = os.path.join(QCM_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    # Generate PDFs
    student_pdf = os.path.join(author_dir, f"student_{qcm_id}.pdf")
    teacher_pdf = os.path.join(author_dir, f"teacher_{qcm_id}.pdf")

    generate_pdf(qcm_data, student_pdf)
    generate_pdf(qcm_data, teacher_pdf, show_answers=True)

    # Save QCM data
    with open(os.path.join(author_dir, f"{qcm_id}.json"), "w") as f:
        json.dump(qcm_data, f)

    # Email teacher
    if SMTP_CONFIG["user"] and SMTP_CONFIG["password"]:
        send_email(
            SMTP_CONFIG["user"],  # Envoyer au prof par défaut
            f"Nouveau QCM généré - {qcm_id}",
            f"Un QCM a été généré par {author}.\n\nCode source:\n{code}",
            teacher_pdf
        )

    return jsonify({
        "qcm_id": qcm_id,
        "questions": qcm_data,
        "pdf_url": f"/qcms/{author}/student_{qcm_id}.pdf"
    })

@app.route("/submit_answers", methods=["POST"])
def api_submit_answers():
    data = request.get_json()
    qcm_id = data.get("qcm_id")
    student_name = data.get("student_name")
    answers = data.get("answers")

    if not all([qcm_id, student_name, answers]):
        return jsonify({"error": "Missing required fields"}), 400

    submission = {
        "qcm_id": qcm_id,
        "student_name": student_name,
        "answers": answers,
        "timestamp": datetime.now().isoformat(),
        "score": None  # Could be calculated later
    }

    submissions_dir = os.path.join(QCM_DIR, "submissions")
    os.makedirs(submissions_dir, exist_ok=True)

    filename = f"{qcm_id}_{student_name}.json".replace(" ", "_")
    with open(os.path.join(submissions_dir, filename), "w") as f:
        json.dump(submission, f)

    return jsonify({"status": "success"})

@app.route("/qcms/<path:filename>")
def serve_qcm_file(filename):
    return send_from_directory(QCM_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
