// ============================================================
// PawType 宠格测试 — 主逻辑
// ============================================================

const state = {
  species: null,   // 'cat' | 'dog'
  petName: '',
  current: 0,
  answers: [],     // { d: 维度, s: 分数 }
  type: null,      // 计算出的宠格 code
  unlocked: false,
};

const DIM_ORDER = ["EI", "NS", "FT", "PJ"];
const DIM_META_MAP = {
  EI: { left: "E", right: "I", leftName: "外向社牛", rightName: "内向独处" },
  NS: { left: "N", right: "S", leftName: "好奇探索", rightName: "安稳恋家" },
  FT: { left: "F", right: "T", leftName: "粘人感性", rightName: "独立理性" },
  PJ: { left: "P", right: "J", leftName: "随性灵活", rightName: "规律有序" },
};

// ---------- 页面切换 ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---------- 首页 ----------
const speciesBtns = document.querySelectorAll('.species-btn');
const btnStart = document.getElementById('btn-start');
const petNameInput = document.getElementById('pet-name');

speciesBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    speciesBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.species = btn.dataset.species;
    btnStart.disabled = false;
  });
});

btnStart.addEventListener('click', () => {
  state.petName = petNameInput.value.trim() || '毛孩子';
  state.current = 0;
  state.answers = [];
  state.unlocked = false;
  startQuiz();
});

// ---------- 答题 ----------
function startQuiz() {
  showScreen('screen-quiz');
  renderQuestion();
}

function shuffledOptions(options) {
  const arr = options.map((o, idx) => ({ ...o, _idx: idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuestion() {
  const list = QUESTIONS[state.species];
  const q = list[state.current];
  const body = document.getElementById('quiz-body');
  document.getElementById('progress-text').textContent = `${state.current + 1}/${list.length}`;
  document.getElementById('progress-fill').style.width = `${((state.current) / list.length) * 100}%`;

  const opts = shuffledOptions(q.o);
  body.innerHTML = `
    <div class="q-number">第 ${state.current + 1} 题 · ${DIM_META_MAP[q.d].leftName} vs ${DIM_META_MAP[q.d].rightName}</div>
    <div class="q-text">${q.q}</div>
    ${opts.map(o => `
      <button class="option" data-score="${o.s}" data-d="${q.d}">
        ${o.t}
      </button>`).join('')}
  `;

  body.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      body.querySelectorAll('.option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        state.answers.push({ d: btn.dataset.d, s: parseInt(btn.dataset.score, 10) });
        if (state.current < list.length - 1) {
          state.current++;
          renderQuestion();
        } else {
          finishQuiz();
        }
      }, 180);
    });
  });
}

document.getElementById('btn-back').addEventListener('click', () => {
  if (state.current > 0) {
    state.current--;
    state.answers.pop();
    renderQuestion();
  } else {
    showScreen('screen-home');
  }
});

// ---------- 计算宠格 ----------
function computeType() {
  const totals = { EI: 0, NS: 0, FT: 0, PJ: 0 };
  state.answers.forEach(a => { totals[a.d] += a.s; });
  const code = DIM_ORDER.map(d => totals[d] >= 0 ? DIM_META_MAP[d].left : DIM_META_MAP[d].right).join('');
  return { code, totals };
}

