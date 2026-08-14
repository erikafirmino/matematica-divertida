/* ============================================================
   questions.js — Geração das perguntas
   ============================================================
   ✏️ PARA MUDAR A DIFICULDADE: altere os números em RANGES.
   ✏️ PARA CRIAR UMA OPERAÇÃO NOVA: duplique um dos blocos "case"
      dentro de generateQuestion() e ligue no app.js/index.html.
   ============================================================ */

// ✏️ Faixas numéricas usadas em cada operação — mexa aqui para
// deixar o jogo mais fácil (números menores) ou mais difícil (maiores).
const RANGES = {
  add: { min: 1, max: 20 },
  sub: { min: 1, max: 20 },
  mul: { min: 1, max: 10 }, // tabuada do 1 ao 10
  div: { min: 1, max: 10 }  // tabuada do 1 ao 10 (na divisão)
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Gera 3 respostas erradas "plausíveis" perto da resposta certa,
// para não ficarem óbvias demais nem impossíveis de diferenciar.
function makeOptions(correctAnswer, spread = 5) {
  const options = new Set([correctAnswer]);
  let attempts = 0;
  while (options.size < 4 && attempts < 60) {
    attempts++;
    const delta = randInt(-spread, spread) || 1;
    let candidate = correctAnswer + delta;
    if (candidate < 0) candidate = correctAnswer + Math.abs(delta) + 1;
    if (candidate !== correctAnswer) options.add(candidate);
  }
  return shuffle([...options]);
}

/**
 * Gera uma pergunta para a operação escolhida.
 * @param {'add'|'sub'|'mul'|'div'} op
 * @param {number|null} tableNumber - usado em mul/div para treinar uma tabuada específica (1-10). Se null, sorteia.
 */
function generateQuestion(op, tableNumber = null) {
  switch (op) {
    // ✏️ ADIÇÃO
    case 'add': {
      const a = randInt(RANGES.add.min, RANGES.add.max);
      const b = randInt(RANGES.add.min, RANGES.add.max);
      const answer = a + b;
      return { text: `${a} + ${b}`, answer, options: makeOptions(answer, 6), op, tableNumber: null };
    }

    // ✏️ SUBTRAÇÃO (sempre resultado positivo, mais amigável para crianças)
    case 'sub': {
      let a = randInt(RANGES.sub.min, RANGES.sub.max);
      let b = randInt(RANGES.sub.min, RANGES.sub.max);
      if (b > a) [a, b] = [b, a];
      const answer = a - b;
      return { text: `${a} - ${b}`, answer, options: makeOptions(answer, 6), op, tableNumber: null };
    }

    // ✏️ MULTIPLICAÇÃO / TABUADA
    case 'mul': {
      const table = tableNumber || randInt(RANGES.mul.min, RANGES.mul.max);
      const b = randInt(1, 10);
      const answer = table * b;
      return { text: `${table} × ${b}`, answer, options: makeOptions(answer, Math.max(6, table)), op, tableNumber: table };
    }

    // ✏️ DIVISÃO (sempre exata, sem deixar resto — mais fácil para crianças pequenas)
    case 'div': {
      const table = tableNumber || randInt(RANGES.div.min, RANGES.div.max);
      const b = randInt(1, 10);
      const dividend = table * b;
      return { text: `${dividend} ÷ ${table}`, answer: b, options: makeOptions(b, 4), op, tableNumber: table };
    }

    default:
      throw new Error('Operação desconhecida: ' + op);
  }
}
