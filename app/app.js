"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const $ = (id) => document.getElementById(id);
const PASSAGES = [
  "The best way to learn something is to build it yourself. Start small, finish it, and then make it a little better each day.",
  "A good walk in the morning clears the head. The air is cool, the streets are quiet, and the whole day still feels possible.",
  "Rivers do not hurry, yet they carve canyons. Steady effort beats a burst of energy that fades by the afternoon.",
  "The kitchen smelled of fresh bread and coffee. Someone had left the window open, and the curtains moved in the breeze.",
  "Every app on this site was made by someone with an idea and a few spare evenings. Some of them will become your favourites.",
  "Keep your shoulders relaxed and your eyes on the screen. Accuracy first; speed comes on its own with practice.",
];
let passage, started, endsAt, timer, typedTotal, errors, finished;
$("best").textContent = load("typing-best", 0);

function reset() {
  passage = Array.from({ length: 4 }, () => PASSAGES[Math.floor(Math.random() * PASSAGES.length)]).join(" ");
  started = false;
  finished = false;
  typedTotal = 0;
  errors = 0;
  clearInterval(timer);
  $("input").value = "";
  $("input").disabled = false;
  $("time").textContent = $("secs").value;
  $("wpm").textContent = "0";
  $("acc").textContent = "100%";
  $("msg").textContent = "";
  render();
  $("input").focus();
}

function render() {
  const typed = $("input").value;
  const html = [];
  for (let i = 0; i < passage.length; i++) {
    const c = passage[i] === " " ? "&nbsp;" : passage[i].replace("&", "&amp;").replace("<", "&lt;");
    const cls = i < typed.length ? (typed[i] === passage[i] ? "ok" : "bad") : i === typed.length ? "cur todo" : "todo";
    html.push(`<span class="${cls}">${c}</span>`);
  }
  $("text").innerHTML = html.join("");
}

function stats() {
  const typed = $("input").value;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) correct++;
  const minutes = (Number($("secs").value) * 1000 - Math.max(0, endsAt - Date.now())) / 60000;
  const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const acc = typedTotal ? Math.round(((typedTotal - errors) / typedTotal) * 100) : 100;
  $("wpm").textContent = wpm;
  $("acc").textContent = `${acc}%`;
  return { wpm, acc };
}

function finish() {
  finished = true;
  clearInterval(timer);
  $("input").disabled = true;
  const { wpm, acc } = stats();
  if (wpm > load("typing-best", 0)) save("typing-best", wpm);
  $("best").textContent = load("typing-best", 0);
  $("msg").textContent = `${wpm} words per minute at ${acc}% accuracy.`;
}

$("input").addEventListener("input", (e) => {
  if (finished) return;
  if (!started) {
    started = true;
    endsAt = Date.now() + Number($("secs").value) * 1000;
    timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      $("time").textContent = left;
      stats();
      if (left === 0) finish();
    }, 200);
  }
  const typed = $("input").value;
  if (e.inputType && e.inputType.startsWith("insert")) {
    typedTotal++;
    if (typed[typed.length - 1] !== passage[typed.length - 1]) errors++;
  }
  if (typed.length >= passage.length) finish();
  render();
  stats();
});
$("text").addEventListener("click", () => $("input").focus());
$("restart").addEventListener("click", reset);
$("secs").addEventListener("change", reset);
reset();