// ---------- 结果页 ----------
function finishQuiz() {
  const { code, totals } = computeType();
  state.type = code;
  const t = TYPES[code];
  const speciesName = state.species === 'cat' ? '猫咪' : '狗狗';
  document.getElementById('progress-fill').style.width = '100%';

  const dimChart = DIM_ORDER.map(d => {
    const meta = DIM_META_MAP[d];
    const score = totals[d];
    const pct = Math.min(100, Math.round(Math.abs(score) / 18 * 100));
    const side = score >= 0 ? 'left' : 'right';
    return `
      <div class="dim-row">
        <div class="dim-label"><b>${side === 'left' ? meta.leftName : meta.rightName}</b>${meta.label}</div>
        <div class="dim-bar"><div class="dim-bar-fill ${side}" style="width:${pct / 2}%"></div></div>
        <div class="dim-label"><b>${side === 'left' ? meta.rightName : meta.leftName}</b></div>
      </div>`;
  }).join('');

  const wrap = document.getElementById('result-wrap');
  wrap.innerHTML = `
    <div class="result-card">
      <div class="result-emoji">${t.emoji}</div>
      <div class="result-type">${t.name}</div>
      <div class="result-tagline">${speciesName} · ${t.tagline}</div>
      <span class="result-code">${code}</span>
      <div class="dimension-chart">
        <div style="text-align:center;font-size:13px;color:var(--text-light);margin-bottom:16px;">${state.petName} 的四维性格画像</div>
        ${dimChart}
      </div>
    </div>

    <div id="report-area"></div>

    <div class="share-card" id="share-card">
      <div class="rc-emoji">${t.emoji}</div>
      <div class="rc-name">${state.petName} 是「${t.name}」</div>
      <div style="font-size:13px;color:var(--text-light);">${t.tagline}</div>
      <div class="rc-url">${CONFIG.siteUrl} · 扫码测测你家毛孩子</div>
      <div class="share-actions">
        <button class="btn-copy" id="btn-copy">复制分享文案</button>
      </div>
    </div>

    <button class="btn-ghost" id="btn-retest">重新测一次</button>
  `;

  document.getElementById('btn-retest').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-copy').addEventListener('click', copyShare);

  renderReportArea(t);

  // 关键：切换到结果页
  showScreen('screen-result');

  // 做完测试自动弹出收款码，确保用户能看到支付环节
  setTimeout(showUnlockModal, 700);
}

function renderReportArea(t) {
  const area = document.getElementById('report-area');
  if (state.unlocked) {
    area.innerHTML = `
      <div class="unlocked-report">
        <div class="report-section"><h3>🐾 它的小世界</h3><p>${t.desc}</p></div>
        <div class="report-section"><h3>💡 相处建议</h3><p>${t.advice}</p></div>
        <div class="report-section"><h3>🏠 喜欢的生活环境</h3><p>${t.environment}</p></div>
        <div class="report-section"><h3>🎾 日常偏好</h3><p>${t.preference}</p></div>
      </div>`;
  } else {
    area.innerHTML = `
      <div class="paywall">
        <div class="paywall-title">🔒 想看完整的相处报告吗？</div>
        <div class="paywall-desc">完整报告含 4 篇专属解读：它的小世界、相处建议、喜欢的环境、日常偏好</div>
        <div class="price"><small>¥</small>${CONFIG.price}</div>
        <button class="primary-btn" id="btn-unlock" style="margin-top:16px;">立即解锁完整报告</button>
      </div>`;
    document.getElementById('btn-unlock').addEventListener('click', showUnlockModal);
  }
}

// ---------- 分享 ----------
function copyShare() {
  const t = TYPES[state.type];
  const text = `我测出了我家${state.petName}的宠格是【${t.name} ${t.emoji}】！\n${t.tagline}\n快来看看你家毛孩子是哪 16 种小性格之一 → ${CONFIG.siteUrl}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('分享文案已复制，去小红书粘贴吧！'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('分享文案已复制');
  }
}

// ---------- 复制微信号 ----------
function copyWechat() {
  const id = CONFIG.wechatId;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(id).then(() => toast('微信号已复制，去微信加我吧'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = id; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('微信号已复制');
  }
}

// ---------- 收款码弹窗 ----------
function showUnlockModal() {
  let mask = document.getElementById('unlock-modal');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'unlock-modal';
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal">
        <h3>微信扫码解锁报告</h3>
        <div class="qr-box"><img src="${CONFIG.qrcodeImage}" alt="微信收款码"></div>
        <div class="pay-step">1️⃣ 微信扫码付款 <b>¥${CONFIG.price}</b></div>
        <div class="pay-step">2️⃣ 付款后加微信，发「付款截图 + 毛孩子名字」</div>
        <div class="pay-step">3️⃣ 我把完整报告发给你</div>
        <div class="pay-wechat">微信号：<b>${CONFIG.wechatId}</b></div>
        <button class="btn-copy-wechat" id="modal-copy-wechat">复制微信号</button>
        <button class="modal-close" id="modal-close">先不解锁</button>
      </div>`;
    document.body.appendChild(mask);
    document.getElementById('modal-close').addEventListener('click', () => mask.classList.remove('show'));
    document.getElementById('modal-copy-wechat').addEventListener('click', copyWechat);
  }
  mask.classList.add('show');
}

// ---------- Toast ----------
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:rgba(61,44,35,0.92);color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:200;max-width:80%;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, 2200);
}
