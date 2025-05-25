# backend/app.py
import os
import uuid
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# 1. charger .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 2. créer l’app et configurer CORS
app = Flask(__name__)
CORS(
    app,
    resources={r"/generate_qcm": {"origins": ["http://localhost:4200", "*"]}},
    supports_credentials=True,
    methods=["POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"]
)

# 3. imports business
from .utils.llm_local import ask_ollama
from .pdf_generator import generate_qcm_pdf
from .html_renderer import render_qcm_html
from .email_service import send_qcm_student, send_qcm_prof

# 4. dossier de sortie
STATIC_PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'qcm_pdfs')
os.makedirs(STATIC_PDF_DIR, exist_ok=True)

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    try:
        # authentification
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {os.getenv('API_SECRET_TOKEN')}":
            return jsonify({"error": "Unauthorized"}), 401

        # payload
        data = request.get_json() or {}
        code_block = data.get("code_block", "")
        if not code_block.strip():
            return jsonify({"error": "Le champ code_block est vide"}), 400

        # génération QCM
        prompt = f"Propose un QCM en 3 questions pour vérifier la compréhension de ce code:\n{code_block}"
        qcm    = ask_ollama(prompt)
        if qcm.startswith("Erreur Ollama"):
            return jsonify({"error": qcm}), 500

        # HTML + PDF
        html_content = render_qcm_html(qcm)
        pdf_name     = f"qcm_{uuid.uuid4().hex}.pdf"
        pdf_path     = os.path.join(STATIC_PDF_DIR, pdf_name)
        generate_qcm_pdf(qcm, pdf_path)

        # emails
        send_qcm_student(to_email=os.getenv("STUDENT_EMAIL"), html_content=html_content)
        send_qcm_prof   (to_email=os.getenv("PROF_EMAIL"),    pdf_path=pdf_path)

        return jsonify({"qcm_html": html_content, "pdf_filename": pdf_name})

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
