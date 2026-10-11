/* The Universe: every project as a star in a draggable 3D map, grouped into five clusters.
   Plain canvas with a hand-rolled perspective projection. Content comes from js/data.js. */
(function () {
  const D = window.UNIVERSE;
  const canvas = document.getElementById("uni-canvas");
  if (!D || !canvas) return;
  const ctx = canvas.getContext("2d");
  const tip = document.getElementById("uni-tip");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- deterministic layout ----------
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const hubs = {};
  D.clusters.forEach((c, i) => {
    const a = (i / D.clusters.length) * Math.PI * 2 + 0.4;
    const y = [0.35, -0.3, 0.2, -0.4, 0.05][i % 5];
    hubs[c.id] = { id: c.id, name: c.name, color: c.color, x: Math.cos(a) * 1.35, y: y * 1.5, z: Math.sin(a) * 1.35, hub: true };
  });
  const nodes = D.projects.map((p) => {
    const h = hubs[p.cluster], r = rng(hash(p.id));
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rad = 0.3 + r() * 0.34, s = Math.sqrt(1 - u * u);
    return { ...p, color: h.color, hubRef: h, x: h.x + s * Math.cos(th) * rad, y: h.y + u * rad * 0.9, z: h.z + s * Math.sin(th) * rad, hub: false, sx: 0, sy: 0, sr: 0, depth: 0 };
  });
  const dust = Array.from({ length: 220 }, (_, i) => { const r = rng(i * 7919 + 13); const u = r() * 2 - 1, th = r() * 6.283, rad = 1.5 + r() * 1.6, s = Math.sqrt(1 - u * u); return { x: s * Math.cos(th) * rad, y: u * rad * 0.8, z: s * Math.sin(th) * rad, a: 0.15 + r() * 0.35 }; });

  // ---------- glow sprites ----------
  const sprites = {};
  function sprite(color) {
    if (sprites[color]) return sprites[color];
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "#fff"); grd.addColorStop(0.18, color); grd.addColorStop(0.45, color + "55"); grd.addColorStop(1, color + "00");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return (sprites[color] = c);
  }

  // ---------- state ----------
  let W = 0, H = 0, dpr = 1, yaw = 0.6, pitch = -0.25, vyaw = reduce ? 0 : 0.0018, vpitch = 0;
  let tgt = null, drag = null, moved = 0, hover = null, selected = null, visible = true;
  const active = new Set(D.clusters.map((c) => c.id));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(o) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = o.x * cy + o.z * sy, z1 = -o.x * sy + o.z * cy;
    const y2 = o.y * cp - z1 * sp, z2 = o.y * sp + z1 * cp;
    const fov = 3.2, p = fov / (fov + z2 + 1.2), S = Math.min(W, H) * 0.31;
    return { x: W / 2 + x1 * p * S, y: H / 2 + y2 * p * S, p, z: z2 };
  }

  // ---------- render ----------
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    // motion
    if (tgt) {
      const dy = ((tgt.yaw - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      yaw += dy * 0.09; pitch += (tgt.pitch - pitch) * 0.09;
      if (Math.abs(dy) < 0.002 && Math.abs(tgt.pitch - pitch) < 0.002) tgt = null;
    } else if (!drag) {
      yaw += vyaw; pitch += vpitch; vpitch *= 0.95;
      if (!reduce && !selected && !hover) vyaw += (0.0018 - vyaw) * 0.02; else vyaw *= 0.94;
    }
    pitch = Math.max(-1.1, Math.min(1.1, pitch));

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    // dust
    for (const d of dust) {
      const q = project(d); if (q.p < 0.3) continue;
      ctx.fillStyle = `rgba(170,200,255,${d.a * q.p})`;
      ctx.fillRect(q.x, q.y, 1.4, 1.4);
    }
    // project everything
    const all = [];
    for (const h of Object.values(hubs)) { const q = project(h); h.sx = q.x; h.sy = q.y; h.depth = q.z; h.sr = q.p; all.push(h); }
    for (const n of nodes) { const q = project(n); n.sx = q.x; n.sy = q.y; n.depth = q.z; n.sr = q.p; all.push(n); }
    all.sort((a, b) => b.depth - a.depth);

    // hub ring
    const hs = D.clusters.map((c) => hubs[c.id]);
    ctx.lineWidth = 1;
    for (let i = 0; i < hs.length; i++) {
      const a = hs[i], b = hs[(i + 1) % hs.length];
      ctx.strokeStyle = "rgba(143,163,184,.12)";
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
    // edges
    for (const n of nodes) {
      const on = active.has(n.cluster); if (!on) continue;
      const h = n.hubRef, a = 0.12 + 0.25 * Math.max(0, Math.min(1, n.sr - 0.55));
      ctx.strokeStyle = hexA(n.color, selected && selected.id === n.id ? 0.8 : a);
      ctx.lineWidth = selected && selected.id === n.id ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(h.sx, h.sy); ctx.lineTo(n.sx, n.sy); ctx.stroke();
    }
    // bodies
    for (const o of all) {
      if (!o.hub && !active.has(o.cluster)) continue;
      if (o.hub && !active.has(o.id)) continue;
      const depthFade = Math.max(0.35, Math.min(1, o.sr * 0.95));
      const isSel = selected && selected.id === o.id, isHover = hover && hover.id === o.id;
      let size = (o.hub ? 46 : 22) * o.sr * (isSel ? 1.7 : isHover ? 1.45 : 1);
      if (isSel && !reduce) size *= 1 + 0.08 * Math.sin(performance.now() / 260);
      ctx.globalAlpha = depthFade;
      const c = o.hub ? o.color : o.color;
      ctx.drawImage(sprite(c), o.sx - size, o.sy - size, size * 2, size * 2);
      if (o.live) { ctx.globalAlpha = depthFade; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(o.sx, o.sy, 1.8 * o.sr + 0.6, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
    // labels
    ctx.textAlign = "center";
    for (const h of hs) {
      if (!active.has(h.id)) continue;
      ctx.font = `600 ${Math.round(11 + h.sr * 3)}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = hexA(h.color, Math.max(0.35, h.sr - 0.2));
      ctx.fillText(h.name.toUpperCase(), h.sx, h.sy - 30 * h.sr - 6);
    }
    if (selected) {
      ctx.font = "600 13px Inter, system-ui, sans-serif"; ctx.fillStyle = "#fff";
      ctx.fillText(selected.name, selected.sx, selected.sy - 34 * selected.sr - 4);
    }
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  // ---------- picking ----------
  function pick(mx, my) {
    let best = null, bd = 18;
    for (const n of nodes) {
      if (!active.has(n.cluster)) continue;
      const d = Math.hypot(n.sx - mx, n.sy - my) - n.sr * 4;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  const xy = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY }; moved = 0; tgt = null; canvas.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", (e) => {
    const [mx, my] = xy(e);
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.006; pitch += dy * 0.006; vyaw = dx * 0.0016; vpitch = dy * 0.0016;
      drag.x = e.clientX; drag.y = e.clientY;
    }
    hover = pick(mx, my);
    if (hover && !drag) {
      tip.hidden = false; tip.textContent = hover.name; tip.style.left = mx + "px"; tip.style.top = my + "px"; canvas.style.cursor = "pointer";
    } else { tip.hidden = true; canvas.style.cursor = ""; }
  });
  canvas.addEventListener("pointerup", (e) => {
    canvas.classList.remove("grabbing");
    if (drag && moved < 6) { const [mx, my] = xy(e); const n = pick(mx, my); if (n) select(n.id); }
    drag = null;
  });
  canvas.addEventListener("pointerleave", () => { hover = null; tip.hidden = true; });
  canvas.addEventListener("wheel", (e) => { if (e.shiftKey) { e.preventDefault(); vyaw += e.deltaY * 0.0002; } }, { passive: false });

  // ---------- panel, legend, list ----------
  const $ = (id) => document.getElementById(id);
  const clusterOf = (id) => D.clusters.find((c) => c.id === id);
  function select(id, fromList) {
    const n = byId[id]; if (!n) return;
    selected = n;
    if (!active.has(n.cluster)) { active.add(n.cluster); syncLegend(); }
    // rotate to face the node
    const x = n.x, z = n.z;
    const ty = Math.atan2(-x, z);
    const z1 = -x * Math.sin(ty) + z * Math.cos(ty);
    tgt = { yaw: ty, pitch: Math.max(-0.6, Math.min(0.6, Math.atan2(n.y, z1) * 0.8)) };
    const c = clusterOf(n.cluster);
    $("p-cluster").textContent = c.name; $("p-cluster").style.color = c.color;
    $("p-title").textContent = n.name; $("p-blurb").textContent = n.blurb;
    $("p-stack").innerHTML = n.stack.map((s) => `<li>${s}</li>`).join("");
    $("p-date").textContent = "First commit: " + n.date;
    const a = $("p-live");
    if (n.live) { a.href = n.live; a.hidden = false; } else { a.hidden = true; }
    if (fromList) canvas.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  function buildLegend() {
    const el = $("uni-legend");
    el.innerHTML = D.clusters.map((c) => `<button type="button" data-c="${c.id}" aria-pressed="true" style="--c:${c.color}"><i></i>${c.name}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const id = b.dataset.c;
      if (active.has(id)) { if (active.size > 1) active.delete(id); } else active.add(id);
      if (selected && !active.has(selected.cluster)) selected = null;
      syncLegend();
    });
  }
  function syncLegend() { document.querySelectorAll("#uni-legend button").forEach((b) => b.setAttribute("aria-pressed", active.has(b.dataset.c))); }
  function buildList() {
    $("uni-list").innerHTML = nodes.map((n) => `<button type="button" data-id="${n.id}" style="--c:${n.color}">${n.name}</button>`).join("");
    $("uni-list").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) select(b.dataset.id, true); });
  }

  buildLegend(); buildList(); resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  requestAnimationFrame(frame);
  window.UNIVERSE_SELECT = select;
})();
