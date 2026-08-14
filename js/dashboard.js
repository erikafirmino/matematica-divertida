/* ============================================================
   dashboard.js — Área dos Pais / Professores
   ============================================================
   ✏️ PARA MUDAR A SENHA: altere PARENT_PASSWORD abaixo.
      (é só uma trava simples para evitar clique acidental da
      criança — não é um sistema de segurança real)
   ============================================================ */

const PARENT_PASSWORD = '1234'; // ✏️ troque a senha aqui

const OP_LABELS_PT = {
  add: 'Adição ➕',
  sub: 'Subtração ➖',
  mul: 'Multiplicação ✖️',
  div: 'Divisão ➗'
};

function checkParentPassword(input) {
  return input === PARENT_PASSWORD;
}

function renderDashboard() {
  const stats = getStats();

  document.getElementById('dash-total').textContent = stats.total;
  document.getElementById('dash-accuracy').textContent = stats.total ? `${stats.accuracy}%` : '—';
  document.getElementById('dash-correct').textContent = stats.correctCount;
  document.getElementById('dash-errors').textContent = stats.errorCount;
  document.getElementById('dash-coins').textContent = stats.coins;
  document.getElementById('dash-stars').textContent = stats.stars;

  // Por operação
  const opsWrap = document.getElementById('dash-by-op');
  opsWrap.innerHTML = '';
  Object.entries(stats.byOp).forEach(([op, v]) => {
    const row = document.createElement('div');
    row.className = 'dash-op-row';
    const pct = v.accuracy === null ? 0 : v.accuracy;
    row.innerHTML = `
      <div class="dash-op-header">
        <span>${OP_LABELS_PT[op]}</span>
        <span>${v.total ? `${v.accuracy}% de acerto (${v.total} atividades)` : 'sem dados ainda'}</span>
      </div>
      <div class="dash-bar-track">
        <div class="dash-bar-fill" style="width:${pct}%"></div>
      </div>
    `;
    opsWrap.appendChild(row);
  });

  // Alerta de tabuadas mais fracas
  const alertBox = document.getElementById('dash-weak-alert');
  if (stats.weakestTables.length > 0) {
    const listaTexto = stats.weakestTables
      .map(w => `tabuada do ${w.number} (${w.accuracy}% de acerto)`)
      .join(', ');
    alertBox.style.display = 'block';
    alertBox.innerHTML = `⚠️ Atenção: a criança erra mais na ${listaTexto}.`;
  } else {
    alertBox.style.display = 'none';
  }

  // Grade completa por tabuada (1 a 10)
  const tableWrap = document.getElementById('dash-by-table');
  tableWrap.innerHTML = '';
  for (let n = 1; n <= 10; n++) {
    const v = stats.byTable[n];
    const cell = document.createElement('div');
    cell.className = 'dash-table-cell';
    if (v.total === 0) {
      cell.classList.add('is-empty');
      cell.innerHTML = `<strong>${n}x</strong><span>sem dados</span>`;
    } else {
      const level = v.accuracy >= 80 ? 'good' : v.accuracy >= 50 ? 'ok' : 'bad';
      cell.classList.add('level-' + level);
      cell.innerHTML = `<strong>${n}x</strong><span>${v.accuracy}%</span>`;
    }
    tableWrap.appendChild(cell);
  }
}

function handleResetHistory() {
  const confirmed = confirm('Tem certeza que deseja apagar todo o histórico e progresso? Essa ação não pode ser desfeita.');
  if (!confirmed) return;
  resetHistory();
  updateWalletDisplay();
  renderDashboard();
}
