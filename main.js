const API_URL = 'https://6a30a326a7f8866418d63d9c.mockapi.io/materiais';

// Limiar de estoque crítico (contrato: class="estoque-critico" quando qtd < 10)
const LIMITE_CRITICO = 10;

// Cache local dos materiais (último GET bem-sucedido)
let materiaisCache = [];

// ── Elementos DOM ──────────────────────────────────────────────────────────
const inputNome      = document.getElementById('input-nome');
const inputQtd       = document.getElementById('input-quantidade');
const btnCad         = document.getElementById('btn-cadastrar');
const btnLabel       = document.getElementById('btn-label');
const btnSpinner     = document.getElementById('btn-spinner');
const toast          = document.getElementById('toast');
const tbody          = document.getElementById('tbody-materiais');
const statTotal      = document.getElementById('stat-total');
const statQtd        = document.getElementById('stat-qtd');
const statZero       = document.getElementById('stat-zero');
const statCritico    = document.getElementById('stat-critico');
const totalItens     = document.getElementById('total-itens');   // contrato Sprint 3
const inputBusca     = document.getElementById('input-busca');   // contrato Sprint 3
const bannerOffline  = document.getElementById('banner-offline');
const modalOverlay   = document.getElementById('modal-overlay');
const modalNome      = document.getElementById('modal-nome');
const modalCancelar  = document.getElementById('modal-cancelar');
const modalConfirmar = document.getElementById('modal-confirmar');
const modalBtnLabel  = document.getElementById('modal-btn-label');
const modalSpinner   = document.getElementById('modal-spinner');

let pendingDeleteId = null;

/* ════════════════════════════════════════════════════════════
   FUNÇÃO OBRIGATÓRIA — Sprint 2
   validarRetirada(estoqueAtual, quantidadeRetirada)
   Retorna true se a retirada é válida, false se inválida.
   ════════════════════════════════════════════════════════════ */
