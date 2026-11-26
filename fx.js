// ============================================================
// 特效模块（零依赖 Canvas）
// 1. 全局漂浮粒子背景
// 2. 四维性格雷达图（蛛网图）
// 3. 结果页庆祝粒子
// ============================================================

// ---------- 全局粒子背景 ----------
function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const COLORS = ['#FF8A5C', '#FFC145', '#FFB199', '#FFD9A0', '#FF9F7F', '#FFC9B8'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const celeb = document.getElementById('celeb-canvas');
    if (celeb) { celeb.width = window.innerWidth; celeb.height = window.innerHeight; }
  }
  resize();
  window.addEventListener('resize', resize);

  const N = Math.max(14, Math.min(28, Math.floor(w / 42)));
  const particles = [];
  for (let i = 0; i < N; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 4 + Math.random() * 16,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: 0.05 + Math.random() * 0.12,
      vy: 0.12 + Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y -= p.vy;
      p.x += p.vx + Math.sin(p.phase) * 0.25;
      p.phase += 0.012;
      if (p.y < -40) { p.y = h + 40; p.x = Math.random() * w; }
      if (p.x < -40) p.x = w + 40;
      if (p.x > w + 40) p.x = -40;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.globalAlpha = p.a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();
}

// ---------- 四维性格雷达图 ----------
// totals: { EI, NS, FT, PJ } 每项 -18..+18（正=偏 left 极，负=偏 right 极）
function drawRadar(canvas, totals) {
  const meta = [
    { key: 'EI', left: 'E', right: 'I', leftName: '外向', rightName: '内向', angle: 0 },
    { key: 'NS', left: 'N', right: 'S', leftName: '好奇', rightName: '安稳', angle: -Math.PI / 2 },
    { key: 'FT', left: 'F', right: 'T', leftName: '粘人', rightName: '独立', angle: Math.PI },
    { key: 'PJ', left: 'P', right: 'J', leftName: '随性', rightName: '规律', angle: Math.PI / 2 },
  ];

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 320;
  const cssH = canvas.clientHeight || 320;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = cssW / 2;
  const cy = cssH / 2;
  const R = Math.min(cssW, cssH) / 2 - 46;

  ctx.clearRect(0, 0, cssW, cssH);

  // 背景蛛网（外圈 + 中圈 + 十字轴）
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,138,92,0.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R / 2, 0, Math.PI * 2);
  ctx.stroke();

  meta.forEach(m => {
    const dx = Math.cos(m.angle), dy = Math.sin(m.angle);
    ctx.beginPath();
    ctx.moveTo(cx - dx * R, cy - dy * R);
    ctx.lineTo(cx + dx * R, cy + dy * R);
    ctx.stroke();
  });

  // 数据多边形
  const pts = meta.map(m => {
    const score = totals[m.key] || 0;
    const p = Math.max(0, Math.min(1, (score + 18) / 36)); // 0=完全right, 1=完全left
    const off = (p * 2 - 1) * R; // -R..+R，正=偏 left
    return { x: cx + Math.cos(m.angle) * off, y: cy + Math.sin(m.angle) * off };
  });

  const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
  grad.addColorStop(0, 'rgba(185,160,224,0.55)');
  grad.addColorStop(1, 'rgba(255,138,92,0.55)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,138,92,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 顶点光点
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8A5C';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,138,92,0.25)';
    ctx.fill();
  });

  // 轴端标注
  ctx.font = '12px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  meta.forEach(m => {
    const dx = Math.cos(m.angle), dy = Math.sin(m.angle);
    // left 极（正方向）
    let lx = cx + dx * (R + 26), ly = cy + dy * (R + 26);
    // right 极（负方向）
    let rx = cx - dx * (R + 26), ry = cy - dy * (R + 26);
    // 微调避免贴边
    if (m.angle === 0) { lx += 4; rx -= 4; }
    if (m.angle === Math.PI) { lx -= 4; rx += 4; }
    ctx.fillStyle = '#3D2C23';
    ctx.fillText(m.leftName + m.left, lx, ly);
    ctx.fillStyle = '#9B8577';
    ctx.fillText(m.rightName + m.right, rx, ry);
  });
}

// ---------- 结果页庆祝粒子（彩带/星星）----------
function burstCelebration(x, y, count) {
  const canvas = document.getElementById('celeb-canvas');
  if (!canvas) return;
  if (!canvas.width || canvas.width < 100) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  const ctx = canvas.getContext('2d');
  const COLORS = ['#FF8A5C', '#FFC145', '#5CB87A', '#B9A0E0', '#FF6B9D', '#4FC3F7'];
  const parts = [];
  for (let i = 0; i < (count || 40); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 6;
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 3,
      g: 0.25,
      life: 40 + Math.random() * 40,
      r: 2 + Math.random() * 4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  (function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive = true;
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(anim);
  })();
}
