import assert from 'node:assert/strict';
import test from 'node:test';

import { ERAS, EVENT_CARDS } from '../src/gameData.js';
import { GameEngine } from '../src/gameEngine.js';

test('Ay nag-glitch remains active for every player across its full rounds', () => {
  const engine = new GameEngine();
  engine.state = {
    players: Array.from({ length: 4 }, (_, id) => ({ id }))
  };
  const card = EVENT_CARDS[ERAS.SPANISH].find(({ id }) => id === 'evt_sp_5');

  card.effect(engine.state.players[0], engine);

  assert.equal(
    engine.state.temporalOccurrence,
    8,
    'two rounds with four players must keep the effect active for eight player turns'
  );
  assert.equal(engine.state.temporalGlitchTurns, 2);
});
