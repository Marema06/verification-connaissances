from flask import Flask, request, jsonify, send_file
from utils.llm_local import ask_ollama
from pdf_generator import generate_qcm_pdf
from html_renderer import render_qcm_html
import uuid
import os

app = Flask(__name__)

STATIC_PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'qcm_pdfs')

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    data = request.json or {}
    code_block = data.get("code", "")
    if not code_block.strip():
        return jsonify({"error": "Le champ 'code' est vide."}), 400

    prompt = f"Propose un QCM en 3 questions pour vérifier la compréhension de ce code:\n{code_block}"
    qcm = ask_ollama(prompt)
    if qcm.startswith("Erreur Ollama"):
        return jsonify({"error": qcm}), 500

    # Génération HTML et PDF
    html = render_qcm_html(qcm)
    pdf_filename = f"qcm_{uuid.uuid4().hex}.pdf"
    pdf_path = os.path.join(STATIC_PDF_DIR, pdf_filename)
    generate_qcm_pdf(qcm, pdf_path)

    return jsonify({
        "qcm_html": html,
        "pdf_filename": pdf_filename
    })
