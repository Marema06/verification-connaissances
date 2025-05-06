function generateCodeWithHoles(code, numHoles = 3) {
  const tokens = Array.from(new Set(code.match(/\b[A-Za-z_]\w*\b/g)));
  const keywords = ['function','return','const','let','var','if','else','for','while','console','log'];
  const candidates = tokens.filter(t => !keywords.includes(t));

  const holes = [];
  while (holes.length < numHoles && candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    holes.push(candidates.splice(idx, 1)[0]);
  }

  let masked = code;
  holes.forEach(token => {
    const re = new RegExp(`\\b${token}\\b`, 'g');
    masked = masked.replace(re, '____');
  });

  return { maskedCode: masked, holes };
}

module.exports = { generateCodeWithHoles };
