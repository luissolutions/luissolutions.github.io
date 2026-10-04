// blocks/year.js - the year chips. Publishes store.year; every block that reads the year (the ledger) follows the arrow.
export const title = "Year";
export const pub = ["year"];
export function mount(body, { store }) {
  const Y = new Date().getFullYear(), years = []; for (let y = Y; y >= Y - 4; y--) years.push(y);
  const draw = () => { const cur = store.get("year"); body.innerHTML = `<div class="lv-chips">${years.map(y => `<button type="button" class="lv-chip${y === cur ? " on" : ""}" data-y="${y}">${y}</button>`).join("")}</div>`; };
  body.addEventListener("click", e => { const b = e.target.closest("[data-y]"); if (!b) return; store.set("year", Number(b.dataset.y)); draw(); });
  const stop = store.on("year", draw); draw();
  return { destroy: stop };
}
