import WebSocket from 'ws';
import fs from 'fs';

const PORT = 9333;
const APP = 'http://localhost:5199/';
const OUT = 'C:/Users/Lenovo/AppData/Local/Temp/opencode';

async function main() {
  const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
  let target = targets.find(t => t.type === 'page');
  if (!target) {
    target = await (await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) return { error: res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || '') };
    return res.result.value;
  };
  const shot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(res.data, 'base64'));
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2500);

  const clickText = async (text) => {
    return evalJs(`(() => {
      const els = [...document.querySelectorAll('button, .btn, div, span')];
      const el = els.find(e => e.children.length === 0 && (e.textContent || '').trim().includes(${JSON.stringify(text)}));
      const btn = el && el.closest('button');
      const target = btn || el;
      if (!target) return 'NOT FOUND: ' + ${JSON.stringify(text)};
      target.click();
      return 'clicked: ' + (target.textContent || '').trim().slice(0, 60);
    })()`);
  };

  console.log('TITLE:', await evalJs(`document.body.innerText.slice(0,300)`));
  console.log(await clickText('Player vs. AI'));
  await sleep(1200);
  console.log('LOBBY:', await evalJs(`document.body.innerText.slice(0,400)`));
  console.log(await clickText('Launch Mission'));
  await sleep(2000);
  await shot('01-start');
  console.log('GAME:', await evalJs(`document.body.innerText.slice(0,600)`));
  console.log('PANEL:', await evalJs(`document.querySelector('.right-panel')?.innerText`));

  const inspect = () => evalJs(`(() => {
    const pawns = [...document.querySelectorAll('.mario-party-space.has-players')].map(t => {
      const r = t.getBoundingClientRect();
      return { title: t.title, x: Math.round(r.x), y: Math.round(r.y), players: t.innerText.replace(/\\s+/g,' ') };
    });
    const reachable = [...document.querySelectorAll('.reachable-space')].map(t => t.title);
    return {
      phase: document.querySelector('.dice-result')?.innerText,
      moves: [...document.querySelectorAll('.panel-section')][1]?.innerText.replace(/\\s+/g,' ').slice(0,300),
      pawns, reachable,
      buttons: [...document.querySelectorAll('.right-panel button')].map(b => ({t: b.innerText.trim().slice(0,50), disabled: b.disabled}))
    };
  })()`);

  console.log('BEFORE ROLL:', JSON.stringify(await inspect(), null, 2));
  console.log(await clickText('Roll Movement Die'));
  await shot('02-rolling');
  for (let i = 0; i < 10; i++) {
    await sleep(400);
    console.log(`T+${(i+1)*400}:`, JSON.stringify(await inspect(), null, 2));
    await shot(`03-move-${i}`);
  }
  console.log('LOG:', await evalJs(`document.querySelector('.game-log')?.innerText`));
  console.log('CONSOLE ERRORS:', events.filter(e => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded').slice(0,20).map(e=>JSON.stringify(e.params).slice(0,500)));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
