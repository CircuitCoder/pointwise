type Callback = (ts: DOMHighResTimeStamp) => void;
const registered: Map<string, Callback> = new Map();

export function register(id: string, fn: Callback) {
  registered.set(id, fn);
}

export function unregister(id: string, fn?: Callback) {
  if(fn !== undefined) {
    const cur = registered.get(id);
    if(cur !== fn) return;
  }

  registered.delete(id);
}

function tick(ts: DOMHighResTimeStamp) {
  registered.forEach(fn => fn(ts));
  requestAnimationFrame(tick);
}

export function kickoff() {
  requestAnimationFrame(tick);
}