/* ============================================================
   storage.js — Progresso da criança salvo no localStorage
   ============================================================
   Aqui fica TUDO relacionado a salvar/ler dados no navegador.
   Não precisa de servidor: cada criança tem seus dados salvos
   no próprio navegador/dispositivo em que jogou.

   ✏️ PARA MEXER NA PONTUAÇÃO, veja o objeto SCORING logo abaixo.
   ✏️ PARA MUDAR A SENHA DA ÁREA DOS PAIS, veja js/dashboard.js.
   ============================================================ */

const STORAGE_KEY = 'selvaMatematica_v1';

// ✏️ LÓGICA DE PONTUAÇÃO — altere estes números para calibrar o jogo
const SCORING = {
  coinsPerCorrect: 1,       // moedas ganhas a cada acerto
  streakSize: 5,            // a cada X acertos SEGUIDOS, ganha bônus
  bonusCoins: 3,            // moedas extras ganhas no bônus de sequência
  starsPerPerfectRound: 1   // estrelas ganhas ao terminar uma rodada sem nenhum erro
};

function getDefaultData() {
  return {
    coins: 0,
    stars: 0,
    // cada item do histórico: { op, tableNumber, question, correct, timestamp }
    history: []
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    return { ...getDefaultData(), ...parsed };
  } catch (e) {
    console.warn('Não foi possível ler o progresso salvo, começando do zero.', e);
    return getDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Registra uma tentativa de resposta (certa ou errada) no histórico
function recordAttempt({ op, tableNumber, questionText, correct }) {
  const data = loadData();
  data.history.push({
    op,
    tableNumber: tableNumber ?? null,
    question: questionText,
    correct,
    timestamp: Date.now()
  });
  if (correct) {
    data.coins += SCORING.coinsPerCorrect;
  }
  saveData(data);
  return data;
}

function addCoins(amount) {
  const data = loadData();
  data.coins += amount;
  saveData(data);
  return data;
}

function addStars(amount) {
  const data = loadData();
  data.stars += amount;
  saveData(data);
  return data;
}

// Usado pelo botão "Zerar Histórico" no Painel dos Pais
function resetHistory() {
  const data = getDefaultData();
  saveData(data);
  return data;
}

/* ============================================================
   Estatísticas para o Painel dos Pais/Professores
   ============================================================ */
function getStats() {
  const data = loadData();
  const total = data.history.length;
  const correctCount = data.history.filter(h => h.correct).length;
  const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

  const OPS = ['add', 'sub', 'mul', 'div'];
  const byOp = {};
  OPS.forEach(op => {
    const items = data.history.filter(h => h.op === op);
    const c = items.filter(h => h.correct).length;
    byOp[op] = {
      total: items.length,
      correct: c,
      errors: items.length - c,
      accuracy: items.length ? Math.round((c / items.length) * 100) : null
    };
  });

  // Desempenho por tabuada (1 a 10), somando multiplicação + divisão
  const byTable = {};
  for (let n = 1; n <= 10; n++) {
    const items = data.history.filter(h => (h.op === 'mul' || h.op === 'div') && h.tableNumber === n);
    const c = items.filter(h => h.correct).length;
    byTable[n] = {
      total: items.length,
      correct: c,
      errors: items.length - c,
      accuracy: items.length ? Math.round((c / items.length) * 100) : null
    };
  }

  // Tabuadas mais fracas — só entram as que já foram praticadas pelo menos 3 vezes
  const weakestTables = Object.entries(byTable)
    .filter(([, v]) => v.total >= 3 && v.accuracy !== null)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 3)
    .map(([n, v]) => ({ number: Number(n), accuracy: v.accuracy }));

  return {
    total,
    correctCount,
    errorCount: total - correctCount,
    accuracy,
    byOp,
    byTable,
    weakestTables,
    coins: data.coins,
    stars: data.stars
  };
}
