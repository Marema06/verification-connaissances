// src/generateHoles.js

/**
 * Prend un bloc de code et remplace aléatoirement `numHoles` tokens
 * (variables, fonctions, constantes) par des blancs "____".
 * Retourne l’objet { maskedCode, holes }.
 */
function generateCodeWithHoles(code, numHoles = 3) {
  // Récupère tous les mots valides
  const tokens = Array.from(new Set(code.match(/\b[A-Za-z_]\w*\b/g)));
  // Ignorer les mots-clés JavaScript courants
  const keywords = ['function','return','const','let','var','if','else','for','while','console','log'];
  const candidates = tokens.filter(t => !keywords.includes(t));

  // Choix aléatoire de tokens à masquer
  const holes = [];
  while (holes.length < numHoles && candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    holes.push(candidates.splice(idx, 1)[0]);
  }

  // Remplace chaque token sélectionné par "____"
  let masked = code;
  holes.forEach(token => {
    const re = new RegExp(`\\b${token}\\b`, 'g');
    masked = masked.replace(re, '____');
  });

  return { maskedCode: masked, holes };
}

module.exports = { generateCodeWithHoles };
