from flask import Flask, request, jsonify
from .utils.llm_local import ask_ollama
from .pdf_generator import generate_qcm_pdf
from .html_renderer import render_qcm_html
from .email_service import send_qcm_student, send_qcm_prof
import uuid
import os

app = Flask(__name__)

STATIC_PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'qcm_pdfs')

@app.route("/generate_qcm", methods=["POST"])
def generate_qcm():
    try:
        print("Requête reçue sur /generate_qcm")
        data = request.json or {}
        code_block = data.get("code", "")
        print(f"Code reçu : {code_block}")

        if not code_block.strip():
            return jsonify({"error": "Le champ 'code' est vide."}), 400

        prompt = f"Propose un QCM en 3 questions pour vérifier la compréhension de ce code:\n{code_block}"
        qcm = ask_ollama(prompt)
        print(f"QCM généré : {qcm}")

        if qcm.startswith("Erreur Ollama"):
            return jsonify({"error": qcm}), 500

        # Génération HTML et PDF
        html_content = render_qcm_html(qcm)
        pdf_filename = f"qcm_{uuid.uuid4().hex}.pdf"
        pdf_path = os.path.join(STATIC_PDF_DIR, pdf_filename)
        generate_qcm_pdf(qcm, pdf_path)

        # Envoi des emails
        try:
            send_qcm_student(to_email=os.getenv("STUDENT_EMAIL"), html_content=html_content)
            print("Email envoyé à l'étudiant·e")
        except Exception as e:
            print(f"Erreur envoi email étudiant·e : {e}")

        try:
            send_qcm_prof(to_email=os.getenv("PROF_EMAIL"), pdf_path=pdf_path)
            print("Email envoyé au·à la prof·esse")
        except Exception as e:
            print(f"Erreur envoi email prof·esse : {e}")

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
