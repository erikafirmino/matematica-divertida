/* ============================================================
   game.js — Mecânica do jogo (uma "rodada" de perguntas)
   ============================================================
   Suporta dois modos, escolhidos pela criança na tela de
   seleção de modo:
   - 'choice'  → múltipla escolha (4 botões)
   - 'column'  → "armar conta" (algoritmo em colunas, com o
                  vai-um / empresta-um, e chave de divisão)

   ✏️ QUESTIONS_PER_ROUND controla quantas perguntas tem cada
      rodada antes de mostrar a tela de resultado.
   ✏️ As frases do mascote (MASCOT_LINES) podem ser editadas
      livremente — é só texto.
   ============================================================ */

const QUESTIONS_PER_ROUND = 8; // ✏️ mude aqui para rodadas mais curtas/longas

const MASCOT_LINES = {
  correct: ['Isso aí! 🎉', 'Muito bem!! 🥳', 'Você é fera! ⭐', 'Mandou bem!! 🐵', 'Isso mesmo, campeão!'],
  wrong: ['Quase! Tenta de novo 💪', 'Ops! Vamos pensar juntos 🤔', 'Não foi dessa vez, mas você consegue!', 'Respira e tenta outra vez! 🌿'],
  start: ['Vamos nessa! 🚀', 'Preparado(a)? Bora treinar! 🌴', 'Eu acredito em você!'],
  perfect: ['UAU! Rodada perfeita! 🏆', 'Você acertou tudo! Incrível! 🌟'],
  good: ['Muito bem! Continue treinando! 💪']
};

const OP_LABELS = {
  add: 'Adição',
  sub: 'Subtração',
  mul: 'Multiplicação',
  div: 'Divisão'
};

// Estado da rodada atual
let gameState = {
  op: null,
  tableNumber: null,
  mode: 'choice', // 'choice' | 'column'
  index: 0,
  correctCount: 0,
  streak: 0,
  current: null
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startRound(op, tableNumber = null, mode = 'choice') {
  gameState = { op, tableNumber, mode, index: 0, correctCount: 0, streak: 0, current: null };
  setMascotSpeech(pickRandom(MASCOT_LINES.start));
  renderNextQuestion();
}

function renderNextQuestion() {
  if (gameState.index >= QUESTIONS_PER_ROUND) {
    endRound();
    return;
  }

  document.getElementById('game-progress-label').textContent =
    `Pergunta ${gameState.index + 1} de ${QUESTIONS_PER_ROUND}`;
  document.getElementById('game-progress-fill').style.width =
    `${Math.round((gameState.index / QUESTIONS_PER_ROUND) * 100)}%`;

  if (gameState.mode === 'column') {
    document.getElementById('question-card').classList.add('hidden');
    document.getElementById('answer-options').classList.add('hidden');
    document.getElementById('column-calc').classList.remove('hidden');

    const q = generateColumnQuestion(gameState.op);
    gameState.current = q;
    if (q.isDivision) {
      renderDivisionQuestion(q);
    } else {
      renderColumnQuestion(q);
    }
  } else {
    document.getElementById('column-calc').classList.add('hidden');
    document.getElementById('question-card').classList.remove('hidden');
    document.getElementById('answer-options').classList.remove('hidden');

    renderChoiceQuestion();
  }
}

/* ============================================================
   MODO MÚLTIPLA ESCOLHA
   ============================================================ */
function renderChoiceQuestion() {
  const q = generateQuestion(gameState.op, gameState.tableNumber);
  gameState.current = q;

  document.getElementById('question-text').textContent = q.text;

  const optionsWrap = document.getElementById('answer-options');
  optionsWrap.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(opt, btn));
    optionsWrap.appendChild(btn);
  });

  clearFeedback();
}

