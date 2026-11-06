import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { GameEngine } from '../src/gameEngine.js';

const ERA = 'spanish';

function makePlayer(overrides) {
  return {
    id: 0,
    name: 'Player',
    roleKey: 'STRATEGIST',
    role: { avatar: '' },
    color: '#F39C12',
    currentEra: ERA,
    tileIndex: 0,
    previousTileIndex: null,
    energy: 5,
    activeCooldown: 0,
    usedAbilityThisTurn: false,
    stranded: false,
    ...overrides
  };
}

function makeTile(index) {
  return {
    id: `${ERA}_${index}`,
    era: ERA,
    type: 'empty',
    index,
    trap: null,
    commandPost: null,
    players: []
  };
}

function makeScenario() {
  const engine = new GameEngine();
  const tiles = Array.from({ length: 25 }, (_, index) => makeTile(index));
  const strategist = makePlayer({ id: 0, name: 'Strategist' });
  const rival = makePlayer({ id: 1, name: 'Rival', roleKey: 'HISTORIAN', color: '#3498DB' });

  engine.state = {
    phase: 'action',
    currentPlayerIndex: 0,
    turnNumber: 1,
    players: [strategist, rival],
    board: { [ERA]: tiles },
    movesRemaining: 0,
    movementDirection: 'forward',
    pendingModal: null,
    modalQueue: [],
    pendingChoice: null,
    momentumActive: false,
    momentumUsedMidTile: false
  };

  // Pick a real graph edge so the test exercises the same final-step path as gameplay.
  rival.tileIndex = 0;
  strategist.tileIndex = engine.getNextTileIndex(rival, ERA, rival.tileIndex, 1);
  tiles[rival.tileIndex].players.push(rival.id);
  tiles[strategist.tileIndex].players.push(strategist.id);

  return { engine, strategist, rival, tiles };
}

test('Strategist Command Post has a visible board marker', () => {
  const boardPath = fileURLToPath(new URL('../src/components/game/GameBoard.jsx', import.meta.url));
  const boardSource = readFileSync(boardPath, 'utf8');

  assert.match(boardSource, /t\.commandPost\s*&&/);
  assert.match(boardSource, /className=["']tile-command-post-indicator["']/);
});

test('a rival who finishes movement on a Command Post pays its owner one Energy', () => {
  const { engine, strategist, rival, tiles } = makeScenario();
  const postIndex = strategist.tileIndex;

  assert.equal(engine.useActiveAbility(strategist.id), true);
  assert.ok(tiles[postIndex].commandPost, 'ability should persist a Command Post on the tile');
  assert.equal(strategist.energy, 3, 'placing the post should cost two Energy');

  engine.state.currentPlayerIndex = rival.id;
  engine.state.phase = 'moving';
  engine.state.movesRemaining = 1;
  rival.energy = 3;

  assert.equal(engine.movePlayerStep(), true);
  assert.equal(rival.tileIndex, postIndex);
  assert.equal(rival.energy, 2, 'rival should pay one Energy');
  assert.equal(strategist.energy, 4, 'Command Post owner should receive the toll');
  assert.match(
    engine.getLogs().at(-1)?.message ?? '',
    /Command Post Toll: Rival entered Strategist's Command Post and paid a 1 Energy toll/
  );
});

test('a rival who steps through a Command Post during movement also pays the toll', () => {
  const { engine, strategist, rival } = makeScenario();

  assert.equal(engine.useActiveAbility(strategist.id), true);

  engine.state.currentPlayerIndex = rival.id;
  engine.state.phase = 'moving';
  engine.state.movesRemaining = 2;
  rival.energy = 3;

  assert.equal(engine.movePlayerStep(), true);
  assert.equal(engine.state.movesRemaining, 1, 'rival should still have another movement step');
  assert.equal(rival.energy, 2, 'entering the post mid-movement should charge one Energy');
  assert.equal(strategist.energy, 4, 'owner should receive the mid-movement toll');
});
