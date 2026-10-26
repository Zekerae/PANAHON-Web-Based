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
  const result = await evalJs(`(async () => {
    const { getActivePathConnections, getActiveJunctionRules } = await import('/src/gameData.js');
    const eng = window.__eng;
    const p = { previousTileIndex: 2 };
    const out = {};
    for (const [idx, prev] of [[3,2],[5,4],[3,null],[6,2],[4,3]]) {
      p.previousTileIndex = prev;
      out[idx + ':' + prev] = eng.getNextTileIndex(p, 'spanish', idx, 1);
    }
    return { out, conn3: getActivePathConnections().spanish[3], conn6: getActivePathConnections().spanish[6], rules: getActiveJunctionRules().spanish, lsConn: localStorage.getItem('panahon_custom_map_connections')?.slice(0,200) };
  })()`);
  console.log(JSON.stringify(result, null, 2));
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
