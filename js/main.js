/* Page behaviour: reveals, counters, work cards, timeline, rhythm chart, toolbox, contact. */
(function () {
  const D = window.UNIVERSE;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  // ---------- reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  const observe = (el) => io.observe(el);
  document.querySelectorAll(".reveal").forEach(observe);

  // ---------- counters ----------
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, dur = 1600, t0 = performance.now();
      if (reduce) { el.textContent = end; return; }
      (function tick(now) {
        const t = Math.min(1, (now - t0) / dur), v = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(end * v);
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  if (window.matchMedia('(hover: none)').matches) { const h = document.querySelector('.hint'); if (h) h.lastChild.textContent = ' Touch and drag through the particles. Scroll to explore.'; }

  // ---------- progress bar, cursor glow, nav highlight ----------
  const bar = document.querySelector(".progress span"), glow = document.querySelector(".cursor-glow");
  function onScroll() {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + "%";
    updateTimeline();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", (e) => { glow.style.opacity = 1; glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`; }, { passive: true });
  const links = [...document.querySelectorAll(".nav nav a")];
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); });
  }, { threshold: 0.35 });
  ["universe", "work", "journey", "rhythm", "contact"].forEach((id) => sio.observe($(id)));

  // ---------- work cards ----------
  const ART = {
    neuro: (h) => `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="a${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1d2d"/><stop offset="1" stop-color="#1b5e75"/></linearGradient></defs><rect width="320" height="180" fill="url(#a${h})"/>${grid(60, 8, "#00d4ff")}${net(h, "#00d4ff")}</svg>`,
    space: (h) => `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#050b14"/>${stars(h)}<circle cx="215" cy="100" r="58" fill="#0a3d62"/><ellipse cx="215" cy="100" rx="58" ry="58" fill="none" stroke="#00d4ff" stroke-opacity=".5"/><ellipse cx="215" cy="100" rx="58" ry="18" fill="none" stroke="#ffd700" stroke-opacity=".6"/><ellipse cx="215" cy="100" rx="22" ry="58" fill="none" stroke="#ffd700" stroke-opacity=".35"/><circle cx="262" cy="62" r="5" fill="#ff6b35"/></svg>`,
    hub: (h) => `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#0b1d2d"/>${[0, 1, 2].map((i) => `<rect x="${40 + i * 84}" y="${46 + (i % 2) * 14}" width="72" height="88" rx="10" fill="rgba(255,255,255,.05)" stroke="#ff6b35" stroke-opacity="${0.4 + i * 0.2}"/><rect x="${52 + i * 84}" y="${60 + (i % 2) * 14}" width="48" height="6" rx="3" fill="#ffd700" opacity=".8"/><rect x="${52 + i * 84}" y="${74 + (i % 2) * 14}" width="36" height="4" rx="2" fill="#8fa3b8"/><rect x="${52 + i * 84}" y="${84 + (i % 2) * 14}" width="42" height="4" rx="2" fill="#8fa3b8"/>`).join("")}</svg>`
  };
  function grid(step, n, c) { let s = ""; for (let i = 1; i < n; i++) s += `<path d="M${i * step} 0V180M0 ${i * step * 0.56}H320" stroke="${c}" stroke-opacity=".08"/>`; return s; }
  function prng(seed) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }
  function net(h, c) { const r = prng(h + 7); const pts = Array.from({ length: 16 }, () => [20 + r() * 280, 16 + r() * 148]); let s = ""; pts.forEach((p, i) => { const q = pts[(i * 5 + 3) % pts.length]; s += `<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" stroke="${c}" stroke-opacity=".3"/>`; }); pts.forEach((p) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#ffd700"/><circle cx="${p[0]}" cy="${p[1]}" r="8" fill="${c}" opacity=".15"/>`; }); return s; }
  function stars(h) { const r = prng(h + 3); let s = ""; for (let i = 0; i < 70; i++) s += `<circle cx="${r() * 320}" cy="${r() * 180}" r="${0.5 + r() * 1.1}" fill="#fff" opacity="${0.3 + r() * 0.6}"/>`; return s; }

  const cards = $("cards");
  const byId = Object.fromEntries(D.projects.map((p) => [p.id, p]));
  D.featured.forEach((f, i) => {
    const proj = byId[f.id] || {};
    const el = document.createElement("article");
    el.className = "card reveal"; el.style.transitionDelay = i * 70 + "ms";
    const shot = f.img ? `<img src="${f.img}" alt="Screenshot of ${f.title}" loading="lazy" width="1280" height="720">` : ART[f.art](i + 1);
    el.innerHTML = `<div class="shot">${shot}</div><div class="body"><p class="k">${f.kicker}</p><h3>${f.title}</h3><p>${f.line}</p>
      <ul class="chips">${f.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
      ${proj.live ? `<a class="live" href="${proj.live}" target="_blank" rel="noopener">Open live site ↗</a>` : ""}</div><span class="glare"></span>`;
    cards.appendChild(el); observe(el);
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 8}deg) translateZ(0)`;
        el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    }
  });

  // ---------- timeline ----------
  const tl = $("timeline");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  tl.innerHTML = '<span class="fill" aria-hidden="true"></span>' + D.timeline.map((t) => {
    const [y, m] = t.when.split("-");
    return `<li class="t-item"><time datetime="${t.when}">${MONTHS[+m - 1]} ${y}</time><h3>${t.title}</h3><p>${t.text}</p></li>`;
  }).join("");
  const items = [...tl.querySelectorAll(".t-item")], fill = tl.querySelector(".fill");
  items.forEach(observe);
  function updateTimeline() {
    const r = tl.getBoundingClientRect(), vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
    fill.style.height = p * (r.height - 12) + "px";
  }

  // ---------- rhythm chart ----------
  const chart = $("chart");
  fetch("data/rhythm.json").then((r) => r.json()).then((d) => {
    const max = Math.max(...d.series.map((s) => s[1]));
    chart.innerHTML = d.series.map(([k, v]) => {
      const [y, m] = k.split("-");
      const label = (+m === 1 || +m === 6 || k === d.series[0][0] || k === d.series[d.series.length - 1][0]) ? `${MONTHS[+m - 1]} ${y.slice(2)}` : "";
      return `<div class="bar" title="${MONTHS[+m - 1]} ${y}: ${v} commits"><i data-h="${(v / max) * 100}"></i><span class="v">${v}</span><em>${label}</em></div>`;
    }).join("");
    const cio2 = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return; cio2.disconnect();
      chart.querySelectorAll("i").forEach((i, idx) => setTimeout(() => { i.style.height = i.dataset.h + "%"; }, reduce ? 0 : idx * 35));
    }, { threshold: 0.3 });
    cio2.observe(chart);
  }).catch(() => { chart.textContent = "Chart data unavailable."; });

  // ---------- toolbox & contact ----------
  $("stack").innerHTML = D.stack.map((s, i) => `<li style="--d:${(i % 7) * 0.45}s">${s}</li>`).join("");
  $("contact-links").innerHTML = D.contact.map((c) => `<a href="${c.href}"${c.href.startsWith("mailto") ? "" : ' target="_blank" rel="noopener"'}>${c.label}</a>`).join("");

  onScroll();
})();
