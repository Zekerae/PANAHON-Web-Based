import assert from "node:assert";
import { GameEngine } from "../src/gameEngine.js";

console.log("=== STARTING PANAHON KEYBINDINGS & TURN FLOW TEST SUITE ===");

let engine = null;

try {
  engine = new GameEngine();
  const players = [
    { id: "p1", name: "Player 1", isAi: false, roleKey: "CHRONOMANCER" },
    { id: "p2", name: "Player 2", isAi: false, roleKey: "EXPLORER" },
    { id: "p3", name: "Player 3", isAi: false, roleKey: "GUARDIAN" },
    { id: "p4", name: "Player 4", isAi: false, roleKey: "TIME_POLICE" }
  ];

  engine.initGame(players);
  assert.strictEqual(engine.state.phase, "rolling", "Initial game phase should be rolling");
  console.log("✓ GameEngine initialized in rolling phase");

  // Simulate rolling die for P1
  const roll = engine.rollDice();
  assert.strictEqual(engine.state.phase, "moving", "Phase transitions to moving after rolling");
  assert(engine.state.movesRemaining >= 1 && engine.state.movesRemaining <= 6, "Moves remaining set to rolled value");
  console.log("✓ Dice roll transitions phase to moving");

  // Step move until all rolled moves are taken
  while (engine.state.movesRemaining > 0) {
    engine.movePlayerStep();
  }
  assert.strictEqual(engine.state.movesRemaining, 0, "Moves remaining depleted");
  assert.strictEqual(engine.state.phase, "action", "Phase transitions to action once movement complete");
  console.log("✓ Movement step completes and transitions to action phase");

  // Active Skill (Chronomancer Temporal Rewind) during action phase
  const p1 = engine.getCurrentPlayer();
  p1.energy = 8;
  const initialEnergy = p1.energy;
  const abilityUsed = engine.useActiveAbility(engine.state.currentPlayerIndex);
  assert.strictEqual(abilityUsed, true, "useActiveAbility should return true when requirements met");
  assert.strictEqual(p1.usedAbilityThisTurn, true, "Player usedAbilityThisTurn flagged true");
  assert(p1.energy < initialEnergy, "Energy should be deducted for ability activation");
  console.log("✓ Skill hotkey action (useActiveAbility) activates successfully in action phase");

  // End Turn action
  const prevPlayerIdx = engine.state.currentPlayerIndex;
  engine.endTurn();
  assert.notStrictEqual(engine.state.currentPlayerIndex, prevPlayerIdx, "endTurn advances to next player");
  assert.strictEqual(engine.state.phase, "rolling", "New turn resets phase to rolling");
  console.log("✓ End Turn action (endTurn) cleanly advances to next player in rolling phase");

  // Explorer ability (Momentum) during rolling phase
  const p2 = engine.getCurrentPlayer();
  assert.strictEqual(p2.roleKey, "EXPLORER", "Current player should be Explorer");
  p2.energy = 8;
  const momentumUsed = engine.useActiveAbility(engine.state.currentPlayerIndex);
  assert.strictEqual(momentumUsed, true, "Explorer should be able to prime Momentum in rolling phase");
  assert.strictEqual(engine.state.momentumActive, true, "momentumActive should be primed on engine state");
  console.log("✓ Explorer Momentum skill activates in rolling phase");

  console.log("------------------------------------------------------");
  console.log("✓ ALL KEYBINDING & TURN CYCLE TESTS PASSED (5/5)");
  console.log("------------------------------------------------------");

  if (engine) engine.stop();
  process.exit(0);

} catch (err) {
  console.error("\n✗ TEST FAILED:", err.message);
  if (err.stack) console.error(err.stack);
  if (engine) engine.stop();
  process.exit(1);
}
