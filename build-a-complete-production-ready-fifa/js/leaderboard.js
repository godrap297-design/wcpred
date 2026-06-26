import { getScoredLeaderboard, getTeams } from "./store.js";
import { footer, navigation, renderSiteChrome, setupThemeToggle, startCountdown } from "./ui.js";

document.querySelector("[data-header]").innerHTML = navigation("leaderboard");
document.querySelector("[data-footer]").innerHTML = footer();
setupThemeToggle();
renderSiteChrome();
startCountdown();

const table = document.querySelector("[data-leaderboard]");
const stat = document.querySelector("[data-leaderboard-stat]");

async function renderLeaderboard() {
  const rows = await getScoredLeaderboard();
  const teams = await getTeams();
  const teamMap = Object.fromEntries(teams.map(function (team) { return [team.id, team]; }));
  stat.textContent = rows.length + " participants";
  table.innerHTML = rows.length ? rows.map(function (item, index) {
    const champion = teamMap[item.picks && item.picks.champion && item.picks.champion[0]];
    return '<tr><td>' + (index + 1) + '</td><td><strong>' + item.participant.fullName + '</strong><small>' + item.participant.participantType + '</small></td><td>' + (champion ? champion.flag + ' ' + champion.name : 'Pending') + '</td><td><span class="score-pill">' + item.score + '</span></td></tr>';
  }).join("") : '<tr><td colspan="4">No predictions yet.</td></tr>';
}
renderLeaderboard();
