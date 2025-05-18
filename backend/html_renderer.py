from jinja2 import Environment, FileSystemLoader
import os

# Configure Jinja2 pour charger les templates depuis le dossier ../templates
env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), '..', 'templates')),
    autoescape=True
)

def render_qcm_html(qcm_text: str) -> str:
    """
    qcm_text : chaîne brute renvoyée par Ollama, contenant questions et réponses attendues.
    On va parser sommairement et passer directement au template.
    """
    template = env.get_template('qcm_etudiant.html')
    # On peut passer qcm_text brut, ou mieux, le transformer en structure.
    return template.render(qcm=qcm_text)
