import { SCORE_CONFIG } from "../data/scoring.config.js";
import { getSettings } from "./store.js";

export function setupThemeToggle() {
  const root = document.documentElement;
  const saved = localStorage.getItem("lck_theme");
  if (saved) root.dataset.theme = saved;
  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("lck_theme", next);
    });
  });
}

export function renderSiteChrome() {
  document.querySelectorAll("[data-club-name]").forEach(function (el) { el.textContent = SCORE_CONFIG.club.fullName; });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
}

export async function startCountdown() {
  const target = document.querySelector("[data-countdown]");
  if (!target) return;
  const settings = await getSettings();
  const deadline = new Date(settings.deadline);
  function tick() {
    const diff = deadline - new Date();
    if (diff <= 0 || settings.submissionsLocked) { target.textContent = "Submissions closed"; target.classList.add("is-closed"); return; }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    target.textContent = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }
  tick();
  setInterval(tick, 1000);
}

export function showToast(message, type) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.type = type || "info";
  toast.hidden = false;
  setTimeout(function () { toast.hidden = true; }, 4200);
}

export function navigation(active, prefix) {
  prefix = prefix || "";
  return '<a class="brand" href="' + prefix + 'index.html" aria-label="LCK Dreams home"><span class="brand-mark">LCK</span><span><strong>LCK Dreams</strong><small>World Cup 2026</small></span></a><nav aria-label="Primary navigation"><a class="' + (active === "predict" ? "active" : "") + '" href="' + prefix + 'index.html">Predict</a><a class="' + (active === "leaderboard" ? "active" : "") + '" href="' + prefix + 'leaderboard.html">Leaderboard</a><a class="' + (active === "rules" ? "active" : "") + '" href="' + prefix + 'rules.html">Rules</a><a class="' + (active === "prizes" ? "active" : "") + '" href="' + prefix + 'prizes.html">Prizes</a><a class="' + (active === "admin" ? "active" : "") + '" href="' + prefix + 'admin/index.html">Admin</a><button class="icon-button" type="button" data-theme-toggle aria-label="Toggle dark mode">◐</button></nav>';
}

export function footer() {
  return '<p>© <span data-year></span> Leo Club of Kathmandu Dreams. Built for fair play, friendly rivalry, and football joy.</p>';
}
