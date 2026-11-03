document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile navigation toggle
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Header gains depth after a short scroll
const header = document.querySelector(".header");
if (header) {
  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

// Thin page progress bar
const progress = document.createElement("div");
progress.className = "scroll-progress";
progress.setAttribute("aria-hidden", "true");
document.body.appendChild(progress);

function syncProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
}
window.addEventListener("scroll", syncProgress, { passive: true });
window.addEventListener("resize", syncProgress);
syncProgress();

// Soft hero parallax + interactive structural frame
const hero = document.querySelector(".hero");
if (hero) {
  if (!reduceMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const y = Math.min(window.scrollY, 420);
        hero.style.setProperty("--hero-shift", `${y * 0.22}px`);
      },
      { passive: true }
    );
  }

  (function initHeroStructure() {
    const canvas = document.getElementById("hero-structure");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const coordEl = document.getElementById("hero-coord");
    const elevs = hero.querySelectorAll(".hero__elevations span");
    const floors = 5;
    const colsX = 4;
    const colsZ = 3;
    const floorH = 1.05;
    const width = 3.2;
    const depth = 2.35;

    let angle = 0.72;
    let targetAngle = angle;
    let tilt = 0.12;
    let targetTilt = tilt;
    let activeFloor = 0;
    let targetFloor = 0;
    let mx = 0.55;
    let my = 0.45;
    let build = reduceMotion ? 1 : 0;
    let running = true;
    let last = performance.now();

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width);
      const h = Math.max(300, rect.height || w * 0.82);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function project(x, y, z) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const xr = x * c - z * s;
      const zr = x * s + z * c;
      const scale = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.125;
      const cx = canvas.clientWidth * 0.58;
      const cy = canvas.clientHeight * 0.74;
      return {
        x: cx + (xr - zr) * scale * 0.88,
        y: cy - (y + tilt) * scale * 1.08 - (xr + zr) * scale * 0.3,
      };
    }

    function strokePoly(points, color, lineWidth = 1, dash = null) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash || []);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function fillPoly(points, color) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function gridPoint(i, j, level) {
      const x = -width / 2 + (i / (colsX - 1)) * width;
      const z = -depth / 2 + (j / (colsZ - 1)) * depth;
      return project(x, level * floorH, z);
    }

    function drawFloor(level, accent) {
      const corners = [
        gridPoint(0, 0, level),
        gridPoint(colsX - 1, 0, level),
        gridPoint(colsX - 1, colsZ - 1, level),
        gridPoint(0, colsZ - 1, level),
      ];
      if (accent) {
        fillPoly(corners, "rgba(232, 123, 62, 0.12)");
        strokePoly(corners, "rgba(232, 123, 62, 0.95)", 1.7);
      } else {
        strokePoly(corners, "rgba(214, 226, 236, 0.26)", 1);
      }
      for (let i = 1; i < colsX - 1; i++) {
        strokePoly(
          [gridPoint(i, 0, level), gridPoint(i, colsZ - 1, level)],
          accent ? "rgba(232, 123, 62, 0.4)" : "rgba(214, 226, 236, 0.12)",
          0.9
        );
      }
      for (let j = 1; j < colsZ - 1; j++) {
        strokePoly(
          [gridPoint(0, j, level), gridPoint(colsX - 1, j, level)],
          accent ? "rgba(232, 123, 62, 0.4)" : "rgba(214, 226, 236, 0.12)",
          0.9
        );
      }
    }

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w * 0.55, h * 0.78, 8, w * 0.55, h * 0.78, w * 0.4);
      glow.addColorStop(0, "rgba(232, 123, 62, 0.1)");
      glow.addColorStop(1, "rgba(232, 123, 62, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // foundation
      const pad = 0.32;
      const foundation = [
        project(-width / 2 - pad, -0.08, -depth / 2 - pad),
        project(width / 2 + pad, -0.08, -depth / 2 - pad),
        project(width / 2 + pad, -0.08, depth / 2 + pad),
        project(-width / 2 - pad, -0.08, depth / 2 + pad),
      ];
      fillPoly(foundation, "rgba(232, 123, 62, 0.05)");
      strokePoly(foundation, "rgba(232, 123, 62, 0.8)", 1.5);
      strokePoly(
        [project(-width / 2, -0.08, 0), project(width / 2, -0.08, 0)],
        "rgba(232, 123, 62, 0.3)",
        1,
        [4, 4]
      );

      const top = Math.max(0, Math.min(floors - 1, Math.ceil(build * (floors - 1))));
      for (let i = 0; i < colsX; i++) {
        for (let j = 0; j < colsZ; j++) {
          const a = gridPoint(i, j, 0);
          const b = gridPoint(i, j, top);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(226, 235, 244, 0.55)";
          ctx.lineWidth = 1.15;
          ctx.stroke();
        }
      }

      for (let level = 0; level <= top; level++) {
        drawFloor(level, Math.abs(level - activeFloor) < 0.55);
      }

      elevs.forEach((el) => {
        const level = Number(el.getAttribute("data-level"));
        el.classList.toggle("is-active", level === Math.round(activeFloor));
      });

      if (coordEl) {
        const x = (8 + mx * 8).toFixed(2);
        const y = (activeFloor * 3.3).toFixed(2);
        const z = (4 + my * 8).toFixed(2);
        coordEl.textContent = `X ${x} · Y ${y} · Z ${z}`;
      }
    }

    function tick(ts) {
      if (!running) return;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (!reduceMotion) {
        angle += (targetAngle - angle) * Math.min(1, dt * 4) + dt * 0.05;
        tilt += (targetTilt - tilt) * Math.min(1, dt * 4);
        activeFloor += (targetFloor - activeFloor) * Math.min(1, dt * 5);
        build = Math.min(1, build + dt * 0.45);
        // idle drift when pointer is away
        targetAngle += dt * 0.04;
      }

      hero.style.setProperty("--mx", mx.toFixed(3));
      hero.style.setProperty("--my", my.toFixed(3));
      draw();
      requestAnimationFrame(tick);
    }

    function onPointer(clientX, clientY) {
      const rect = hero.getBoundingClientRect();
      mx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      my = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      targetAngle = 0.45 + mx * 0.9;
      targetTilt = (0.5 - my) * 0.45;
      targetFloor = (1 - my) * (floors - 1);
    }

    resize();
    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      hero.addEventListener(
        "pointermove",
        (e) => {
          onPointer(e.clientX, e.clientY);
        },
        { passive: true }
      );
      hero.addEventListener(
        "pointerleave",
        () => {
          targetFloor = 0;
          targetTilt = 0.12;
        },
        { passive: true }
      );
    }

    const stage = canvas.closest(".hero");
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            running = entry.isIntersecting;
            if (running) {
              last = performance.now();
              requestAnimationFrame(tick);
            }
          });
        },
        { threshold: 0.15 }
      );
      obs.observe(stage);
    } else {
      requestAnimationFrame(tick);
    }

    draw();
  })();
}