function handleAnswer(selected, btnEl) {
  // trava os botões pra evitar clique duplo
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

  const q = gameState.current;
  const correct = selected === q.answer;

  recordAttempt({
    op: q.op,
    tableNumber: q.tableNumber,
    questionText: q.text,
    correct
  });

  if (correct) {
    btnEl.classList.add('is-correct');
    handleRoundSuccessFeedback();
  } else {
    btnEl.classList.add('is-wrong');
    // destaca qual era a certa, sem deixar a criança travada
    document.querySelectorAll('.answer-btn').forEach(b => {
      if (Number(b.textContent) === q.answer) b.classList.add('is-correct');
    });
    handleRoundFailFeedback();
  }

  updateWalletDisplay();

  setTimeout(() => {
    gameState.index++;
    renderNextQuestion();
  }, 1200);
}

function clearFeedback() {
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = false);
}

/* ============================================================
   MODO "ARMAR CONTA" — Adição, Subtração e Multiplicação
   ============================================================
   Desenha os dois números empilhados por coluna (unidades,
   dezenas...), com uma linha de rascunho opcional em cima
   (pro "vai um" / "empresta 1") e caixinhas embaixo da linha
   pra criança escrever o resultado, dígito por dígito.
   A correção é feita pelo valor final (não dígito a dígito),
   então não tem problema deixar caixas de "sobra" em branco.
   ============================================================ */
function padLeftArray(value, len) {
  const s = String(value);
  const arr = [];
  for (let i = 0; i < len - s.length; i++) arr.push('');
  for (const ch of s) arr.push(ch);
  return arr;
}

function makeSlot(innerNode, extraClass) {
  const slot = document.createElement('div');
  slot.className = 'col-slot' + (extraClass ? ' ' + extraClass : '');
  if (innerNode) slot.appendChild(innerNode);
  return slot;
}

function makeDigitText(text, extraClass) {
  const span = document.createElement('span');
  span.className = 'col-digit' + (extraClass ? ' ' + extraClass : '');
  span.textContent = text;
  return span;
}

function renderColumnQuestion(q) {
  const wrap = document.getElementById('column-calc');
  wrap.innerHTML = '';

  const cols = q.numDigits + 1; // 1 coluna extra reservada pro símbolo/alinhamento
  const digitsA = padLeftArray(q.a, q.numDigits);
  const digitsB = padLeftArray(q.b, q.numDigits);

  const grid = document.createElement('div');
  grid.className = 'col-grid';

  // linha de rascunho (vai-um / empresta-um) — opcional, não é corrigida
  const carryRow = document.createElement('div');
  carryRow.className = 'col-row';
  carryRow.appendChild(makeSlot(null));
  for (let i = 0; i < q.numDigits; i++) {
    const input = document.createElement('input');
    input.className = 'col-carry-input';
    input.maxLength = 1;
    input.inputMode = 'numeric';
    input.setAttribute('aria-label', 'rascunho');
    carryRow.appendChild(makeSlot(input));
  }
  grid.appendChild(carryRow);

  // linha do número A
  const rowA = document.createElement('div');
  rowA.className = 'col-row';
  rowA.appendChild(makeSlot(null));
  digitsA.forEach(d => rowA.appendChild(makeSlot(d ? makeDigitText(d) : null)));
  grid.appendChild(rowA);

  // linha do número B, com o símbolo da operação
  const rowB = document.createElement('div');
  rowB.className = 'col-row';
  rowB.appendChild(makeSlot(makeDigitText(q.symbol, 'col-symbol')));
  digitsB.forEach(d => rowB.appendChild(makeSlot(d ? makeDigitText(d) : null)));
  grid.appendChild(rowB);

  // linha divisória
  grid.appendChild(Object.assign(document.createElement('div'), { className: 'col-line' }));

  // linha de resultado (editável)
  const resultRow = document.createElement('div');
  resultRow.className = 'col-row';
  const blanks = cols - q.resultLength;
  for (let i = 0; i < blanks; i++) resultRow.appendChild(makeSlot(null));
  const resultInputs = [];
  for (let i = 0; i < q.resultLength; i++) {
    const input = document.createElement('input');
    input.className = 'col-result-input';
    input.maxLength = 1;
    input.inputMode = 'numeric';
    input.setAttribute('aria-label', 'dígito do resultado');
    resultInputs.push(input);
    resultRow.appendChild(makeSlot(input));
  }
  grid.appendChild(resultRow);

  wrap.appendChild(grid);
  setupAutoAdvance(resultInputs);

  const checkBtn = document.createElement('button');
  checkBtn.className = 'btn btn-primary col-check-btn';
  checkBtn.textContent = 'Conferir ✅';
  checkBtn.addEventListener('click', () => checkColumnAnswer(q, resultInputs, checkBtn));
  wrap.appendChild(checkBtn);

  // a conta se resolve da direita pra esquerda — foco começa na última casa
  if (resultInputs.length) resultInputs[resultInputs.length - 1].focus();
}

