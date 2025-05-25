import os
import uuid
import datetime
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# 1. Charger .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 2. Créer l’app et configurer CORS
app = Flask(__name__)
CORS(
    app,
    resources={r"/generate_qcm": {"origins": ["http://localhost:4200", "*"]}},
    supports_credentials=True,
    methods=["POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-GitHub-Author"]
)

# 3. Imports internes
from .utils.llm_local import ask_ollama
from .pdf_generator import generate_qcm_pdf
from .html_renderer import render_qcm_html
from .email_service import send_qcm_student, send_qcm_prof

# 4. Dossiers
STATIC_PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'qcm_pdfs')
QCM_DB_FILE    = os.path.join(os.path.dirname(__file__), '..', 'db', 'qcm_history.json')

os.makedirs(STATIC_PDF_DIR, exist_ok=True)
os.makedirs(os.path.dirname(QCM_DB_FILE), exist_ok=True)

# 5. Fonction pour sauvegarder les QCM
def save_qcm_record(author, code, qcm_data):
    record = {
        "author": author,
        "code": code,
        "qcm": qcm_data,
        "date": datetime.datetime.now().isoformat()
    }
    try:
        with open(QCM_DB_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        print("Erreur sauvegarde JSON:", e)

# 6. Route API
@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    try:
        # Authentification
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {os.getenv('API_SECRET_TOKEN')}":
            return jsonify({"error": "Unauthorized"}), 401

        # Payload
        data = request.get_json() or {}
        code_block = data.get("code_block", "")
        if not code_block.strip():
            return jsonify({"error": "Le champ code_block est vide"}), 400

        # Génération QCM
        prompt = f"Propose un QCM en 3 questions pour vérifier la compréhension de ce code:\n{code_block}"
        qcm    = ask_ollama(prompt)
        if qcm.startswith("Erreur Ollama"):
            return jsonify({"error": qcm}), 500

        # HTML + PDF
        html_content = render_qcm_html(qcm)
        pdf_name     = f"qcm_{uuid.uuid4().hex}.pdf"
        pdf_path     = os.path.join(STATIC_PDF_DIR, pdf_name)
        generate_qcm_pdf(qcm, pdf_path)

        # Emails
        send_qcm_student(to_email=os.getenv("STUDENT_EMAIL"), html_content=html_content)
        send_qcm_prof   (to_email=os.getenv("PROF_EMAIL"),    pdf_path=pdf_path)

        # Sauvegarde historique
        author = request.headers.get("X-GitHub-Author", "anonyme")
        save_qcm_record(author, code_block, qcm)

        return jsonify({"qcm_html": html_content, "pdf_filename": pdf_name})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# 7. Main local
if __name__ == "__main__":
    app.run(debug=True, port=5000)
