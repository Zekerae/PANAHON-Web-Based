import assert from 'node:assert';
import { GameEngine } from '../src/gameEngine.js';
import { ERAS, EVENT_CARDS } from '../src/gameData.js';
import fs from 'node:fs';

console.log('--- START EVENT CARD ROLL & LOG HIDING TEST ---');

// 1. Verify UI Pause Modal does not have the visible Logs & Diagnostics button
const pauseModalSource = fs.readFileSync('src/components/PauseModal.jsx', 'utf8');
assert(!pauseModalSource.includes('GAME LOGS & DIAGNOSTICS'), 'PauseModal.jsx must not contain visible GAME LOGS & DIAGNOSTICS button');
console.log('✓ 1. PauseModal.jsx successfully hides the Logs & Diagnostics button from UI');

// Initialize Game Engine
const engine = new GameEngine();
const players = [
  { id: 0, name: 'Player 1', isAi: false, roleKey: 'EXPLORER' },
  { id: 1, name: 'AI Bot', isAi: true, roleKey: 'STRATEGIST' }
];
engine.initGame(players);

const p1 = engine.state.players[0];
p1.currentEra = ERAS.MYTH;

// 2. Test drawing "Bato-bato sa langit" event card
// Prepare Myth event deck with evt_my_4 on top
const batoCard = EVENT_CARDS[ERAS.MYTH].find(c => c.id === 'evt_my_4');
assert(batoCard, 'evt_my_4 card must exist in Myth event cards');
assert(batoCard.needsRoll === true, 'evt_my_4 must have needsRoll === true');
engine.state.eventDecks[ERAS.MYTH] = [{ ...batoCard }];

engine.drawEventCard(p1);

assert(engine.state.pendingModal, 'Pending modal should be active');
assert.strictEqual(engine.state.pendingModal.type, 'event', 'Modal type should be event');
assert.strictEqual(engine.state.pendingModal.cardId, 'evt_my_4', 'Card ID should be evt_my_4');
assert.strictEqual(engine.state.pendingModal.needsRoll, true, 'needsRoll must be true before rolling');
assert.strictEqual(engine.state.pendingModal.diceRoll, null, 'diceRoll must be null before rolling');
assert.strictEqual(engine.state.pendingChoice, null, 'pendingChoice must be null before rolling');
console.log('✓ 2. drawEventCard creates event modal with needsRoll: true and interactive roll prompt');

// 3. Test interactive roll via rollEventDie()
const rollResult = engine.rollEventDie(p1.id);
assert(rollResult, 'rollEventDie should return result');
assert(typeof rollResult.diceRoll === 'number', 'diceRoll must be a number');
assert(rollResult.diceRoll >= 1 && rollResult.diceRoll <= 6, 'diceRoll must be 1-6');
assert.strictEqual(rollResult.success, rollResult.diceRoll >= 4, 'Success must be true for 4-6, false for 1-3');
assert.strictEqual(engine.state.pendingModal.needsRoll, false, 'Modal needsRoll should now be false');
assert.strictEqual(engine.state.pendingModal.diceRoll, rollResult.diceRoll, 'Modal diceRoll must match roll');
console.log(`✓ 3. rollEventDie() correctly resolved roll of ${rollResult.diceRoll} (success: ${rollResult.success})`);

// 4. Test consequence resolution on dismissModal:
// Case A: Forcing success roll (5)
engine.state.pendingModal.diceRoll = 5;
engine.state.pendingModal.success = true;
const initialClues = p1.clueCards.length;

engine.dismissModal();

assert.strictEqual(engine.state.pendingModal, null, 'Modal should be dismissed');
assert(engine.state.pendingChoice, 'pendingChoice should now be active for Bato-bato sa langit');
assert.strictEqual(engine.state.pendingChoice.type, 'batoBatoEra', 'Choice type must be batoBatoEra');
console.log('✓ 4. Dismissing successful roll opens batoBatoEra choice modal');

// Resolve the choice by selecting Spanish era
engine.resolveChoice('bato_era_spanish');
assert.strictEqual(engine.state.pendingChoice, null, 'pendingChoice should be cleared after choice');
assert.strictEqual(p1.clueCards.length, initialClues + 1, 'Player should have drawn 1 clue card from Spanish deck');
console.log('✓ 5. Choosing Era deck successfully draws Clue Card from chosen era');

// 5. Test consequence resolution on fail roll (2)
engine.state.eventDecks[ERAS.MYTH] = [{ ...batoCard }];
engine.drawEventCard(p1);
assert.strictEqual(engine.state.pendingModal.needsRoll, true);
engine.state.pendingModal.needsRoll = false;
engine.state.pendingModal.diceRoll = 2;
engine.state.pendingModal.success = false;

const cluesBeforeFail = p1.clueCards.length;
engine.dismissModal();

assert.strictEqual(engine.state.pendingModal, null, 'Modal dismissed on fail');
assert.strictEqual(engine.state.pendingChoice, null, 'No choice modal opened on fail');
assert.strictEqual(p1.clueCards.length, cluesBeforeFail, 'No clue card added on fail');
console.log('✓ 6. Failed roll (1-3) results in nothing happening without opening choice modal');

// 6. Test AI player roll and automatic resolution
const aiPlayer = engine.state.players[1];
assert(aiPlayer.isAi, 'Player 2 should be AI');
aiPlayer.currentEra = ERAS.MYTH;
engine.state.eventDecks[ERAS.MYTH] = [{ ...batoCard }];

engine.drawEventCard(aiPlayer);
assert.strictEqual(engine.state.pendingModal.needsRoll, true);
const aiRollRes = engine.rollEventDie(aiPlayer.id);
assert(aiRollRes, 'AI event roll succeeded');

// If we set success and dismiss, AI should directly receive card without pendingChoice modal blocking
engine.state.pendingModal.diceRoll = 6;
engine.state.pendingModal.success = true;
const aiCluesBefore = aiPlayer.clueCards.length;
engine.dismissModal();
assert.strictEqual(engine.state.pendingChoice, null, 'AI should not have pendingChoice modal');
assert.strictEqual(aiPlayer.clueCards.length, aiCluesBefore + 1, 'AI should have automatically drawn card');
console.log('✓ 7. AI resolves event roll and draws card automatically on success');

// Clean up
engine.stop();
console.log('✓ ALL 7 EVENT CARD ROLL & LOG HIDING TESTS PASSED');
process.exit(0);