function validarRetirada(estoqueAtual, quantidadeRetirada) {
  const estoque  = Number(estoqueAtual);
  const retirada = Number(quantidadeRetirada);
  if (Number.isNaN(estoque) || Number.isNaN(retirada)) return false;
  if (retirada <= 0)       return false;
  if (retirada > estoque)  return false;
  return true;
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
function showToast(msg, type = 'ok', duration = 3500) {
  toast.textContent = msg;
  toast.className = type;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

/* ── Banner offline ─────────────────────────────────────────────────────── */
function mostrarBannerOffline(visivel) {
  bannerOffline.style.display = visivel ? 'flex' : 'none';
}

function tentarReconectar() {
  mostrarBannerOffline(false);
  listarMateriais();
}
// expõe para uso no onclick do HTML
window.tentarReconectar = tentarReconectar;

/* ── Botão cadastrar: estado de loading ─────────────────────────────────── */
function setBusy(v) {
  btnCad.disabled = v;
  btnLabel.style.display   = v ? 'none' : 'inline';
  btnSpinner.style.display = v ? 'inline-block' : 'none';
}

/* ── Utilitário ─────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Estatísticas / Dashboard ───────────────────────────────────────────── */
function updateStats(materiais) {
  const total    = materiais.length;
  const totalQtd = materiais.reduce((s, m) => s + Number(m.quantidade || 0), 0);
  const zeros    = materiais.filter(m => Number(m.quantidade || 0) === 0).length;
  const criticos = materiais.filter(m => {
    const q = Number(m.quantidade || 0);
    return q > 0 && q < LIMITE_CRITICO;
  }).length;

  statTotal.textContent   = total;
  statQtd.textContent     = totalQtd;
  statZero.textContent    = zeros;
  statCritico.textContent = criticos;
}

/* ── Renderiza tabela ───────────────────────────────────────────────────── */
function renderTabela(materiais) {
  // Atualiza o contador #total-itens (contrato Sprint 3)
  totalItens.textContent = materiais.length;

  if (!materiais.length) {
    tbody.innerHTML = `
      <tr class="loading-row">
        <td colspan="5">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="1.4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          Nenhum material cadastrado ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = materiais.map((m, i) => {
    const qtd     = Number(m.quantidade || 0);
    const zerado  = qtd === 0;
    const critico = qtd > 0 && qtd < LIMITE_CRITICO;

    // Contrato Sprint 3: class="estoque-critico" na <tr> quando qtd < 10
    const trClass = critico ? 'estoque-critico' : '';

    // Contrato Sprint 2: id="input-retirada" no primeiro elemento
    const idAttr = i === 0 ? 'id="input-retirada"' : '';

    return `
      <tr class="${trClass}" data-id="${m.id}">
        <td style="color:var(--gray-400);font-family:'IBM Plex Mono',monospace;font-size:.75rem">${i + 1}</td>
        <td>
          ${escapeHtml(m.nome)}
          ${critico ? '<span class="alerta-critico">⚠ Crítico</span>' : ''}
          ${zerado  ? '<span class="alerta-critico" style="background:#fecaca;color:#7f1d1d">✕ Zerado</span>' : ''}
        </td>
        <td><span class="badge${zerado ? ' zero' : ''}">${qtd}</span></td>
        <td>
          <div class="retirada-cell">
            <input
              type="number"
              class="input-retirada"
              ${idAttr}
              data-input-id="${m.id}"
              placeholder="0"
              min="1"
              ${zerado ? 'disabled' : ''}
            />
            <button
              class="btn-baixar"
              data-id="${m.id}"
              data-estoque="${qtd}"
              ${zerado ? 'disabled' : ''}
            >
              <span class="baixar-label">Baixar</span>
            </button>
          </div>
        </td>
        <td>
          <div class="acoes-cell">
            <button class="btn-excluir" onclick="abrirModal('${m.id}', '${escapeHtml(m.nome)}')">Excluir</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.querySelectorAll('.btn-baixar').forEach(btn => {
    btn.addEventListener('click', () => baixarEstoque(btn));
  });
}

/* ── Filtro de busca (client-side, sem nova requisição) ─────────────────── */
function filtrarMateriais(termo) {
  const normalizar = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const t = normalizar(termo.trim());

  if (!t) {
    // Sem filtro: mostra todos e reseta o contador
    renderTabela(materiaisCache);
    updateStats(materiaisCache);
    return;
  }

  const filtrados = materiaisCache.filter(m =>
    normalizar(m.nome || '').includes(t)
  );

  // Atualiza apenas a tabela (stats continuam mostrando o total real)
  totalItens.textContent = filtrados.length;

  if (!filtrados.length) {
    tbody.innerHTML = `
      <tr class="no-results">
        <td colspan="5">Nenhum material encontrado para "<strong>${escapeHtml(termo)}</strong>".</td>
      </tr>`;
    return;
  }

  renderTabela(filtrados);
}

inputBusca.addEventListener('input', (e) => filtrarMateriais(e.target.value));

/* ── Modal ──────────────────────────────────────────────────────────────── */
function abrirModal(id, nome) {
  pendingDeleteId = id;
  modalNome.textContent = `"${nome}"`;
  modalOverlay.classList.add('open');
  modalConfirmar.disabled = false;
  modalBtnLabel.style.display  = 'inline';
  modalSpinner.style.display   = 'none';
}
window.abrirModal = abrirModal;

function fecharModal() {
  modalOverlay.classList.remove('open');
  pendingDeleteId = null;
}

modalCancelar.addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

/* ════════════════════════════════════════════════════════════
   DELETE — Excluir item (disparado pela modal)
   try/catch obrigatório pelo contrato Sprint 3
   ════════════════════════════════════════════════════════════ */
modalConfirmar.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  modalConfirmar.disabled = true;
  modalBtnLabel.style.display  = 'none';
  modalSpinner.style.display   = 'inline-block';

  try {
    const res = await fetch(`${API_URL}/${pendingDeleteId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}: não foi possível excluir o item.`);
    fecharModal();
    showToast('Material removido com sucesso.', 'ok');
    await listarMateriais();
  } catch (err) {
    fecharModal();
    if (err instanceof TypeError) {
      // TypeError = falha de rede (sem internet, DNS, CORS)
      mostrarBannerOffline(true);
      showToast('Sem conexão. Verifique sua internet e tente novamente.', 'err', 6000);
    } else {
      showToast(`Erro ao remover: ${err.message}`, 'err');
    }
  }
});

/* ════════════════════════════════════════════════════════════
   PUT — Retirada (baixa) de estoque
   try/catch obrigatório pelo contrato Sprint 3
   ════════════════════════════════════════════════════════════ */
async function baixarEstoque(btn) {
  const id           = btn.dataset.id;
  const estoqueAtual = Number(btn.dataset.estoque);
  const input        = document.querySelector(`.input-retirada[data-input-id="${id}"]`);
  const quantidade   = input.value.trim();

  input.classList.remove('invalid');

  if (quantidade === '' || isNaN(Number(quantidade))) {
    input.classList.add('invalid');
    showToast('Informe uma quantidade válida para retirar.', 'warn');
    return;
  }

  // Validação via função obrigatória
  if (!validarRetirada(estoqueAtual, quantidade)) {
    input.classList.add('invalid');
    if (Number(quantidade) <= 0) {
      showToast('A quantidade a retirar deve ser maior que zero.', 'warn');
    } else {
      showToast(`Estoque insuficiente — disponível: ${estoqueAtual} unidade(s).`, 'err');
    }
    return;
  }

  const novaQuantidade = estoqueAtual - Number(quantidade);
  const label = btn.querySelector('.baixar-label');
  btn.disabled   = true;
  input.disabled = true;
  label.innerHTML = '<span class="spinner-mini"></span>';

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade: novaQuantidade })
    });
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}: não foi possível registrar a baixa.`);

    showToast(`Baixa de ${quantidade} unidade(s) registrada com sucesso.`, 'ok');
    await listarMateriais();
  } catch (err) {
    if (err instanceof TypeError) {
      mostrarBannerOffline(true);
      showToast('Sem conexão. A baixa não foi salva. Verifique sua internet.', 'err', 6000);
    } else {
      showToast(`Erro ao registrar baixa: ${err.message}`, 'err');
    }
    btn.disabled   = false;
    input.disabled = false;
    label.textContent = 'Baixar';
  }
}

/* ════════════════════════════════════════════════════════════
   GET — Listar materiais
   try/catch obrigatório pelo contrato Sprint 3
   ════════════════════════════════════════════════════════════ */
async function listarMateriais() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}: não foi possível carregar os materiais.`);

    const data = await res.json();
    materiaisCache = data;
    mostrarBannerOffline(false); // conexão restaurada

    // Se há um filtro ativo, reaplicar
    const termoBusca = inputBusca.value.trim();
    if (termoBusca) {
      filtrarMateriais(termoBusca);
    } else {
      renderTabela(data);
    }
    updateStats(data);
  } catch (err) {
    if (err instanceof TypeError) {
      // Falha de rede
      mostrarBannerOffline(true);
      tbody.innerHTML = `
        <tr class="loading-row">
          <td colspan="5" style="color:var(--err)">
            Sem conexão com a internet. Os dados não puderam ser carregados.
          </td>
        </tr>`;
    } else {
      // Erro HTTP ou parsing
      tbody.innerHTML = `
        <tr class="loading-row">
          <td colspan="5" style="color:var(--err)">
            ${escapeHtml(err.message)}
          </td>
        </tr>`;
      showToast(err.message, 'err', 6000);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   POST — Cadastrar material
   try/catch obrigatório pelo contrato Sprint 3
   ════════════════════════════════════════════════════════════ */
btnCad.addEventListener('click', async () => {
  const nome = inputNome.value.trim();
  const qtd  = inputQtd.value.trim();

  if (!nome) return showToast('Informe o nome do material.', 'warn');
  if (qtd === '' || isNaN(Number(qtd)) || Number(qtd) < 0)
    return showToast('Informe uma quantidade válida (≥ 0).', 'warn');

  setBusy(true);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, quantidade: Number(qtd) })
    });
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}: não foi possível cadastrar o material.`);

    inputNome.value = '';
    inputQtd.value  = '';
    showToast(`"${nome}" cadastrado com sucesso!`, 'ok');
    await listarMateriais();
  } catch (err) {
    if (err instanceof TypeError) {
      mostrarBannerOffline(true);
      showToast('Sem conexão. O cadastro não foi salvo.', 'err', 6000);
    } else {
      showToast(`Erro ao cadastrar: ${err.message}`, 'err');
    }
  } finally {
    setBusy(false);
  }
});

/* ── Init ── */
listarMateriais();