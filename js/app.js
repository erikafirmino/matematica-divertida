/* ============================================================
   app.js — Navegação entre telas e amarração dos eventos
   ============================================================
   Fluxo de telas:
   menu → (se mul/div: seletor de tabuada) → seletor de modo
        → jogo → resultado
   ============================================================ */

let pendingOp = null;    // operação escolhida no menu, aguardando a escolha de modo
let pendingTable = null; // tabuada escolhida (mul/div), aguardando a escolha de modo

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateWalletDisplay() {
  const data = loadData();
  document.querySelectorAll('.coin-count').forEach(el => el.textContent = data.coins);
  document.querySelectorAll('.star-count').forEach(el => el.textContent = data.stars);
}

function setMascotSpeech(text) {
  document.querySelectorAll('.mascot-speech-text').forEach(el => el.textContent = text);
}

/* ---------- Seletor de tabuada (só aparece para Multiplicação/Divisão) ---------- */
function buildTablePicker() {
  const grid = document.getElementById('table-picker-grid');
  grid.innerHTML = '';

  const mixBtn = document.createElement('button');
  mixBtn.className = 'table-btn table-btn-mix';
  mixBtn.innerHTML = '🎲<br>Misturar tudo';
  mixBtn.addEventListener('click', () => {
    pendingTable = null;
    showScreen('screen-mode-picker');
  });
  grid.appendChild(mixBtn);

  for (let n = 1; n <= 10; n++) {
    const btn = document.createElement('button');
    btn.className = 'table-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => {
      pendingTable = n;
      showScreen('screen-mode-picker');
    });
    grid.appendChild(btn);
  }
}

function initMenuButtons() {
  document.querySelectorAll('.op-card').forEach(card => {
    card.addEventListener('click', () => {
      const op = card.dataset.op;
      pendingOp = op;
      if (op === 'mul' || op === 'div') {
        document.getElementById('table-picker-title').textContent =
          op === 'mul' ? 'Escolha a tabuada para treinar' : 'Escolha a tabuada da divisão';
        buildTablePicker();
        showScreen('screen-table-picker');
      } else {
        pendingTable = null;
        showScreen('screen-mode-picker');
      }
    });
  });
}

/* ---------- Seletor de modo (Múltipla Escolha vs Armar Conta) ---------- */
function initModePicker() {
  document.getElementById('btn-mode-choice').addEventListener('click', () => {
    startRound(pendingOp, pendingTable, 'choice');
    showScreen('screen-game');
  });
  document.getElementById('btn-mode-column').addEventListener('click', () => {
    startRound(pendingOp, pendingTable, 'column');
    showScreen('screen-game');
  });
}

function initBackButtons() {
  document.querySelectorAll('[data-nav-back-to-menu]').forEach(btn => {
    btn.addEventListener('click', () => showScreen('screen-menu'));
  });
  document.getElementById('btn-table-picker-back').addEventListener('click', () => showScreen('screen-menu'));
}

function initResultButtons() {
  document.getElementById('btn-play-again').addEventListener('click', () => {
    startRound(gameState.op, gameState.tableNumber, gameState.mode);
    showScreen('screen-game');
  });
  document.getElementById('btn-result-menu').addEventListener('click', () => showScreen('screen-menu'));
}

/* ---------- Área dos Pais ---------- */
function initParentArea() {
  const modal = document.getElementById('modal-parent-login');
  const input = document.getElementById('parent-password-input');
  const errorMsg = document.getElementById('parent-password-error');

  document.getElementById('btn-parent-area').addEventListener('click', () => {
    input.value = '';
    errorMsg.style.display = 'none';
    modal.classList.add('open');
    input.focus();
  });

  document.getElementById('btn-parent-cancel').addEventListener('click', () => {
    modal.classList.remove('open');
  });

  document.getElementById('btn-parent-confirm').addEventListener('click', () => {
    if (checkParentPassword(input.value.trim())) {
      modal.classList.remove('open');
      renderDashboard();
      showScreen('screen-dashboard');
    } else {
      errorMsg.style.display = 'block';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-parent-confirm').click();
  });

  document.getElementById('btn-dashboard-exit').addEventListener('click', () => showScreen('screen-menu'));
  document.getElementById('btn-dashboard-reset').addEventListener('click', handleResetHistory);
}

/* ---------- Inicialização ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateWalletDisplay();
  initMenuButtons();
  initModePicker();
  initBackButtons();
  initResultButtons();
  initParentArea();
  setMascotSpeech('Oi! Eu sou o Toco! Escolha uma trilha para treinar 🌴');
});
