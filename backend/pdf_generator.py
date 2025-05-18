import pdfkit
import os
from .html_renderer import render_qcm_html

def generate_qcm_pdf(qcm_text: str, output_path: str) -> None:
    """
    Génère un PDF à partir du QCM.
    - qcm_text : QCM brut
    - output_path : chemin complet du fichier de sortie (ex : ../static/qcm_pdfs/qcm_123.pdf)
    """
    # Rendu HTML pour le professeur (on peut réutiliser le même ou un autre template)
    html = render_qcm_html(qcm_text)

    # Options pdfkit (pdfkit doit trouver wkhtmltopdf installé)
    options = {
        'enable-local-file-access': None,
        'page-size': 'A4',
        'encoding': 'UTF-8',
    }

    # Génération du PDF
    pdfkit.from_string(html, output_path, options=options)
