// ============================================================
// 特效模块（零依赖 Canvas）
// 1. 全局漂浮粒子背景
// 2. 结果页庆祝粒子
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
