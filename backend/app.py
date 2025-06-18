import os
import uuid
import json
import smtplib
import requests
from email.message import EmailMessage
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
CORS(app)

# --- Config ---
QCM_DIR = "qcms"
TEACHER_EMAIL = os.getenv("TEACHER_EMAIL", "")
SMTP_URL = os.getenv("SMTP_URL", "")
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

os.makedirs(QCM_DIR, exist_ok=True)

# --- Helpers ---
def send_pdf(to_addr, subject, body, pdf_path):
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to_addr
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

# Modifiez la fonction generate_with_ollama
def generate_with_ollama(code: str):
    prompt = f"""
    [CONTEXT]
    You're a programming teacher creating a MCQ about this code.
    Generate 3 questions maximum.
    Focus on key concepts, make wrong answers plausible.

    [RULES]
    - Return ONLY valid JSON
    - Each question must have:
      "question": "text",
      "choices": ["A. ...", "B. ...", "C. ..."],
      "answer": "A|B|C"
    - Use simple language

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
                    "temperature": 0.3,  # Plus précis en mode CPU
                    "num_ctx": 1024      # Contexte réduit
                }
            },
            timeout=120  # Plus long en CPU
        )
        return json.loads(response.json()["response"])
    except Exception as e:
        print(f"Ollama error: {str(e)}")
        return None
def stub_generate_qcm(code: str):
    """Fallback stub generator"""
    return [
        {
            "question": "What does this code do?",
            "choices": [
                "A. Calculates factorial",
                "B. Prints hello world",
                "C. Sorts a list"
            ],
            "answer": "A"
        }
    ]

# --- Routes ---
@app.route("/healthz", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.get_json()
    code = data.get("code_block", "").strip()
    author = data.get("author", "anonymous")

    if not code:
        return jsonify(error="Code block is required"), 400

    # Try LLM first, fallback to stub
    qcm_list = generate_with_ollama(code) or stub_generate_qcm(code)

    # Generate PDFs
    qcm_id = str(uuid.uuid4())
    author_dir = os.path.join(QCM_DIR, author)
    os.makedirs(author_dir, exist_ok=True)

    # Student PDF (questions only)
    student_pdf = os.path.join(author_dir, f"student_{qcm_id}.pdf")
    doc = SimpleDocTemplate(student_pdf)
    styles = getSampleStyleSheet()
    elements = []

    for i, q in enumerate(qcm_list, 1):
        elements.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for choice in q["choices"]:
            elements.append(Paragraph(f"• {choice}", styles["Normal"]))
        elements.append(Spacer(1, 12))
    doc.build(elements)

    # Teacher PDF (with answers)
    teacher_pdf = os.path.join(author_dir, f"teacher_{qcm_id}.pdf")
    doc = SimpleDocTemplate(teacher_pdf)
    elements = [Paragraph("Answer Key", styles["Title"]), Spacer(1, 12)]

    for i, q in enumerate(qcm_list, 1):
        elements.append(Paragraph(f"{i}. {q['question']}", styles["Normal"]))
        for choice in q["choices"]:
            mark = "✓" if choice.startswith(q["answer"]) else " "
            elements.append(Paragraph(f"{mark} {choice}", styles["Normal"]))
        elements.append(Spacer(1, 12))
    doc.build(elements)

    # Email to teacher
    if all([TEACHER_EMAIL, SMTP_URL, SMTP_USER, SMTP_PASS]):
        send_pdf(
            TEACHER_EMAIL,
            f"New QCM from {author}",
            f"QCM ID: {qcm_id}",
            teacher_pdf
        )

    return jsonify(qcm_id=qcm_id), 200

@app.route("/qcms/<path:filename>")
def serve_qcm(filename):
    return send_from_directory(QCM_DIR, filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
