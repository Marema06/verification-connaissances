# backend/pdf_generator.py
from weasyprint import HTML
from .html_renderer import render_qcm_html

def generate_qcm_pdf(qcm_text: str, output_path: str) -> None:
    """
    Génère un PDF à partir du QCM via WeasyPrint.
    """
    html = render_qcm_html(qcm_text)
    # WeasyPrint écrit directement le PDF
    HTML(string=html).write_pdf(output_path)
