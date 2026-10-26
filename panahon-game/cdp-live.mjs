import WebSocket from 'ws';
const PORT = 9333;
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
  await send('Runtime.enable');
  const inspect = () => evalJs(`(() => ({
    phase: document.querySelector('.dice-result')?.innerText,
    moves: [...document.querySelectorAll('.panel-section')][1]?.innerText.replace(/\\s+/g,' '),
    pawns: [...document.querySelectorAll('.board-pawn')].map(t => ({title:t.title, x:Math.round(t.getBoundingClientRect().x), y:Math.round(t.getBoundingClientRect().y)})),
    reach: [...document.querySelectorAll('.reachable-space')].map(t => t.title),
    btn: [...document.querySelectorAll('.right-panel button')].map(b=>({t:b.innerText.trim().replace(/\\s+/g,' ').slice(0,40), disabled:b.disabled}))
  }))()`);
  console.log('BEFORE', JSON.stringify(await inspect()));
  console.log('CLICK BTN', await evalJs(`(() => { const b=[...document.querySelectorAll('.right-panel button')].find(b=>b.innerText.includes('Move Forward')); if(!b) return 'none'; b.click(); return 'clicked'; })()`));
  await sleep(700);
  console.log('AFTER BTN', JSON.stringify(await inspect()));
  console.log('SYNTH SPACE', await evalJs(`(() => { const ev = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true }); const ok = window.dispatchEvent(ev); return {ok, prevented: ev.defaultPrevented, target: ev.target?.tagName, active: document.activeElement?.tagName}; })()`));
  await sleep(700);
  console.log('AFTER SYNTH', JSON.stringify(await inspect()));
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: ' ' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  await sleep(700);
  console.log('AFTER CDP', JSON.stringify(await inspect()));
  console.log('ERRORS?', await evalJs(`window.__err || 'none'`));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