// Hero entrance cascade on load
if (!reduceMotion) {
  const heroBits = document.querySelectorAll(
    ".hero__badge, .hero h1, .hero p, .hero__actions, .hero__chips, .hero__visual, .page-hero .breadcrumb, .page-hero h1, .page-hero p"
  );
  heroBits.forEach((el, i) => {
    el.classList.add("enter");
    el.style.setProperty("--enter-delay", `${80 + i * 90}ms`);
    requestAnimationFrame(() => el.classList.add("is-in"));
  });
}

// Scroll reveals: sections first, then staggered children
const sectionTargets = document.querySelectorAll(".section > .container, .cta > .container, .stats > .container");
sectionTargets.forEach((el) => el.classList.add("fade-up"));

const staggerSelectors = [
  ".card",
  ".project-card",
  ".authority",
  ".stat",
  ".office-gallery__item",
  ".feature",
  ".service-block",
  ".step",
  ".value-card",
  ".leader-card",
  ".contact-card",
  ".office-card",
].join(", ");

document.querySelectorAll(".grid, .authority-row, .stats__grid, .office-gallery, .feature-list, .steps").forEach((group) => {
  [...group.children].forEach((el, i) => {
    if (!el.matches(staggerSelectors)) return;
    el.classList.add("reveal-item");
    el.style.setProperty("--stagger", `${i * 70}ms`);
  });
});

document.querySelectorAll(staggerSelectors).forEach((el) => {
  if (el.classList.contains("reveal-item")) return;
  el.classList.add("reveal-item");
  el.style.setProperty("--stagger", "0ms");
});

function reveal(el) {
  el.classList.add("is-visible");
}

if ("IntersectionObserver" in window) {
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        fadeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
  );

  const itemObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        itemObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
  );

  sectionTargets.forEach((el) => fadeObserver.observe(el));
  document.querySelectorAll(".reveal-item").forEach((el) => itemObserver.observe(el));
} else {
  sectionTargets.forEach(reveal);
  document.querySelectorAll(".reveal-item").forEach(reveal);
}

if (reduceMotion) {
  document.querySelectorAll(".fade-up, .reveal-item, .enter").forEach(reveal);
  document.querySelectorAll(".enter").forEach((el) => el.classList.add("is-in"));
}

// Count-up for the stats strip
const statValues = document.querySelectorAll(".stat__value");

function animateCount(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = parseInt(match[1], 10);
  const suffix = match[2];
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (statValues.length && "IntersectionObserver" in window && !reduceMotion) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.55 }
  );
  statValues.forEach((el) => statObserver.observe(el));
}

