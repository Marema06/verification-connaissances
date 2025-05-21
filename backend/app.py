# backend/app.py
import os
import uuid
from dotenv import load_dotenv
from flask import Flask, request, jsonify

# Charger les variables d'environnement depuis .env à la racine
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

from .utils.llm_local import ask_ollama
from .pdf_generator import generate_qcm_pdf
from .html_renderer import render_qcm_html
from .email_service import send_qcm_student, send_qcm_prof

app = Flask(__name__)

# Répertoire pour stocker les PDF générés
STATIC_PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'qcm_pdfs')
os.makedirs(STATIC_PDF_DIR, exist_ok=True)

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    try:
        auth_token = request.headers.get("Authorization", "")
        expected_token = os.getenv("API_SECRET_TOKEN")

        if auth_token != f"Bearer {expected_token}":
            return jsonify({"error": "Unauthorized"}), 401

        # 🔧 Récupérer le code envoyé dans la requête
        data = request.get_json()
        code_block = data.get("code_block", "")

        prompt = f"Propose un QCM en 3 questions pour vérifier la compréhension de ce code:\n{code_block}"
        qcm = ask_ollama(prompt)
        if qcm.startswith("Erreur Ollama"):
            return jsonify({"error": qcm}), 500

        html_content = render_qcm_html(qcm)
        pdf_filename = f"qcm_{uuid.uuid4().hex}.pdf"
        pdf_path = os.path.join(STATIC_PDF_DIR, pdf_filename)
        generate_qcm_pdf(qcm, pdf_path)

        student_email = os.getenv("STUDENT_EMAIL")
        prof_email = os.getenv("PROF_EMAIL")

        send_qcm_student(to_email=student_email, html_content=html_content)
        send_qcm_prof(to_email=prof_email, pdf_path=pdf_path)

        return jsonify({
            "qcm_html": html_content,
            "pdf_filename": pdf_filename
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
