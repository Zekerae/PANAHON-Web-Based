import assert from 'node:assert';
import { GameEngine } from '../src/gameEngine.js';

console.log('--- START MULTIPLAYER INITIATIVE & TURN ORDER TEST ---');

// 1. Initialize GameEngine with 4 players (representing an online lobby)
const engine = new GameEngine();
const initialLobbyPlayers = [
  { id: 0, name: 'Alice (Host)', roleKey: 'CHRONOMANCER', isLocal: true },
  { id: 1, name: 'Bob (Guest 1)', roleKey: 'HISTORIAN', isLocal: false },
  { id: 2, name: 'Charlie (Guest 2)', roleKey: 'GUARDIAN', isLocal: false },
  { id: 3, name: 'Diana (Guest 3)', roleKey: 'STRATEGIST', isLocal: false }
];

engine.initGame(initialLobbyPlayers);

assert.strictEqual(engine.state.players.length, 4, 'Should have 4 players');
assert.strictEqual(engine.state.hasCompletedIntro, false, 'hasCompletedIntro should be false before initiative roll-off');
console.log('✓ 1. GameEngine initialized with 4 players waiting for initiative roll-off');

// 2. Simulate Initiative Roll-off:
// Suppose:
// Charlie rolls 6 (Highest -> 1st place)
// Alice rolls 5 (2nd place)
// Bob & Diana both roll 3 (Tie!) -> Re-roll: Bob rolls 4, Diana rolls 2
// Resulting order: [Charlie, Alice, Bob, Diana]
const finalInitiativeOrder = [
  { id: 2, name: 'Charlie (Guest 2)', roleKey: 'GUARDIAN' },
  { id: 0, name: 'Alice (Host)', roleKey: 'CHRONOMANCER' },
  { id: 1, name: 'Bob (Guest 1)', roleKey: 'HISTORIAN' },
  { id: 3, name: 'Diana (Guest 3)', roleKey: 'STRATEGIST' }
];

// 3. Test engine.setPlayerTurnOrder(finalInitiativeOrder)
// Ensure it does NOT throw ReferenceError: player is not defined
let turnOrderSuccess = false;
try {
  turnOrderSuccess = engine.setPlayerTurnOrder(finalInitiativeOrder);
} catch (err) {
  console.error('FAILED with error:', err);
  assert.fail(`setPlayerTurnOrder threw error: ${err.message}`);
}

assert.strictEqual(turnOrderSuccess, true, 'setPlayerTurnOrder must return true');
console.log('✓ 2. engine.setPlayerTurnOrder() successfully executed without runtime errors');

// 4. Verify new turn order and player assignments
const updatedPlayers = engine.state.players;
assert.strictEqual(updatedPlayers.length, 4, 'Must still have 4 players');

// 1st place should be Charlie, with new ID 0
assert.strictEqual(updatedPlayers[0].name, 'Charlie (Guest 2)', 'First player must be Charlie');
assert.strictEqual(updatedPlayers[0].id, 0, 'First player ID must be 0');
assert.strictEqual(engine.state.currentPlayerIndex, 0, 'Current turn index must be 0 (Charlie)');

// 2nd place should be Alice, with new ID 1
assert.strictEqual(updatedPlayers[1].name, 'Alice (Host)', 'Second player must be Alice');
assert.strictEqual(updatedPlayers[1].id, 1, 'Second player ID must be 1');

// 3rd place should be Bob, with new ID 2
assert.strictEqual(updatedPlayers[2].name, 'Bob (Guest 1)', 'Third player must be Bob');
assert.strictEqual(updatedPlayers[2].id, 2, 'Third player ID must be 2');

// 4th place should be Diana, with new ID 3
assert.strictEqual(updatedPlayers[3].name, 'Diana (Guest 3)', 'Fourth player must be Diana');
assert.strictEqual(updatedPlayers[3].id, 3, 'Fourth player ID must be 3');

console.log('✓ 3. Player IDs and turn sequence correctly re-indexed: #1 Charlie -> #2 Alice -> #3 Bob -> #4 Diana');

// 5. Verify game state transitions
assert.strictEqual(engine.state.hasCompletedIntro, true, 'hasCompletedIntro must be true');
assert.strictEqual(engine.state.phase, 'rolling', 'Phase must be rolling for the first player');
assert.strictEqual(engine.getCurrentPlayer().name, 'Charlie (Guest 2)', 'Current player must be initiative winner');
console.log('✓ 4. Game state correctly updated (hasCompletedIntro: true, phase: rolling, active: Charlie)');

// 6. Test initiative tie-breaking grouping algorithm
function evaluateRolls(groups, rolls) {
  const newGroups = [];
  let hasTie = false;

  groups.forEach((g) => {
    if (g.length === 1) {
      newGroups.push(g);
    } else {
      const byScore = {};
      g.forEach((p) => {
        const score = rolls[p.id] || 1;
        if (!byScore[score]) byScore[score] = [];
        byScore[score].push(p);
      });

      const sortedScores = Object.keys(byScore)
        .map(Number)
        .sort((a, b) => b - a);

      sortedScores.forEach((s) => {
        const subgroup = byScore[s];
        newGroups.push(subgroup);
        if (subgroup.length > 1) hasTie = true;
      });
    }
  });

  return { newGroups, hasTie };
}

// Initial round: 4 players roll [A: 6, B: 4, C: 4, D: 2]
const round1Groups = [[
  { id: 'A', name: 'Alice' },
  { id: 'B', name: 'Bob' },
  { id: 'C', name: 'Charlie' },
  { id: 'D', name: 'Diana' }
]];
const round1Rolls = { A: 6, B: 4, C: 4, D: 2 };
const res1 = evaluateRolls(round1Groups, round1Rolls);

assert.strictEqual(res1.hasTie, true, 'Must detect tie between Bob and Charlie');
assert.strictEqual(res1.newGroups.length, 3, 'Must have 3 score groups: [A], [B, C], [D]');
assert.strictEqual(res1.newGroups[0][0].id, 'A', '1st place locked: Alice (6)');
assert.strictEqual(res1.newGroups[1].length, 2, '2nd bracket tied: Bob & Charlie (4)');
assert.strictEqual(res1.newGroups[2][0].id, 'D', '3rd bracket locked: Diana (2)');
console.log('✓ 5. Initiative tie detection correctly locks unique ranks and isolates tied players');

// Re-roll round: Only tied players [B, C] roll [B: 5, C: 3]
const round2Rolls = { B: 5, C: 3 };
const res2 = evaluateRolls(res1.newGroups, round2Rolls);

assert.strictEqual(res2.hasTie, false, 'Tie must be completely resolved');
assert.strictEqual(res2.newGroups.length, 4, 'All 4 players now have distinct ranks');
const finalOrder = res2.newGroups.flat().map(p => p.id);
assert.deepStrictEqual(finalOrder, ['A', 'B', 'C', 'D'], 'Final order must be A -> B -> C -> D');
console.log('✓ 6. Re-roll round resolves ties into definitive turn order: Alice -> Bob -> Charlie -> Diana');

engine.stop();
console.log('✓ ALL MULTIPLAYER INITIATIVE TESTS PASSED (6/6)');
process.exit(0);