// digita um dígito → foca automaticamente na casa à esquerda (fluxo real da conta)
function setupAutoAdvance(inputs) {
  inputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
      if (input.value && idx > 0) inputs[idx - 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
      if (e.key === 'Enter') document.querySelector('.col-check-btn')?.click();
    });
  });
}

function checkColumnAnswer(q, resultInputs, checkBtn) {
  const combined = resultInputs.map(i => (i.value === '' ? '0' : i.value)).join('');
  const value = parseInt(combined, 10);
  const correct = value === q.answer;

  recordAttempt({
    op: q.op,
    tableNumber: q.tableNumber,
    questionText: `${q.a} ${q.symbol} ${q.b}`,
    correct
  });

  resultInputs.forEach(i => { i.disabled = true; i.classList.add(correct ? 'is-correct' : 'is-wrong'); });
  checkBtn.disabled = true;

  if (correct) {
    handleRoundSuccessFeedback();
  } else {
    handleRoundFailFeedback();
    showColumnAnswerHint(`A resposta certa era ${q.answer}`);
  }

  updateWalletDisplay();

  setTimeout(() => {
    gameState.index++;
    renderNextQuestion();
  }, correct ? 1200 : 2200);
}

function showColumnAnswerHint(text) {
  const hint = document.createElement('p');
  hint.className = 'col-answer-hint';
  hint.textContent = text;
  document.getElementById('column-calc').appendChild(hint);
}

/* ============================================================
   MODO "ARMAR CONTA" — Divisão (chave de divisão)
   ============================================================
   Layout clássico usado nas escolas: quociente em cima,
   dividendo dentro da "chave", divisor do lado de fora.
   A criança preenche quociente, produto (divisor × quociente)
   e resto — os três precisam estar certos.
   ============================================================ */
function renderDivisionQuestion(q) {
  const wrap = document.getElementById('column-calc');
  wrap.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'div-calc';

  const quotientBoxesHTML = q.steps.map((s, i) =>
    `<input class="div-quotient-digit" data-step="${i}" maxlength="1" inputmode="numeric" aria-label="dígito ${i + 1} do quociente">`
  ).join('');

  const stepsHTML = q.steps.map((s, i) => `
    <div class="div-step-block">
      <span class="div-step-current">${s.current}</span>
      <div class="div-step-sub">
        <span class="div-step-minus">−</span>
        <input class="div-step-product" data-step="${i}" maxlength="2" inputmode="numeric" aria-label="produto do passo ${i + 1}">
      </div>
      <span class="div-step-line"></span>
      <span class="div-step-remainder" data-step="${i}">?</span>
    </div>
  `).join('<span class="div-step-arrow">⬇</span>');

  box.innerHTML = `
    <div class="div-key">
      <span class="div-key-dividend">${q.dividend}</span>
      <span class="div-key-bar"></span>
      <div class="div-key-right">
        <span class="div-key-divisor">${q.divisor}</span>
        <span class="div-key-line"></span>
        <div class="div-quotient-boxes">${quotientBoxesHTML}</div>
      </div>
    </div>
    <div class="div-steps-stack">${stepsHTML}</div>
  `;
  wrap.appendChild(box);

  const checkBtn = document.createElement('button');
  checkBtn.className = 'btn btn-primary col-check-btn';
  checkBtn.textContent = 'Conferir ✅';
  checkBtn.addEventListener('click', () => checkDivisionAnswer(q, checkBtn));
  wrap.appendChild(checkBtn);

  const firstInput = wrap.querySelector('.div-quotient-digit');
  if (firstInput) firstInput.focus();
}