// Animated structural wireframe (homepage)
(function initStructureModel() {
  const canvas = document.getElementById("structure-model");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const scaleLabels = document.querySelectorAll(".model-stage__scale span");
  const floors = 5;
  const colsX = 4;
  const colsZ = 3;
  const floorH = 1.05;
  const width = 3.4;
  const depth = 2.5;

  let angle = 0.55;
  let activeFloor = 0;
  let build = reduceMotion ? 1 : 0;
  let running = false;
  let last = 0;
  let visible = false;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(280, w * 0.72);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.height = `${h}px`;
  }

  function project(x, y, z) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const xr = x * c - z * s;
    const zr = x * s + z * c;
    const scale = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.118;
    const cx = canvas.clientWidth * 0.58;
    const cy = canvas.clientHeight * 0.72;
    return {
      x: cx + (xr - zr) * scale * 0.86,
      y: cy - y * scale * 1.05 - (xr + zr) * scale * 0.28,
    };
  }

  function strokePoly(points, color, width = 1, dash = null) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function fillPoly(points, color) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function gridPoint(i, j, level) {
    const x = -width / 2 + (i / (colsX - 1)) * width;
    const z = -depth / 2 + (j / (colsZ - 1)) * depth;
    const y = level * floorH;
    return project(x, y, z);
  }

  function drawFloorSlab(level, accent) {
    const corners = [
      gridPoint(0, 0, level),
      gridPoint(colsX - 1, 0, level),
      gridPoint(colsX - 1, colsZ - 1, level),
      gridPoint(0, colsZ - 1, level),
    ];
    if (accent) {
      fillPoly(corners, "rgba(232, 123, 62, 0.10)");
      strokePoly(corners, "rgba(232, 123, 62, 0.95)", 1.8);
    } else {
      strokePoly(corners, "rgba(214, 226, 236, 0.28)", 1);
    }

    for (let i = 1; i < colsX - 1; i++) {
      strokePoly(
        [gridPoint(i, 0, level), gridPoint(i, colsZ - 1, level)],
        accent ? "rgba(232, 123, 62, 0.45)" : "rgba(214, 226, 236, 0.14)",
        accent ? 1.1 : 0.8
      );
    }
    for (let j = 1; j < colsZ - 1; j++) {
      strokePoly(
        [gridPoint(0, j, level), gridPoint(colsX - 1, j, level)],
        accent ? "rgba(232, 123, 62, 0.45)" : "rgba(214, 226, 236, 0.14)",
        accent ? 1.1 : 0.8
      );
    }
  }

  function drawFoundation() {
    const pad = 0.35;
    const corners = [
      project(-width / 2 - pad, -0.08, -depth / 2 - pad),
      project(width / 2 + pad, -0.08, -depth / 2 - pad),
      project(width / 2 + pad, -0.08, depth / 2 + pad),
      project(-width / 2 - pad, -0.08, depth / 2 + pad),
    ];
    fillPoly(corners, "rgba(232, 123, 62, 0.06)");
    strokePoly(corners, "rgba(232, 123, 62, 0.85)", 1.6);
    strokePoly(
      [
        project(-width / 2, -0.08, 0),
        project(width / 2, -0.08, 0),
      ],
      "rgba(232, 123, 62, 0.35)",
      1,
      [5, 5]
    );
    strokePoly(
      [
        project(0, -0.08, -depth / 2),
        project(0, -0.08, depth / 2),
      ],
      "rgba(232, 123, 62, 0.35)",
      1,
      [5, 5]
    );
  }

  function drawFrame(maxLevel) {
    const top = Math.max(0, Math.min(floors - 1, maxLevel));
    for (let i = 0; i < colsX; i++) {
      for (let j = 0; j < colsZ; j++) {
        const base = gridPoint(i, j, 0);
        const tip = gridPoint(i, j, top);
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = "rgba(226, 235, 244, 0.55)";
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }
    }

    for (let level = 0; level <= top; level++) {
      const accent = Math.abs(level - activeFloor) < 0.55;
      drawFloorSlab(level, accent);
    }
  }

  function syncLabels() {
    scaleLabels.forEach((el) => {
      const level = Number(el.getAttribute("data-level"));
      el.classList.toggle("is-active", level === Math.round(activeFloor));
    });
  }

  function render(ts) {
    if (!running) return;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    if (!reduceMotion) {
      angle += dt * 0.18;
      build = Math.min(1, build + dt * 0.35);
      activeFloor = (activeFloor + dt * 0.55) % floors;
    }

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // soft ground glow
    const g = ctx.createRadialGradient(w * 0.55, h * 0.78, 10, w * 0.55, h * 0.78, w * 0.35);
    g.addColorStop(0, "rgba(232, 123, 62, 0.08)");
    g.addColorStop(1, "rgba(232, 123, 62, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    drawFoundation();
    const revealed = Math.max(0, Math.ceil(build * (floors - 1)));
    drawFrame(revealed);
    syncLabels();

    if (!reduceMotion) requestAnimationFrame(render);
    else running = false;
  }

  function start() {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(render);
  }

  function stop() {
    running = false;
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (!running && visible) {
      // one static redraw when paused
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      drawFoundation();
      drawFrame(floors);
      syncLabels();
    }
  });

  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(canvas.closest(".model-stage") || canvas);
  } else {
    visible = true;
    start();
  }

  // initial static frame for reduced motion / before first paint
  drawFoundation();
  drawFrame(floors);
  syncLabels();
})();

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
