# Vérification de Connaissances par QCM

Ce projet fournit une solution full-stack permettant une évaluation automatique des connaissances via des QCM générés à partir de code source poussé sur GitHub :

## Fonctionnalités

- **Backend Flask** :
  - Génération automatique de QCM depuis du code via LLM (ex. : Ollama).
  - Stockage local des QCM et des réponses dans des fichiers `.json`.
  - Génération de PDF et envoi d'emails HTML.
- **Frontend Angular** :
  - Interface standalone pour créer, charger et répondre aux QCM.
  - Dashboard des réponses avec filtres par auteur.
- **CI / GitHub Actions** :
  - Exécution automatique des tests backend et frontend via ngrok.

---

## Structure du projet