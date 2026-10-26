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
  const shot = async (name, clip) => { const res = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 2 } } : {}) }); fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(res.data, 'base64')); };
  const clickText = (text) => evalJs(`(() => { const els=[...document.querySelectorAll('button, .btn, div, span')]; const el=els.find(e=>e.children.length===0 && (e.textContent||'').trim().includes(${JSON.stringify(text)})); const btn=el&&el.closest('button'); const t=btn||el; if(!t) return 'NOT FOUND'; t.click(); return 'clicked '+(t.textContent||'').trim().slice(0,40); })()`);

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2000);
  await evalJs(`localStorage.clear()`);
  await evalJs(`Math.random = () => 0.999`);
  console.log(await clickText('Player vs. AI'));
  await sleep(800);
  console.log(await clickText('Launch Mission'));
  await sleep(1500);
  const inspect = () => evalJs(`(() => ({
    phase: document.querySelector('.dice-result')?.innerText,
    moveArea: [...document.querySelectorAll('.panel-section')][1]?.innerText.replace(/\\s+/g,' '),
    pawns: [...document.querySelectorAll('.mario-party-space.has-players')].map(t => { const r=t.getBoundingClientRect(); return { title:t.title, x:Math.round(r.x), y:Math.round(r.y), txt:t.innerText.replace(/\\s+/g,' ') }; }),
    reach: [...document.querySelectorAll('.reachable-space')].map(t => { const r=t.getBoundingClientRect(); return { title:t.title, x:Math.round(r.x), y:Math.round(r.y) }; }),
    buttons: [...document.querySelectorAll('.right-panel button')].map(b=>({t:b.innerText.trim().replace(/\\s+/g,' ').slice(0,40), disabled:b.disabled}))
  }))()`);
  console.log('START', JSON.stringify(await inspect()));
  console.log(await clickText('Roll Movement Die'));
  for (let i = 0; i < 30; i++) {
    await sleep(100);
    const s = await inspect();
    console.log(`T+${(i+1)*100}`, JSON.stringify(s));
    if (i % 3 === 0) await shot(`m-${String(i).padStart(2,'0')}`);
  }
  console.log('LOG', await evalJs(`document.querySelector('.game-log')?.innerText`));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
