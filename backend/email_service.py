# backend/email_service.py
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Fonction pour envoyer le QCM à l'étudiant·e (HTML dans le corps du mail)
def send_qcm_student(to_email, html_content):
    msg = EmailMessage()
    msg["Subject"] = "Ton QCM personnalisé"
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = to_email
    msg.set_content("Voici ton QCM. La version HTML est disponible ci-dessous.")
    msg.add_alternative(html_content, subtype='html')

    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
        server.send_message(msg)
        print("✅ Email HTML envoyé à :", to_email)

# Fonction pour envoyer le QCM à l'enseignant·e (pièce jointe PDF)
def send_qcm_prof(to_email, pdf_path):
    msg = EmailMessage()
    msg["Subject"] = "QCM généré (PDF)"
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = to_email
    msg.set_content("Veuillez trouver ci-joint le QCM au format PDF.")

    with open(pdf_path, "rb") as f:
        file_data = f.read()
        file_name = os.path.basename(pdf_path)
        msg.add_attachment(file_data, maintype="application", subtype="pdf", filename=file_name)

    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
        server.send_message(msg)
        print("✅ Email avec PDF envoyé à :", to_email)
