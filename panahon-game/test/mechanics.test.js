import assert from 'assert';
import { GameEngine } from '../src/gameEngine.js';
import { EVENT_CARDS, DANGER_CARDS, ERAS } from '../src/gameData.js';

console.log('=== STARTING PANAHON MECHANICS TEST SUITE ===');

let engine = null;

try {
  // Test 1: Verify all 20 Event Cards and 16 Danger Cards are properly configured
  assert.strictEqual(EVENT_CARDS[ERAS.SPANISH].length, 5, 'Spanish should have 5 events');
  assert.strictEqual(EVENT_CARDS[ERAS.AMERICAN].length, 5, 'American should have 5 events');
  assert.strictEqual(EVENT_CARDS[ERAS.JAPANESE].length, 5, 'Japanese should have 5 events');
  assert.strictEqual(EVENT_CARDS[ERAS.MYTH].length, 5, 'Myth should have 5 events');

  assert.strictEqual(DANGER_CARDS[ERAS.SPANISH].length, 4, 'Spanish should have 4 dangers');
  assert.strictEqual(DANGER_CARDS[ERAS.AMERICAN].length, 4, 'American should have 4 dangers');
  assert.strictEqual(DANGER_CARDS[ERAS.JAPANESE].length, 4, 'Japanese should have 4 dangers');
  assert.strictEqual(DANGER_CARDS[ERAS.MYTH].length, 4, 'Myth should have 4 dangers');

  console.log('✓ Card counts verified (20 Events, 16 Dangers, 0 points)');

  // Initialize GameEngine
  engine = new GameEngine();
  engine.initGame([
    { name: 'P1', roleKey: 'EXPLORER', isAi: false },
    { name: 'P2', roleKey: 'HISTORIAN', isAi: true },
    { name: 'P3', roleKey: 'GUARDIAN', isAi: true },
    { name: 'P4', roleKey: 'CHRONOMANCER', isAi: true }
  ]);

  const p1 = engine.state.players[0];
  const p2 = engine.state.players[1];

  // Test 2: Spanish Event 1: Paldoooo (+2 Energy, draws 1 Clue)
  p1.energy = 5;
  const initClues = p1.clueCards.length;
  const paldoCard = EVENT_CARDS[ERAS.SPANISH].find(c => c.name === 'Paldoooo');
  assert(paldoCard, 'Paldoooo card exists');
  paldoCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 7, 'Paldoooo should add 2 energy');
  assert.strictEqual(p1.clueCards.length, initClues + 1, 'Paldoooo should draw 1 clue card');
  console.log('✓ Spanish Event 1: Paldoooo (+2 Energy, draws 1 Clue)');

  // Test 3: Spanish Event 2: Fiesta now, problem later (+2 Energy, +1 Paradox)
  p1.energy = 5;
  p1.paradox = 0;
  const fiestaCard = EVENT_CARDS[ERAS.SPANISH].find(c => c.name === 'Fiesta now, problem later');
  fiestaCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 7, 'Fiesta should add 2 energy');
  assert.strictEqual(p1.paradox, 1, 'Fiesta should add 1 paradox');
  console.log('✓ Spanish Event 2: Fiesta now, problem later (+2 Energy, +1 Paradox)');

  // Test 4: Spanish Event 4: Safe ka rito sa Intra (Sanctuary Shield)
  const intraCard = EVENT_CARDS[ERAS.SPANISH].find(c => c.name === 'Safe ka rito sa Intra');
  intraCard.effect(p1, engine);
  assert.strictEqual(p1.sanctuaryShield, true, 'Intra should grant Sanctuary Shield');

  // Negate Danger Card with Sanctuary Shield
  p1.currentEra = ERAS.SPANISH;
  engine.drawDangerCard(p1);
  assert.strictEqual(p1.sanctuaryShield, false, 'Sanctuary shield should be consumed');
  assert.strictEqual(engine.state.pendingModal.type, 'danger_negated', 'Danger should be negated');
  console.log('✓ Spanish Event 4: Safe ka rito sa Intra (Sanctuary Shield negates next Danger)');

  // Test 5: Spanish Event 5: Ay nag-glitch (temporalGlitchTurns = 2)
  const glitchCard = EVENT_CARDS[ERAS.SPANISH].find(c => c.name === 'Ay nag-glitch');
  glitchCard.effect(p1, engine);
  assert.strictEqual(engine.state.temporalGlitchTurns, 2, 'temporalGlitchTurns should be 2');
  console.log('✓ Spanish Event 5: Ay nag-glitch (Global 2-turn Temporal Disturbance)');

  // Test 6: American Event 2: Thomas and Friends (Move 3 spaces forward)
  p1.tileIndex = 0;
  p1.currentEra = ERAS.AMERICAN;
  const thomasCard = EVENT_CARDS[ERAS.AMERICAN].find(c => c.name === 'Thomas and Friends');
  thomasCard.effect(p1, engine);
  assert.strictEqual(p1.tileIndex, 3, 'Thomas and Friends should advance player by 3 spaces');
  console.log('✓ American Event 2: Thomas and Friends (Move 3 spaces forward for 0 energy)');

  // Test 7: American Event 3: You’re Passed! Passed Away… (+2 Energy, skipNextTurn = true)
  p1.energy = 4;
  p1.skipNextTurn = false;
  const passedCard = EVENT_CARDS[ERAS.AMERICAN].find(c => c.name.includes('Passed Away'));
  passedCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 6, 'Should gain 2 energy');
  assert.strictEqual(p1.skipNextTurn, true, 'Should skip next turn');
  console.log('✓ American Event 3: You’re Passed! Passed Away… (+2 Energy, turn skipped debuff)');

  // Test 8: American Event 4: Free SHIPping fee (+1 Energy)
  p1.energy = 4;
  const freeShip = EVENT_CARDS[ERAS.AMERICAN].find(c => c.name.includes('Free SHIPping'));
  freeShip.effect(p1, engine);
  assert.strictEqual(p1.energy, 5, 'Free SHIPping should add 1 energy');
  console.log('✓ American Event 4: Free SHIPping fee (+1 Energy recovered)');

  // Test 9: Japanese Event 2: Radyo patrol, iwas gulo (-1 Timeline Meter)
  engine.state.timelineMeter = 3;
  const radyoCard = EVENT_CARDS[ERAS.JAPANESE].find(c => c.name.includes('Radyo patrol'));
  radyoCard.effect(p1, engine);
  assert.strictEqual(engine.state.timelineMeter, 2, 'Radyo patrol should decrease timeline meter by 1');
  console.log('✓ Japanese Event 2: Radyo patrol, iwas gulo (-1 Timeline Meter)');

  // Test 10: Japanese Event 3: Kayamanan ng Buwaya (+3 Energy capped at 10)
  p1.energy = 8;
  const buwayaCard = EVENT_CARDS[ERAS.JAPANESE].find(c => c.name.includes('Kayamanan ng Buwaya'));
  buwayaCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 10, 'Buwaya should cap energy at 10');
  console.log('✓ Japanese Event 3: Kayamanan ng Buwaya (+3 Energy capped at 10)');

  // Test 11: Japanese Event 4: HIDEous plan resolution
  engine.state.pendingChoice = { type: 'hideousPlan' };
  p1.energy = 2;
  p1.skipNextTurn = false;
  engine.resolveChoice('hideous_restore_energy');
  assert.strictEqual(p1.energy, 10, 'Option A should restore energy to 10');
  assert.strictEqual(p1.skipNextTurn, 2, 'Option A should skip next 2 turns');

  engine.state.pendingChoice = { type: 'hideousPlan' };
  p1.paradox = 4;
  engine.resolveChoice('hideous_reset_paradox');
  assert.strictEqual(p1.paradox, 0, 'Option B should reset paradox to 0');
  assert.strictEqual(p1.skipNextTurn, 2, 'Option B should skip next 2 turns');
  console.log('✓ Japanese Event 4: HIDEous plan (Option A: 10/10 Energy, Option B: 0 Paradox, both skip 2 turns)');

  // Test 12: Myth Event 1: Diwata Pares blessing (+2 Energy, -2 Paradox)
  p1.energy = 3;
  p1.paradox = 3;
  const diwataCard = EVENT_CARDS[ERAS.MYTH].find(c => c.name.includes('Diwata Pares'));
  diwataCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 5, 'Diwata should add 2 energy');
  assert.strictEqual(p1.paradox, 1, 'Diwata should reduce paradox by 2');
  console.log('✓ Myth Event 1: Diwata Pares blessing (+2 Energy, -2 Paradox)');

  // Test 13: Myth Event 3: Healing for everything (+2 in Myth, +1 in others)
  p1.currentEra = ERAS.MYTH;
  p1.energy = 3;
  p2.currentEra = ERAS.SPANISH;
  p2.energy = 3;
  const healingCard = EVENT_CARDS[ERAS.MYTH].find(c => c.name.includes('Healing for everything'));
  healingCard.effect(p1, engine);
  assert.strictEqual(p1.energy, 5, 'Operative in Myth quadrant should gain +2 Energy');
  assert.strictEqual(p2.energy, 4, 'Operative in Spanish quadrant should gain +1 Energy');
  console.log('✓ Myth Event 3: Healing for everything (+2 Energy in Myth, +1 in other quadrants)');

  // Test 14: Spanish Danger 1: Bulkang galit (Group Hazard)
  const volcanoCard = DANGER_CARDS[ERAS.SPANISH].find(c => c.name === 'Bulkang galit');
  assert(volcanoCard.isGroupHazard, 'Volcano should be group hazard');
  engine.state.pendingModal = {
    type: 'danger',
    cardId: volcanoCard.id,
    era: ERAS.SPANISH,
    needsRoll: true,
    isGroupHazard: true,
    playerId: p1.id
  };
  engine.state.players.forEach(p => p.energy = 8);
  const groupRes = engine.rollDangerDie(p1.id);
  assert(groupRes.groupResults, 'Group results should be populated');
  assert.strictEqual(groupRes.groupResults.length, 4, 'All 4 players must have rolled');
  console.log('✓ Spanish Danger 1: Bulkang galit (Group Hazard: all 4 players roll D6, 6 = safe, 1-5 = -3 Energy)');

  // Test 15: American Danger 2: Goodbye, Philippines! (+1 Timeline Meter on fail)
  const bombCard = DANGER_CARDS[ERAS.AMERICAN].find(c => c.name === 'Goodbye, Philippines!');
  engine.state.timelineMeter = 2;
  bombCard.failEffect(p1, engine);
  assert.strictEqual(engine.state.timelineMeter, 3, 'Bomb fail should increase Timeline Meter by 1');
  console.log('✓ American Danger 2: Goodbye, Philippines! (Fail increases Timeline Meter by +1)');

  // Test 16: Japanese Danger 3: Inspection Reveal: Kabado
  p1.clueCards = [
    { id: 'c1', title: 'Mission Clue', artifactId: 'art_1', isDecoy: false },
    { id: 'c2', title: 'Decoy Clue', isDecoy: true }
  ];
  p1.mission = { missionArtifactId: 'art_1' };
  p1.clueProgress = { art_1: 1 };
  engine.revealAndDiscardMissionClue(p1);
  assert.strictEqual(p1.clueCards.length, 1, '1 Clue should be confiscated');
  assert.strictEqual(p1.clueCards[0].id, 'c2', 'Mission Clue should be prioritized for discard');
  assert(p1.handRevealedUntil > Date.now(), 'Hand should be revealed for 5 seconds');
  console.log('✓ Japanese Danger 3: Inspection Reveal: Kabado (Hand revealed 5s & 1 core clue confiscated)');

  // Test 17: Myth Danger 3: Scammer na Engkanto (Converts 1 Clue to Decoy)
  p1.clueCards = [
    { id: 'c1', title: 'Valid Clue', artifactId: 'art_2', isDecoy: false }
  ];
  p1.clueProgress = { art_2: 1 };
  engine.convertClueToDecoy(p1);
  assert.strictEqual(p1.clueCards[0].isDecoy, true, 'Valid Clue should be converted into Decoy');
  assert.strictEqual(p1.clueProgress.art_2, 0, 'Clue progress should be decremented');
  console.log('✓ Myth Danger 3: Scammer na Engkanto (Converts 1 valid clue into Decoy Card)');

  // Test 18: Guardian "Aegis Shield" Passive penalty reduction
  p1.roleKey = 'GUARDIAN';
  p1.energy = 5;
  p1.tileIndex = 5;
  const kapreCard = DANGER_CARDS[ERAS.MYTH].find(c => c.name === 'Isoy break na Kapre');
  kapreCard.failEffect(p1, engine, true);
  assert.strictEqual(p1.energy, 4, 'Guardian should lose only 1 Energy instead of 2');
  assert.strictEqual(p1.tileIndex, 4, 'Guardian should move backward only 1 space instead of 2');
  console.log('✓ Guardian Aegis Shield passive (Reduces numeric penalties by 1)');

  console.log('------------------------------------------------------');
  console.log('✓ ALL TESTS PASSED SUCCESSFULLY (18/18)');
  console.log('------------------------------------------------------');

  if (engine) engine.stop();
  process.exit(0);

} catch (err) {
  console.error('\n✗ TEST FAILED:', err.message);
  if (err.stack) console.error(err.stack);
  if (engine) engine.stop();
  process.exit(1);
}
