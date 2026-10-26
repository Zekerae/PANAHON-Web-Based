import WebSocket from 'ws';
import fs from 'fs';
const PORT = 9333; const OUT = 'C:/Users/Lenovo/AppData/Local/Temp/opencode';
async function main() {
  const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 0; const pending = new Map();
  ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const evalJs = async (expression) => { const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (res.exceptionDetails) return { error: res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || '') }; return res.result.value; };
  const shot = async (name) => { const res = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(res.data, 'base64')); };
  const state = () => evalJs(`(() => {
    const eng = window.__eng; if (!eng) return 'no engine';
    const p = eng.getCurrentPlayer();
    const pawn = document.querySelector('.board-pawn.active-turn');
    const r = pawn?.getBoundingClientRect();
    return {
      phase: eng.state.phase, moves: eng.state.movesRemaining,
      player: { era: p.currentEra, idx: p.tileIndex, prev: p.previousTileIndex },
      pawnTile: document.querySelector('.mario-party-space.has-players')?.title,
      pawnRect: r ? {x: Math.round(r.x), y: Math.round(r.y)} : null,
      reach: document.querySelector('.reachable-space')?.title || null,
      arrow: document.querySelector('.reachable-arrow-indicator')?.textContent,
      moveBtn: [...document.querySelectorAll('.right-panel button')].find(b => /move forward/i.test(b.innerText))?.innerText.replace(/\\s+/g,' ') || null
    };
  })()`);
  await send('Page.enable'); await send('Runtime.enable');

  // Force the engine into a junction scenario on the custom Spanish map:
  // standing on Space #6 (idx 5) having arrived from Space #5 (idx 4).
  console.log(await evalJs(`(() => {
    const eng = window.__eng; if (!eng) return 'no engine';
    const p = eng.getCurrentPlayer();
    p.currentEra = 'spanish'; p.tileIndex = 5; p.previousTileIndex = 4;
    eng.state.phase = 'moving';
    eng.state.movesRemaining = 2;
    eng.state.movementDirection = 'forward';
    eng.state.momentumActive = false;
    eng.state.pendingChoice = null; eng.state.pendingModal = null;
    eng.notify();
    return 'scenario set';
  })()`));
  await sleep(600);
  console.log('JUNCTION BEFORE', JSON.stringify(await state(), null, 2));
  await shot('v-01-junction-arrow');

  // Click the arrow tile
  console.log('CLICK ARROW', await evalJs(`document.querySelector('.reachable-space')?.click(); 'clicked'`));
  await sleep(60);
  console.log('60ms', JSON.stringify(await state()));
  await sleep(120);
  console.log('180ms', JSON.stringify(await state()));
  await sleep(400);
  console.log('580ms', JSON.stringify(await state(), null, 2));
  await shot('v-02-after-junction-click');

  // Verify spacebar still works for the next step
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: ' ' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  await sleep(600);
  console.log('AFTER SPACE', JSON.stringify(await state(), null, 2));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
