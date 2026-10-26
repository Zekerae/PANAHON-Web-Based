import WebSocket from 'ws';
import fs from 'fs';
const PORT = 9333; const APP = 'http://localhost:5199/'; const OUT = 'C:/Users/Lenovo/AppData/Local/Temp/opencode';
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
  const clickText = (text) => evalJs(`(() => { const needle=${JSON.stringify(text)}.toLowerCase(); const els=[...document.querySelectorAll('button, .btn, div, span')]; const el=els.find(e=>e.children.length===0 && (e.textContent||'').trim().toLowerCase().includes(needle)); const btn=el&&el.closest('button'); const t=btn||el; if(!t) return 'NOT FOUND'; t.click(); return 'clicked '+(t.textContent||'').trim().slice(0,40); })()`);
  const pressSpace = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  };
  const inspect = () => evalJs(`(() => ({
    phase: document.querySelector('.dice-result')?.innerText,
    moves: [...document.querySelectorAll('.panel-section')][1]?.innerText.replace(/\\s+/g,' '),
    pawns: [...document.querySelectorAll('.mario-party-space.has-players')].map(t => t.title),
    pawnDom: [...document.querySelectorAll('.board-pawn')].map(t => { const r=t.getBoundingClientRect(); return { title:t.title, x:Math.round(r.x), y:Math.round(r.y) }; }),
    reach: [...document.querySelectorAll('.reachable-space')].map(t => t.title),
    modal: document.querySelector('.modal-overlay')?.innerText.replace(/\\s+/g,' ').slice(0,200) || null,
    buttons: [...document.querySelectorAll('.right-panel button')].map(b=>({t:b.innerText.trim().replace(/\\s+/g,' ').slice(0,45), disabled:b.disabled}))
  }))()`);

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2000);
  await evalJs(`localStorage.clear()`);
  await evalJs(`Math.random = () => 0.999`);
  console.log(await clickText('Player vs. AI'));
  await sleep(800);
  console.log(await clickText('Launch Mission'));
  await sleep(1500);
  console.log('START', JSON.stringify(await inspect()));
  console.log(await clickText('Roll Movement Die'));
  await sleep(800);
  console.log('AFTER ROLL', JSON.stringify(await inspect(), null, 2));
  await shot('r-01-after-roll');

  for (let i = 0; i < 4; i++) {
    await pressSpace();
    await sleep(700);
    console.log(`SPACE ${i+1}`, JSON.stringify(await inspect()));
    await shot(`r-space-${i+1}`);
    if ((await evalJs(`!!document.querySelector('.modal-overlay')`))) {
      console.log('MODAL!', await evalJs(`document.querySelector('.modal-overlay').innerText.replace(/\\s+/g,' ')`));
    }
  }

  // 5th step should land on the time gate and open a choice
  await pressSpace();
  await sleep(700);
  console.log('SPACE 5', JSON.stringify(await inspect(), null, 2));
  await shot('r-space-5');
  console.log('MODAL TEXT', await evalJs(`document.querySelector('.modal-overlay')?.innerText.replace(/\\s+/g,' ')`));
  console.log(await clickText('Continue Moving'));
  await sleep(500);
  console.log('AFTER CONTINUE', JSON.stringify(await inspect(), null, 2));
  await shot('r-02-junction-arrow');

  // Click the highlighted arrow tile to verify junction clicking works
  const reachTitle = await evalJs(`document.querySelector('.reachable-space')?.title`);
  console.log('REACH TITLE', reachTitle);
  console.log(await evalJs(`document.querySelector('.reachable-space')?.click()`));
  await sleep(700);
  console.log('AFTER ARROW CLICK', JSON.stringify(await inspect(), null, 2));
  await shot('r-03-after-arrow-click');

  console.log('LOG', await evalJs(`document.querySelector('.game-log')?.innerText`));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
