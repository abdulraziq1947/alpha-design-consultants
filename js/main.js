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

// Soft hero parallax (home only)
const hero = document.querySelector(".hero");
if (hero && !reduceMotion) {
  window.addEventListener(
    "scroll",
    () => {
      const y = Math.min(window.scrollY, 420);
      hero.style.setProperty("--hero-shift", `${y * 0.22}px`);
    },
    { passive: true }
  );
}

// Hero entrance cascade on load
if (!reduceMotion) {
  const heroBits = document.querySelectorAll(
    ".hero__badge, .hero h1, .hero p, .hero__actions, .page-hero .breadcrumb, .page-hero h1, .page-hero p"
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

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
