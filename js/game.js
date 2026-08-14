/* ============================================================
   game.js — Mecânica do jogo (uma "rodada" de perguntas)
   ============================================================
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
  index: 0,
  correctCount: 0,
  streak: 0,
  current: null
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startRound(op, tableNumber = null) {
  gameState = { op, tableNumber, index: 0, correctCount: 0, streak: 0, current: null };
  setMascotSpeech(pickRandom(MASCOT_LINES.start));
  renderNextQuestion();
}

function renderNextQuestion() {
  if (gameState.index >= QUESTIONS_PER_ROUND) {
    endRound();
    return;
  }
  const q = generateQuestion(gameState.op, gameState.tableNumber);
  gameState.current = q;

  document.getElementById('question-text').textContent = q.text;
  document.getElementById('game-progress-label').textContent =
    `Pergunta ${gameState.index + 1} de ${QUESTIONS_PER_ROUND}`;
  document.getElementById('game-progress-fill').style.width =
    `${Math.round((gameState.index / QUESTIONS_PER_ROUND) * 100)}%`;

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
    gameState.correctCount++;
    gameState.streak++;
    btnEl.classList.add('is-correct');
    setMascotSpeech(pickRandom(MASCOT_LINES.correct));
    spawnConfetti();
    playFeedbackAnimation('bounce');

    // ✏️ bônus de sequência — veja SCORING em storage.js
    if (gameState.streak > 0 && gameState.streak % SCORING.streakSize === 0) {
      addCoins(SCORING.bonusCoins);
      showBonusToast(`Sequência de ${gameState.streak}! +${SCORING.bonusCoins} moedas 🪙`);
    }
  } else {
    gameState.streak = 0;
    btnEl.classList.add('is-wrong');
    // destaca qual era a certa, sem deixar a criança travada
    document.querySelectorAll('.answer-btn').forEach(b => {
      if (Number(b.textContent) === q.answer) b.classList.add('is-correct');
    });
    setMascotSpeech(pickRandom(MASCOT_LINES.wrong));
    playFeedbackAnimation('shake');
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

function playFeedbackAnimation(kind) {
  const card = document.getElementById('question-card');
  card.classList.remove('anim-bounce', 'anim-shake');
  // força reflow pra animação poder tocar de novo
  void card.offsetWidth;
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
