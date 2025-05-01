const fs = require('fs');
const nodemailer = require('nodemailer');

// Exemple de code à analyser (à remplacer par du code dynamique ou récupéré d'un fichier)
const code = `
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}
`;

// Fonction qui analyse le code pour en extraire des questions de vérification des connaissances
const analyseCode = (code) => {
  // Ici, tu peux analyser le code pour générer des questions adaptées
  return [
    {
      question: "Quel est le rôle de la fonction 'add' dans ce code ?",
      choix: ["Additionner des nombres", "Afficher un message", "Retourner une valeur"],
      reponse: "Additionner des nombres"
    },
    {
      question: "Que fait la fonction 'multiply' dans ce code ?",
      choix: ["Multiplie deux nombres", "Retourne la somme de deux nombres", "Affiche un message"],
      reponse: "Multiplie deux nombres"
    }
  ];
};

// Fonction pour envoyer un email avec les questions de vérification
const envoyerEmail = (questions, destinataire) => {
  // Créer un transporteur Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'msarr0938@gmail.com', // Ton email
      pass: 'vjvo ttuu idpy sdxh\n'   // Ton mot de passe (ou utilise un mot de passe d'application)
    }
  });

  // Construire le contenu de l'email
  const contenuEmail = questions.map(q => {
    return `${q.question}\nRéponses possibles : ${q.choix.join(', ')}\nRéponse correcte : ${q.reponse}\n`;
  }).join('\n\n');

  // Paramètres de l'email
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: destinataire,  // Email du destinataire (ex. étudiant ou professeur)
    subject: 'Vérification des connaissances - Questions',
    text: contenuEmail
  };

  // Envoi de l'email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erreur lors de l\'envoi de l\'email:', error);
    } else {
      console.log('Email envoyé:', info.response);
    }
  });
};

// Analyse du code et génération des questions
const questions = analyseCode(code);

// Affichage des questions dans la console
console.log("Questions générées :");
questions.forEach((q) => {
  console.log(q.question);
  console.log("Réponses possibles : " + q.choix.join(', '));
  console.log("Réponse correcte : " + q.reponse);
});

// Envoi d'un email avec les questions (à remplacer par l'email réel de l'étudiant)
const emailDestinataire = 'student-email@example.com';  // Remplacer par l'email réel
envoyerEmail(questions, emailDestinataire);
