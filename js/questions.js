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

/* ============================================================
   MODO "ARMAR CONTA" — algoritmo em colunas (unidades, dezenas...)
   ============================================================
   ✏️ Ajuste as faixas numéricas deste modo aqui. São separadas
   das faixas da múltipla escolha porque, pra fazer sentido
   "armar a conta" (com o vai-um / empresta-um), os números
   precisam ter mais de 1 dígito.
   ============================================================ */
const COLUMN_RANGES = {
  add: { min: 10, max: 89 },              // 2 números de 2 dígitos — a soma pode "estourar" pra 3 dígitos
  subMinuendMax: 99,
  mulMultiplicand: { min: 10, max: 89 },  // número de 2 dígitos
  mulMultiplier: { min: 2, max: 9 },      // número de 1 dígito
  divDivisor: { min: 2, max: 9 }          // divisor de 1 dígito
};

/**
 * Calcula os passos do algoritmo da divisão longa (chave de divisão),
 * "descendo" um dígito do dividendo por vez — igual ao jeito ensinado
 * na escola. Funciona pra qualquer dividendo/divisor de 1 dígito.
 * Retorna: quociente, resto final, e a lista de passos (um por dígito
 * "descido" a partir do primeiro dígito significativo do quociente).
 */
function longDivisionSteps(dividend, divisor) {
  const digits = String(dividend).split('').map(Number);
  const steps = [];
  const quotientDigits = [];
  let remainder = 0;
  let started = false;

  digits.forEach(d => {
    const current = remainder * 10 + d;      // "desce" o próximo dígito
    const digit = Math.floor(current / divisor);
    const product = digit * divisor;
    const newRemainder = current - product;

    if (digit > 0) started = true;

    if (started) {
      quotientDigits.push(digit);
      steps.push({ current, digit, product, remainder: newRemainder });
    }
    remainder = newRemainder;
  });

  return {
    quotient: quotientDigits.length ? parseInt(quotientDigits.join(''), 10) : 0,
    remainder,
    steps
  };
}

/**
 * Gera uma pergunta para o modo "Armar Conta".
 * Para add/sub/mul, retorna os dois operandos + quantidade de dígitos,
 * usados para desenhar as colunas. Para div, retorna um formato
 * diferente (chave de divisão): dividendo, divisor e quociente.
 */
function generateColumnQuestion(op) {
  switch (op) {
    case 'add': {
      const a = randInt(COLUMN_RANGES.add.min, COLUMN_RANGES.add.max);
      const b = randInt(COLUMN_RANGES.add.min, COLUMN_RANGES.add.max);
      const answer = a + b;
      const numDigits = Math.max(String(a).length, String(b).length);
      return { op, a, b, answer, symbol: '+', numDigits, resultLength: numDigits + 1, tableNumber: null };
    }
    case 'sub': {
      const a = randInt(20, COLUMN_RANGES.subMinuendMax);
      const b = randInt(10, a); // subtraendo nunca maior que o minuendo
      const answer = a - b;
      const numDigits = String(a).length;
      return { op, a, b, answer, symbol: '−', numDigits, resultLength: numDigits, tableNumber: null };
    }
    case 'mul': {
      const a = randInt(COLUMN_RANGES.mulMultiplicand.min, COLUMN_RANGES.mulMultiplicand.max);
      const b = randInt(COLUMN_RANGES.mulMultiplier.min, COLUMN_RANGES.mulMultiplier.max);
      const answer = a * b;
      const numDigits = Math.max(String(a).length, String(b).length);
      return { op, a, b, answer, symbol: '×', numDigits, resultLength: numDigits + 1, tableNumber: b };
    }
    case 'div': {
      // ✏️ Gera um dividendo de 3 dígitos e divisor de 1 dígito, resultando
      // sempre num quociente de 2 dígitos (ex.: 536 ÷ 8 = 67), pra treinar
      // a divisão longa com pelo menos 2 passos, igual no caderno da escola.
      const divisor = randInt(COLUMN_RANGES.divDivisor.min, COLUMN_RANGES.divDivisor.max);
      const minQuotient = Math.max(10, Math.ceil(100 / divisor));
      const maxQuotient = Math.min(99, Math.floor(999 / divisor));
      const quotient = randInt(minQuotient, maxQuotient);
      const dividend = divisor * quotient;
      const { steps, remainder } = longDivisionSteps(dividend, divisor);
      return {
        op, isDivision: true, dividend, divisor, quotient, remainder, steps, tableNumber: divisor
      };
    }
    default:
      throw new Error('Operação desconhecida (armar conta): ' + op);
  }
}
