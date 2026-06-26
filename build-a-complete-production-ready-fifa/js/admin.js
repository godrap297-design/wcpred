import { SCORE_CONFIG } from "../data/scoring.config.js";
import { ROUND_OF_32_TEAMS } from "../data/teams.config.js";
import { createBracket } from "./bracket.js";
import { signInAdmin, signOutAdmin } from "./firebase-service.js";
import { calculateScore, getSettings, getSubmissions, getTeams, updateSettings } from "./store.js";
import { footer, navigation, renderSiteChrome, setupThemeToggle, showToast } from "./ui.js";

document.querySelector("[data-header]").innerHTML = navigation("admin", "../");
document.querySelector("[data-footer]").innerHTML = footer();
setupThemeToggle();
renderSiteChrome();

let submissions = [];
let settings = {};
let teams = [];
const loginForm = document.querySelector("[data-admin-login]");
const adminApp = document.querySelector("[data-admin-app]");
const participantBody = document.querySelector("[data-admin-participants]");
const leaderboardBody = document.querySelector("[data-admin-leaderboard]");
const searchInput = document.querySelector("[data-search]");
const actualBracketEl = document.querySelector("[data-actual-bracket]");
const teamsEditor = document.querySelector("[data-teams-editor]");

function requireAdmin() {
  const unlocked = sessionStorage.getItem("lck_admin_unlocked") === "true";
  loginForm.hidden = unlocked;
  adminApp.hidden = !unlocked;
  if (unlocked) refresh();
}

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");
  const passcode = formData.get("passcode");
  try {
    if (email && password) await signInAdmin(email, password);
    if (!email && passcode !== SCORE_CONFIG.adminPasscode) throw new Error("Invalid passcode.");
    sessionStorage.setItem("lck_admin_unlocked", "true");
    requireAdmin();
  } catch (err) { showToast(err.message, "error"); }
});

document.querySelector("[data-logout]").addEventListener("click", async function () { sessionStorage.removeItem("lck_admin_unlocked"); await signOutAdmin().catch(function () {}); requireAdmin(); });

async function refresh() {
  settings = await getSettings();
  submissions = await getSubmissions();
  teams = await getTeams();
  renderStats(); renderParticipants(); renderActualBracket(); renderTeamsEditor(); hydrateScoringFields();
}

function renderStats() {
  const scored = submissions.map(function (item) { return calculateScore(item.picks, settings.actualWinners, settings.scoring); });
  const average = scored.length ? Math.round(scored.reduce(function (a, b) { return a + b; }, 0) / scored.length) : 0;
  document.querySelector("[data-stat-count]").textContent = submissions.length;
  document.querySelector("[data-stat-top]").textContent = Math.max(0, ...scored);
  document.querySelector("[data-stat-average]").textContent = average;
  document.querySelector("[data-stat-lock]").textContent = settings.submissionsLocked ? "Locked" : "Open";
}

function renderParticipants() {
  const query = (searchInput.value || "").toLowerCase();
  const rows = submissions.filter(function (item) { return JSON.stringify(item.participant).toLowerCase().includes(query); }).map(function (item) {
    const score = calculateScore(item.picks, settings.actualWinners, settings.scoring);
    return '<tr><td>' + item.participant.fullName + '</td><td>' + item.participant.phone + '</td><td>' + item.participant.email + '</td><td>' + item.participant.participantType + '</td><td>' + score + '</td></tr>';
  }).join("");
  participantBody.innerHTML = rows || '<tr><td colspan="5">No participants found.</td></tr>';
  renderLeaderboard();
}

