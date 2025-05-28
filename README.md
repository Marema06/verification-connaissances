#  Vérification de Connaissances par QCM

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

##  Structure du projet

```
├── backend/
│   ├── app.py               # API Flask
│   ├── utils/               # Fonctions auxiliaires (LLM, PDF, email)
│   ├── static/qcm_pdfs/     # PDFs générés
│   └── db/
│       ├── qcm_history.json # Historique des QCM
│       └── answers.json     # Réponses des étudiants
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── qcm/             # Composant QcmComponent
│   │   ├── dashboard/       # Composant DashboardComponent
│   │   ├── services/
│   │   │   └── qcm-api.service.ts
│   │   └── app.routes.ts
│   ├── environments/
│   └── package.json
├── .github/workflows/
│   └── qcm_check.yml        # GitHub Actions
└── README.md                # Ce fichier
```

---

##  Installation

###  Backend Flask

1. Crée un environnement virtuel :
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   .\.venv\Scripts\activate   # Windows
   ```

2. Installe les dépendances :
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Crée un fichier `.env` à la racine :
   ```dotenv
   API_SECRET_TOKEN=votre_token
   STUDENT_EMAIL=etudiant@exemple.com
   PROF_EMAIL=prof@exemple.com
   ```

4. Lance l’API :
   ```bash
   python -m backend.app
   ```

 Accessible via : `http://localhost:5000`

---

###  Frontend Angular

1. Installe les dépendances :
   ```bash
   cd frontend
   npm install
   ```

2. Configure l'environnement :
   Dans `frontend/src/environments/environment.ts` :
   ```ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:5000',
     apiToken: 'votre_token'
   };
   ```

3. Démarre l'application :
   ```bash
   ng serve
   ```

Accessible via : `http://localhost:4200`

---

##  API – Endpoints

| Endpoint                  | Méthode | Description                                           |
|---------------------------|---------|-------------------------------------------------------|
| `/generate_qcm`           | POST    | Génère un QCM à partir de code `{ code_block }`       |
| `/get_qcm/<author>`       | GET     | Récupère le dernier QCM généré pour un auteur         |
| `/submit_answers`         | POST    | Enregistre les réponses `{ author, qcm_id, answers }` |
| `/results`                | GET     | Retourne toutes les réponses                         |

---

##  GitHub Actions CI

Le fichier `.github/workflows/qcm_check.yml` :

1. Installe et démarre le backend Flask.
2. Expose l'API via [ngrok](https://ngrok.com/).
3. Lance un test d'appel à `/generate_qcm`.
4. Installe et build le frontend Angular.
5. Vérifie que le frontend démarre sans erreur.

---


