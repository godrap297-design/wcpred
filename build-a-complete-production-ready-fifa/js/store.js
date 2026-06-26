import { SCORE_CONFIG } from "../data/scoring.config.js";
import { ROUND_OF_32_TEAMS } from "../data/teams.config.js";
import { addSubmissionToFirebase, fetchSubmissions, findSubmissionByPhone, isFirebaseConfigured, readSettings, saveSettings } from "./firebase-service.js";

const KEYS = { submissions: "lck_worldcup_submissions", settings: "lck_worldcup_settings", confirmation: "lck_worldcup_confirmation" };

export function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (err) { return fallback; }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getSettings() {
  const remote = await readSettings().catch(function () { return null; });
  return Object.assign({ deadline: SCORE_CONFIG.deadline, submissionsLocked: false, actualWinners: {}, scoring: SCORE_CONFIG.points, teams: ROUND_OF_32_TEAMS }, readLocal(KEYS.settings, {}), remote || {});
}

export async function updateSettings(settings) {
  writeLocal(KEYS.settings, Object.assign({}, readLocal(KEYS.settings, {}), settings));
  if (isFirebaseConfigured()) await saveSettings(settings);
  return getSettings();
}

export async function getTeams() {
  const settings = await getSettings();
  return Array.isArray(settings.teams) && settings.teams.length === 32 ? settings.teams : ROUND_OF_32_TEAMS;
}

export async function getSubmissions() {
  const remote = await fetchSubmissions().catch(function () { return []; });
  return remote.length ? remote : readLocal(KEYS.submissions, []);
}

export async function hasDuplicatePhone(phoneNormalized) {
  if (await findSubmissionByPhone(phoneNormalized).catch(function () { return null; })) return true;
  return readLocal(KEYS.submissions, []).some(function (item) { return item.participant.phoneNormalized === phoneNormalized; });
}

export async function submitPrediction(payload) {
  const phoneNormalized = normalizePhone(payload.participant.phone);
  if (await hasDuplicatePhone(phoneNormalized)) throw new Error("A prediction has already been submitted with this phone number.");
  const submission = Object.assign({}, payload, { id: crypto.randomUUID(), participant: Object.assign({}, payload.participant, { phoneNormalized: phoneNormalized }), score: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  writeLocal(KEYS.submissions, [submission].concat(readLocal(KEYS.submissions, [])));
  if (isFirebaseConfigured()) await addSubmissionToFirebase(submission);
  writeLocal(KEYS.confirmation, submission);
  return submission;
}

export function getLastConfirmation() {
  return readLocal(KEYS.confirmation, null);
}

export function calculateScore(picks, actualWinners, scoring) {
  actualWinners = actualWinners || {};
  scoring = scoring || SCORE_CONFIG.points;
  const rounds = [["roundOf16", scoring.roundOf16], ["quarterFinals", scoring.quarterFinals], ["semiFinals", scoring.semiFinals], ["final", scoring.final], ["champion", scoring.champion]];
  return rounds.reduce(function (total, pair) {
    const actual = new Set(actualWinners[pair[0]] || []);
    const selected = picks[pair[0]] || [];
    return total + selected.filter(function (teamId) { return actual.has(teamId); }).length * Number(pair[1] || 0);
  }, 0);
}

export async function getScoredLeaderboard() {
  const settings = await getSettings();
  const submissions = await getSubmissions();
  return submissions.map(function (item) { return Object.assign({}, item, { score: calculateScore(item.picks, settings.actualWinners, settings.scoring) }); }).sort(function (a, b) { return b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt); });
}