function checkDivisionAnswer(q, checkBtn) {
  const quotientInputs = Array.from(document.querySelectorAll('.div-quotient-digit'));
  const productInputs = Array.from(document.querySelectorAll('.div-step-product'));

  let allOk = true;

  quotientInputs.forEach((input, i) => {
    const val = parseInt(input.value, 10);
    const ok = val === q.steps[i].digit;
    input.classList.add(ok ? 'is-correct' : 'is-wrong');
    input.disabled = true;
    if (!ok) allOk = false;
  });

  productInputs.forEach((input, i) => {
    const val = parseInt(input.value, 10);
    const ok = val === q.steps[i].product;
    input.classList.add(ok ? 'is-correct' : 'is-wrong');
    input.disabled = true;
    if (!ok) allOk = false;
    // revela o resto desse passo, seguindo pro próximo degrau da escadinha
    const remEl = document.querySelector(`.div-step-remainder[data-step="${i}"]`);
    if (remEl) remEl.textContent = q.steps[i].remainder;
  });

  checkBtn.disabled = true;

  recordAttempt({
    op: 'div',
    tableNumber: q.tableNumber,
    questionText: `${q.dividend} ÷ ${q.divisor}`,
    correct: allOk
  });

  if (allOk) {
    handleRoundSuccessFeedback();
  } else {
    handleRoundFailFeedback();
    showColumnAnswerHint(`Quociente: ${q.quotient} · Resto: ${q.remainder}`);
  }

  updateWalletDisplay();

  setTimeout(() => {
    gameState.index++;
    renderNextQuestion();
  }, allOk ? 1200 : 2400);
}

/* ============================================================
   Feedback compartilhado entre os dois modos
   ============================================================ */
function handleRoundSuccessFeedback() {
  gameState.correctCount++;
  gameState.streak++;
  setMascotSpeech(pickRandom(MASCOT_LINES.correct));
  spawnConfetti();
  playFeedbackAnimation('bounce');

  // ✏️ bônus de sequência — veja SCORING em storage.js
  if (gameState.streak > 0 && gameState.streak % SCORING.streakSize === 0) {
    addCoins(SCORING.bonusCoins);
    showBonusToast(`Sequência de ${gameState.streak}! +${SCORING.bonusCoins} moedas 🪙`);
  }
}

function handleRoundFailFeedback() {
  gameState.streak = 0;
  setMascotSpeech(pickRandom(MASCOT_LINES.wrong));
  playFeedbackAnimation('shake');
}

function playFeedbackAnimation(kind) {
  const card = gameState.mode === 'column'
    ? document.getElementById('column-calc')
    : document.getElementById('question-card');
  card.classList.remove('anim-bounce', 'anim-shake');
  void card.offsetWidth; // força reflow pra animação poder tocar de novo
  card.classList.add(kind === 'bounce' ? 'anim-bounce' : 'anim-shake');
}

function showBonusToast(text) {
  const toast = document.getElementById('bonus-toast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

function endRound() {
  const total = QUESTIONS_PER_ROUND;
  const correct = gameState.correctCount;
  const perfect = correct === total;

  if (perfect) {
    addStars(SCORING.starsPerPerfectRound);
  }
  updateWalletDisplay();

  document.getElementById('result-score').textContent = `${correct} / ${total}`;
  document.getElementById('result-op-label').textContent = OP_LABELS[gameState.op] || '';
  document.getElementById('result-message').textContent = perfect
    ? pickRandom(MASCOT_LINES.perfect)
    : pickRandom(MASCOT_LINES.good);
  document.getElementById('result-emoji').textContent = perfect ? '🏆' : (correct >= total / 2 ? '🌟' : '🌱');

  showScreen('screen-result');
}

/* ---------- Confete simples em CSS/JS puro ---------- */
const CONFETTI_COLORS = ['#FFC93C', '#FF8C42', '#FF5E8E', '#4FC3E8', '#1FA35A'];

function spawnConfetti() {
  const layer = document.getElementById('confetti-layer');
  const pieceCount = 26;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = pickRandom(CONFETTI_COLORS);
    piece.style.animationDuration = (0.9 + Math.random() * 0.9) + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}