function renderLeaderboard() {
  const teamMap = Object.fromEntries(teams.map(function (team) { return [team.id, team]; }));
  leaderboardBody.innerHTML = submissions.map(function (item) { return Object.assign({}, item, { score: calculateScore(item.picks, settings.actualWinners, settings.scoring) }); }).sort(function (a, b) { return b.score - a.score; }).map(function (item, index) {
    const champion = teamMap[item.picks.champion && item.picks.champion[0]];
    return '<tr><td>' + (index + 1) + '</td><td>' + item.participant.fullName + '</td><td>' + (champion ? champion.flag + ' ' + champion.name : '') + '</td><td>' + item.score + '</td></tr>';
  }).join("") || '<tr><td colspan="4">No leaderboard data.</td></tr>';
}

function renderActualBracket() {
  actualBracketEl.innerHTML = "";
  createBracket(actualBracketEl, teams, { initialPicks: { roundOf16: settings.actualWinners.roundOf16 || Array(16).fill(null), quarterFinals: settings.actualWinners.quarterFinals || Array(8).fill(null), semiFinals: settings.actualWinners.semiFinals || Array(4).fill(null), final: settings.actualWinners.final || Array(2).fill(null), champion: settings.actualWinners.champion || Array(1).fill(null) }, onChange: async function (picks) { settings = await updateSettings({ actualWinners: picks }); renderParticipants(); renderStats(); } });
}

function renderTeamsEditor() {
  teamsEditor.innerHTML = teams.map(function (team, index) { return '<div class="team-edit-row"><input aria-label="Flag ' + (index + 1) + '" value="' + team.flag + '" data-team-field="flag" data-team-index="' + index + '"><input aria-label="Team ' + (index + 1) + '" value="' + team.name + '" data-team-field="name" data-team-index="' + index + '"><input aria-label="Seed ' + (index + 1) + '" value="' + (team.seed || '') + '" data-team-field="seed" data-team-index="' + index + '"></div>'; }).join("");
}

searchInput.addEventListener("input", renderParticipants);
document.querySelector("[data-lock]").addEventListener("click", async function () { await updateSettings({ submissionsLocked: true }); refresh(); });
document.querySelector("[data-open]").addEventListener("click", async function () { await updateSettings({ submissionsLocked: false }); refresh(); });
document.querySelector("[data-save-teams]").addEventListener("click", async function () {
  const nextTeams = structuredClone(teams);
  teamsEditor.querySelectorAll("[data-team-field]").forEach(function (input) { const team = nextTeams[Number(input.dataset.teamIndex)]; team[input.dataset.teamField] = input.value.trim(); team.id = team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });
  await updateSettings({ teams: nextTeams }); showToast("Teams saved. Refreshing bracket.", "success"); refresh();
});
document.querySelector("[data-reset-teams]").addEventListener("click", async function () { await updateSettings({ teams: ROUND_OF_32_TEAMS }); refresh(); });
document.querySelector("[data-save-scoring]").addEventListener("click", async function () { const scoring = {}; document.querySelectorAll("[data-score-field]").forEach(function (input) { scoring[input.dataset.scoreField] = Number(input.value); }); await updateSettings({ scoring: scoring }); showToast("Scoring updated.", "success"); refresh(); });
document.querySelector("[data-download]").addEventListener("click", function () {
  const teamMap = Object.fromEntries(teams.map(function (team) { return [team.id, team]; }));
  const header = ["Full Name", "Phone", "Email", "Type", "Score", "Champion"];
  const lines = submissions.map(function (item) { const score = calculateScore(item.picks, settings.actualWinners, settings.scoring); const champion = teamMap[item.picks.champion && item.picks.champion[0]]; return [item.participant.fullName, item.participant.phone, item.participant.email, item.participant.participantType, score, champion ? champion.name : ""].map(function (value) { return '"' + String(value).replaceAll('"', '""') + '"'; }).join(","); });
  const blob = new Blob([[header.join(",")].concat(lines).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "lck-dreams-world-cup-predictions.csv"; link.click(); URL.revokeObjectURL(url);
});

function hydrateScoringFields() { document.querySelectorAll("[data-score-field]").forEach(function (input) { input.value = (settings.scoring || SCORE_CONFIG.points)[input.dataset.scoreField] || 0; }); }
requireAdmin();
