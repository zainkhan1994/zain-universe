/* Hero: particles scatter, then assemble into "AI SYSTEMS BUILDER".
   The cursor pushes them away; a click sends a shockwave. Plain canvas, no libraries. */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]still=1/.test(location.search); // ?still=1 renders the assembled state (used for README screenshots)
  let W = 0, H = 0, dpr = 1, parts = [], stars = [], visible = true, raf = 0, t0 = performance.now(), last = performance.now();
  const mouse = { x: -9999, y: -9999 };
  const COLORS = [[0, 212, 255], [255, 215, 0], [255, 107, 53]];

  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function colorAt(t) { return t < .5 ? mix(COLORS[0], COLORS[1], t * 2) : mix(COLORS[1], COLORS[2], (t - .5) * 2); }

  function sampleText() {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d", { willReadFrequently: true });
    const font = (px) => `800 ${px}px Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    const lines = ["AI SYSTEMS", "BUILDER"];
    o.font = font(100);
    const w100 = o.measureText(lines[0]).width;
    const fs = Math.min((W * 0.84) / (w100 / 100), H * 0.18);
    o.font = font(fs);
    o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
    const cy = H * 0.31;
    o.fillText(lines[0], W / 2, cy - fs * 0.52);
    o.fillText(lines[1], W / 2, cy + fs * 0.52);
    const step = Math.max(3, Math.round(fs / 24));
    const data = o.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
      }
    }
    return { pts, step };
  }

  function build() {
    const { pts, step } = sampleText();
    const max = W < 700 ? 1600 : 3400;
    const stride = Math.max(1, Math.ceil(pts.length / max));
    parts = [];
    for (let i = 0; i < pts.length; i += stride) {
      const [tx, ty] = pts[i];
      const ang = Math.random() * Math.PI * 2, r = Math.max(W, H) * (0.6 + Math.random() * 0.6);
      parts.push({
        x: reduce ? tx : W / 2 + Math.cos(ang) * r, y: reduce ? ty : H / 2 + Math.sin(ang) * r,
        tx, ty, vx: 0, vy: 0, delay: Math.random() * 1.4, ph: Math.random() * 6.28,
        s: step * 0.72 + Math.random() * 0.8, c: colorAt(tx / W)
      });
    }
    stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random(), tw: Math.random() * 6.28
    }));
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    t0 = performance.now();
    if (reduce) draw(performance.now());
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const dt = Math.max(0.5, Math.min(4, (now - last) / 16.7)); last = now;
    const damp = Math.pow(0.86, dt);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const s of stars) {
      const a = 0.25 + 0.25 * Math.sin(t * 0.8 + s.tw);
      ctx.fillStyle = `rgba(180,210,255,${a * (0.3 + s.z)})`;
      ctx.fillRect(s.x, (s.y + t * 4 * (0.3 + s.z)) % H, 1 + s.z, 1 + s.z);
    }
    for (const p of parts) {
      if (!reduce) {
        if (t > p.delay) {
          const k = 0.045 + (1 - p.delay / 1.4) * 0.01;
          p.vx += (p.tx - p.x) * k * dt; p.vy += (p.ty - p.y) * k * dt;
        }
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 110;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 5.5;
          p.vx += (dx / d) * f * dt; p.vy += (dy / d) * f * dt;
        }
        p.vx *= damp; p.vy *= damp;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      const sh = reduce ? 0 : Math.sin(t * 1.6 + p.ph) * 0.6;
      const glow = 0.55 + 0.35 * Math.sin(t * 2 + p.ph);
      ctx.fillStyle = `rgba(${p.c[0] | 0},${p.c[1] | 0},${p.c[2] | 0},${glow})`;
      ctx.fillRect(p.x + sh - p.s / 2, p.y + sh - p.s / 2, p.s, p.s);
    }
  }

  function loop(now) {
    if (visible) draw(now);
    raf = requestAnimationFrame(loop);
  }

  function burst(x, y) {
    for (const p of parts) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / 420) * 22;
      p.vx += (dx / d) * f; p.vy += (dy / d) * f;
    }
  }

  const rectXY = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", (e) => { [mouse.x, mouse.y] = rectXY(e); });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  hero.addEventListener("pointerdown", (e) => { const [x, y] = rectXY(e); if (!reduce) burst(x, y); });

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 180); });
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);

  layout();
  if (!reduce) raf = requestAnimationFrame(loop);
})();
