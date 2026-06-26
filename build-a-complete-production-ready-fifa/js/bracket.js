const ROUND_META = [
  { key: "roundOf32", label: "Round of 32", output: "roundOf16" },
  { key: "roundOf16", label: "Round of 16", output: "quarterFinals" },
  { key: "quarterFinals", label: "Quarter-finals", output: "semiFinals" },
  { key: "semiFinals", label: "Semi-finals", output: "final" },
  { key: "final", label: "Final", output: "champion" },
  { key: "champion", label: "Champion" }
];

export function createEmptyPicks() {
  return { roundOf16: Array(16).fill(null), quarterFinals: Array(8).fill(null), semiFinals: Array(4).fill(null), final: Array(2).fill(null), champion: Array(1).fill(null) };
}

export function createBracket(container, teams, options) {
  options = options || {};
  const state = options.initialPicks || createEmptyPicks();
  const teamMap = Object.fromEntries(teams.map(function (team) { return [team.id, team]; }));

  function getRoundTeams(roundKey) { return roundKey === "roundOf32" ? teams.map(function (team) { return team.id; }) : state[roundKey] || []; }

  function clearDownstream(fromRoundIndex, changedSlot) {
    let slot = Math.floor(changedSlot / 2);
    for (let index = fromRoundIndex + 1; index < ROUND_META.length - 1; index += 1) {
      const output = ROUND_META[index].output;
      if (output && state[output]) state[output][slot] = null;
      slot = Math.floor(slot / 2);
    }
  }

  function chooseWinner(round, roundIndex, matchIndex, teamId) {
    if (!teamId || !round.output) return;
    if (state[round.output][matchIndex] !== teamId) {
      state[round.output][matchIndex] = teamId;
      clearDownstream(roundIndex, matchIndex);
    }
    render();
    if (options.onChange) options.onChange(structuredClone(state));
  }

  function teamButton(teamId, round, roundIndex, matchIndex, selectedId) {
    const team = teamMap[teamId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-button" + (selectedId === teamId ? " is-selected" : "");
    button.disabled = !team;
    button.setAttribute("aria-pressed", selectedId === teamId ? "true" : "false");
    if (team) button.innerHTML = '<span class="flag">' + team.flag + '</span><span>' + team.name + '</span><small>' + (team.seed || "") + '</small>';
    else button.innerHTML = '<span class="flag">•</span><span>Awaiting winner</span><small></small>';
    button.addEventListener("click", function () { chooseWinner(round, roundIndex, matchIndex, teamId); });
    return button;
  }

  function renderChampion(roundEl) {
    const champion = teamMap[state.champion[0]];
    const card = document.createElement("div");
    card.className = "champion-card";
    card.innerHTML = champion ? '<span>' + champion.flag + '</span><strong>' + champion.name + '</strong><small>Predicted World Champion</small>' : '<span>🏆</span><strong>Select a finalist</strong><small>Your champion appears here</small>';
    roundEl.appendChild(card);
  }

  function render() {
    container.innerHTML = "";
    ROUND_META.forEach(function (round, roundIndex) {
      const roundEl = document.createElement("section");
      roundEl.className = "bracket-round";
      roundEl.setAttribute("aria-label", round.label);
      roundEl.innerHTML = "<h3>" + round.label + "</h3>";
      if (round.key === "champion") { renderChampion(roundEl); container.appendChild(roundEl); return; }
      const ids = getRoundTeams(round.key);
      const selectedIds = round.output ? state[round.output] : [];
      for (let index = 0; index < ids.length; index += 2) {
        const match = document.createElement("div");
        match.className = "match-card";
        const matchIndex = index / 2;
        match.appendChild(teamButton(ids[index], round, roundIndex, matchIndex, selectedIds[matchIndex]));
        match.appendChild(teamButton(ids[index + 1], round, roundIndex, matchIndex, selectedIds[matchIndex]));
        roundEl.appendChild(match);
      }
      container.appendChild(roundEl);
    });
  }
  render();
  return { getPicks: function () { return structuredClone(state); }, setPicks: function (picks) { Object.assign(state, picks); render(); } };
}

export function validatePicks(picks) {
  const missingRound = ["roundOf16", "quarterFinals", "semiFinals", "final", "champion"].find(function (round) { return !Array.isArray(picks[round]) || picks[round].some(function (item) { return !item; }); });
  return missingRound ? "Please complete every knockout round before submitting." : "";
}
