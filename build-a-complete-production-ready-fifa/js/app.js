import { SCORE_CONFIG } from "../data/scoring.config.js";
import { createBracket, validatePicks } from "./bracket.js";
import { footer, navigation, renderSiteChrome, setupThemeToggle, showToast, startCountdown } from "./ui.js";
import { getLastConfirmation, getSettings, getTeams, submitPrediction } from "./store.js";

const page = document.body.dataset.page || "predict";
const header = document.querySelector("[data-header]");
const footerEl = document.querySelector("[data-footer]");
if (header) header.innerHTML = navigation(page);
if (footerEl) footerEl.innerHTML = footer();
setupThemeToggle();
renderSiteChrome();
startCountdown();

async function initHome() {
  const bracketEl = document.querySelector("[data-bracket]");
  const form = document.querySelector("[data-entry-form]");
  if (!bracketEl || !form) return;
  const settings = await getSettings();
  const teams = await getTeams();
  const bracket = createBracket(bracketEl, teams);
  document.querySelector("[data-deadline]").textContent = new Date(settings.deadline).toLocaleString() + " (" + SCORE_CONFIG.timezoneLabel + ")";
  document.querySelector("[data-score-summary]").textContent = "R16 " + settings.scoring.roundOf16 + " pts, QF " + settings.scoring.quarterFinals + " pts, SF " + settings.scoring.semiFinals + " pts, Final " + settings.scoring.final + " pts, Champion " + settings.scoring.champion + " pts";
  if (settings.submissionsLocked || new Date(settings.deadline) < new Date()) { form.querySelector("button[type='submit']").disabled = true; showToast("Submissions are currently closed.", "warning"); }
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const picks = bracket.getPicks();
    const error = validatePicks(picks);
    if (error) { showToast(error, "warning"); return; }
    const formData = new FormData(form);
    const participant = { fullName: formData.get("fullName").trim(), phone: formData.get("phone").trim(), email: formData.get("email").trim(), participantType: formData.get("participantType") };
    try { await submitPrediction({ participant: participant, picks: picks }); window.location.href = "confirmation.html"; } catch (err) { showToast(err.message, "error"); }
  });
}

function initStaticPages() {
  const prizeList = document.querySelector("[data-prizes]");
  if (prizeList) prizeList.innerHTML = SCORE_CONFIG.prizes.map(function (prize) { return '<article class="info-card"><h3>' + prize.title + '</h3><strong>' + prize.value + '</strong><p>' + prize.detail + '</p></article>'; }).join("");
  const confirmation = document.querySelector("[data-confirmation]");
  if (confirmation) {
    const last = getLastConfirmation();
    confirmation.innerHTML = last ? '<h1>Prediction Submitted</h1><p>Thank you, <strong>' + last.participant.fullName + '</strong>. Your champion pick has been recorded.</p><a class="button" href="leaderboard.html">View leaderboard</a>' : '<h1>No Recent Submission</h1><p>Submit your bracket first, then return here for confirmation.</p><a class="button" href="index.html">Create prediction</a>';
  }
}
initHome();
initStaticPages();
