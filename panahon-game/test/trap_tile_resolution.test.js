import assert from "node:assert";
import { GameEngine } from "../src/gameEngine.js";
import { TILE_TYPES } from "../src/gameData.js";

console.log("=== STARTING PANAHON TRAP & TILE TRIGGER TEST SUITE ===");

let engine = null;

try {
  engine = new GameEngine();
  const players = [
    { id: "p1", name: "Player 1", isAi: false, roleKey: "EXPLORER" },
    { id: "p2", name: "Strategist", isAi: false, roleKey: "STRATEGIST" }
  ];

  engine.initGame(players);
  const p1 = engine.state.players[0];
  const p2 = engine.state.players[1];

  // Helper to plant an armed enemy trap on a specific tile in Spanish era
  function plantTrapOnTile(tileIdx) {
    const tile = engine.state.board.spanish[tileIdx];
    tile.trap = {
      ownerId: p2.id,
      ownerName: p2.name,
      ownerRole: "STRATEGIST",
      era: "spanish",
      tileIndex: tileIdx
    };
    return tile;
  }

  // --- Test 1: CLUE Tile with Trap ---
  let clueIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.CLUE);
  assert(clueIdx >= 0, "Spanish board must have a CLUE tile");
  let tileClue = plantTrapOnTile(clueIdx);

  p1.tileIndex = clueIdx;
  p1.currentEra = "spanish";
  const initialClues = p1.clueCards.length;
  p2.energy = 5;
  const initialStratEnergy = p2.energy;

  // Resolve landing on the Clue tile with trap
  engine.resolveTile(p1, tileClue);

  // 1a. Trap should trigger: disarmed, owner gets +1 energy, Danger modal shown
  assert.strictEqual(tileClue.trap, null, "Trap must be disarmed/consumed upon trigger");
  assert.strictEqual(p2.energy, initialStratEnergy + 1, "Strategist owner gains +1 Energy from Trap Mastery");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Trap must display a Danger Card modal first");
  assert(engine.state.queuedTileResolution, "queuedTileResolution must be set for the underlying tile");

  // 1b. Dismiss the Danger Card modal -> CLUE tile function must now trigger!
  engine.dismissModal();
  assert.strictEqual(engine.state.pendingModal?.type, "card", "Underlying CLUE tile must trigger and show Clue modal");
  assert.strictEqual(p1.clueCards.length, initialClues + 1, "Player should have received 1 Clue Card from the Clue tile");
  engine.dismissModal();
  console.log("✓ Test 1 Passed: Clue Tile with Trap triggers Danger first, then draws Clue Card upon dismissal");

  // --- Test 2: EVENT Tile with Trap ---
  let eventIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.EVENT);
  assert(eventIdx >= 0, "Spanish board must have an EVENT tile");
  let tileEvent = plantTrapOnTile(eventIdx);

  p1.tileIndex = eventIdx;
  engine.resolveTile(p1, tileEvent);
  assert.strictEqual(tileEvent.trap, null, "Trap must be disarmed on Event tile");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Danger modal shown for trap on Event tile");

  engine.dismissModal();
  assert(
    engine.state.pendingModal?.type === "event" || engine.state.phase === "action",
    "Underlying EVENT tile must trigger its event card resolution upon dismissal"
  );
  if (engine.state.pendingModal) engine.dismissModal();
  console.log("✓ Test 2 Passed: Event Tile with Trap triggers Danger first, then resolves Event Card upon dismissal");

  p1.sanctuaryShield = false;
  p1.shielded = false;
  // --- Test 3: DANGER Tile with Trap ---
  let dangerIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.DANGER);
  assert(dangerIdx >= 0, "Spanish board must have a DANGER tile");
  let tileDanger = plantTrapOnTile(dangerIdx);

  p1.tileIndex = dangerIdx;
  engine.resolveTile(p1, tileDanger);
  assert.strictEqual(tileDanger.trap, null, "Trap disarmed on Danger tile");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Danger modal from trap triggered");

  engine.dismissModal();
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Underlying DANGER tile must trigger its own Danger Card");
  engine.dismissModal();
  console.log("✓ Test 3 Passed: Danger Tile with Trap triggers Trap Hazard, then underlying Danger Tile upon dismissal");

  // --- Test 4: PARADOX Tile with Trap ---
  let paradoxIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.PARADOX);
  assert(paradoxIdx >= 0, "Spanish board must have a PARADOX tile");
  let tileParadox = plantTrapOnTile(paradoxIdx);

  p1.tileIndex = paradoxIdx;
  p1.paradox = 0;
  engine.resolveTile(p1, tileParadox);
  assert.strictEqual(tileParadox.trap, null, "Trap disarmed on Paradox tile");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Danger modal from trap triggered");

  engine.dismissModal();
  assert.strictEqual(engine.state.pendingModal?.type, "paradox", "Underlying PARADOX tile must trigger Paradox Zone Breach modal");
  assert(p1.paradox >= 1, "Player paradox must increase by +1 from Paradox tile");
  engine.dismissModal();
  console.log("✓ Test 4 Passed: Paradox Tile with Trap triggers Danger first, then underlying Paradox Node upon dismissal");

  // --- Test 5: TIME GATE Tile with Trap ---
  let timeGateIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.TIMEGATE);
  assert(timeGateIdx >= 0, "Spanish board must have a TIMEGATE tile");
  let tileTimeGate = plantTrapOnTile(timeGateIdx);

  p1.tileIndex = timeGateIdx;
  p1.energy = 8;
  engine.resolveTile(p1, tileTimeGate);
  assert.strictEqual(tileTimeGate.trap, null, "Trap disarmed on Time Gate tile");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Danger modal from trap triggered");

  engine.dismissModal();
  assert.strictEqual(engine.state.pendingChoice?.type, "timeGateTravel", "Underlying TIME GATE tile must present Time Gate Travel choice");
  engine.resolveChoice("stay");
  console.log("✓ Test 5 Passed: Time Gate Tile with Trap triggers Danger first, then Time Gate Travel prompt upon dismissal");

  // --- Test 6: ARTIFACT Tile with Trap (Displaced Era Retrieval) ---
  let artifactIdx = engine.state.board.spanish.findIndex(t => t.type === TILE_TYPES.ARTIFACT);
  assert(artifactIdx >= 0, "Spanish board must have an ARTIFACT tile");
  let tileArtifact = plantTrapOnTile(artifactIdx);

  p1.tileIndex = artifactIdx;
  p1.currentEra = "spanish";
  p1.mission = {
    artifactId: "am_typewriter",
    artifactNickname: "Quezon Typewriter",
    originEra: "american",
    displacedEra: "spanish"
  };
  p1.clueProgress = { am_typewriter: 3 };
  p1.artifactCards = [];

  engine.resolveTile(p1, tileArtifact);
  assert.strictEqual(tileArtifact.trap, null, "Trap disarmed on Artifact tile");
  assert.strictEqual(engine.state.pendingModal?.type, "danger", "Danger modal from trap triggered");

  engine.dismissModal();
  assert.strictEqual(engine.state.pendingModal?.type, "artifact", "Underlying ARTIFACT tile must retrieve the artifact");
  assert.strictEqual(p1.artifactCards.length, 1, "Player should hold the retrieved artifact");
  engine.dismissModal();
  console.log("✓ Test 6 Passed: Artifact Tile with Trap triggers Danger first, then retrieves Artifact upon dismissal");

  // --- Test 7: Strategist Owner Immunity ---
  let tileClueImmune = plantTrapOnTile(clueIdx);
  p2.tileIndex = clueIdx;
  p2.currentEra = "spanish";
  const p2CluesBefore = p2.clueCards.length;

  engine.resolveTile(p2, tileClueImmune);
  assert.notStrictEqual(tileClueImmune.trap, null, "Trap must remain armed when planter lands on it");
  assert.strictEqual(engine.state.pendingModal?.type, "card", "Planter directly triggers the underlying CLUE tile without trap penalty");
  assert.strictEqual(p2.clueCards.length, p2CluesBefore + 1, "Planter successfully drew their Clue Card");
  engine.dismissModal();
  console.log("✓ Test 7 Passed: Trap Planter is immune and directly triggers underlying tile function");

  console.log("------------------------------------------------------");
  console.log("✓ ALL TRAP & TILE FUNCTION TESTS PASSED (7/7)");
  console.log("------------------------------------------------------");

  if (engine) engine.stop();
  process.exit(0);

} catch (err) {
  console.error("\n✗ TEST FAILED:", err.message);
  if (err.stack) console.error(err.stack);
  if (engine) engine.stop();
  process.exit(1);
}
