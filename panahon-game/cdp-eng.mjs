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
  const evalJs = async (expression) => { const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (res.exceptionDetails) return { error: res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || '') }; return res.result.value; };
  await send('Runtime.enable');
  const result = await evalJs(`(() => {
    const root = document.querySelector('.app-root') || document.getElementById('root');
    const keys = Object.keys(root);
    const reactKeys = keys.filter(k => k.startsWith('__react'));
    let found = null;
    for (const k of reactKeys) {
      let fiber = root[k];
      const seen = new Set();
      const stack = [fiber];
      while (stack.length && !found) {
        const f = stack.pop();
        if (!f || seen.has(f)) continue;
        seen.add(f);
        const props = f.memoizedProps;
        if (props && typeof props === 'object') {
          if (props.engine && typeof props.engine.getNextTileIndex === 'function') { found = props.engine; break; }
          if (props.state && props.state.players && props.engine) { found = props.engine; break; }
        }
        if (f.child) stack.push(f.child);
        if (f.sibling) stack.push(f.sibling);
      }
      if (found) break;
    }
    if (!found) return { reactKeys, reason: 'engine not found' };
    window.__eng = found;
    const p = found.getCurrentPlayer();
    return { reactKeys, phase: found.state.phase, player: { name: p.name, era: p.currentEra, idx: p.tileIndex, prev: p.previousTileIndex }, moves: found.state.movesRemaining,
      next: found.getNextTileIndex(p, p.currentEra, p.tileIndex, 1) };
  })()`);
  console.log(JSON.stringify(result, null, 2));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
