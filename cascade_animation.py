"""
cascade_animation.py
────────────────────
Generates `cascade_animation.html` — a standalone, self-contained page that
plays the ⑬ Cascade L→R animation on loop.

Each of the three sine curves is revealed left-to-right with a staggered
offset, creating a cascading effect before resetting and replaying.

Curves (all ×π, axes −π to π):
  y₁ =  π·sin(x) / b
  y₂ = −π·sin(x) / b
  y₃ =  π·sin(x) / (a·b)

Defaults match the logo settings:
  a = 3.14,  b = 2.14
  hue 245° · sat 25% · lightness 66%
  max thickness 11 · taper speed 0.4
  dim amount 0.71 · dim speed 8.0
  boost amount 0.17 · boost speed 2.6

Run:
    python cascade_animation.py            # writes HTML + opens in browser
    python cascade_animation.py --no-serve # just writes the file
"""

import os, sys, threading, webbrowser, http.server

# ── HTML payload ──────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Cascade L→R — Sine Curves</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#000;display:flex;flex-direction:column;align-items:center;
     justify-content:center;min-height:100vh;gap:18px;font-family:monospace;}
canvas{display:block;border-radius:4px;}
.controls{display:flex;gap:14px;align-items:center;flex-wrap:wrap;
          justify-content:center;}
label{color:rgba(200,190,255,.55);font-size:11px;display:flex;
      align-items:center;gap:7px;letter-spacing:.06em;}
input[type=range]{width:110px;accent-color:#c4b5fd;cursor:pointer;}
input[type=number]{width:60px;background:#111;border:0.5px solid #333;
                   color:#c4b5fd;padding:3px 6px;border-radius:3px;
                   font-family:monospace;font-size:12px;text-align:center;}
.val{color:#c4b5fd;min-width:28px;text-align:right;font-size:12px;}
button{background:#111;border:0.5px solid #444;color:rgba(200,190,255,.7);
       font-family:monospace;font-size:11px;padding:5px 14px;
       border-radius:3px;cursor:pointer;letter-spacing:.08em;}
button:hover{border-color:#c4b5fd;color:#c4b5fd;}
</style>
</head>
<body>

<canvas id="cv"></canvas>

<div class="controls">
  <label>a <input type="number" id="aIn" value="3.14" step="0.01"> </label>
  <label>b <input type="number" id="bIn" value="2.14" step="0.01"> </label>
  <label>thickness
    <input type="range" id="wmax" min="1" max="40" value="11" step="1">
    <span class="val" id="wmaxV">11</span>
  </label>
  <label>speed
    <input type="range" id="dur" min="500" max="5000" value="2600" step="100">
    <span class="val" id="durV">2.6s</span>
  </label>
  <button id="pauseBtn">pause</button>
</div>

<script>
(function(){
// ── canvas ────────────────────────────────────────────────────────────────
const cv  = document.getElementById('cv');
const ctx = cv.getContext('2d');
const DPR = window.devicePixelRatio || 1;
const SIZE = Math.min(window.innerWidth, window.innerHeight, 600);
cv.style.width  = SIZE + 'px';
cv.style.height = SIZE + 'px';
cv.width  = SIZE * DPR;
cv.height = SIZE * DPR;
ctx.scale(DPR, DPR);
const S = SIZE;

// ── constants ─────────────────────────────────────────────────────────────
const XMIN = -Math.PI, XMAX = Math.PI;
const YMIN = -Math.PI, YMAX =  Math.PI;
const NS   = 800;                    // segments per curve
const DX   = (XMAX - XMIN) / NS;

// ── visual parameters (fixed to logo defaults) ────────────────────────────
const HUE  = 245;
const SAT  = 25;
const LIT  = 66;
const WS   = 0.4;   // taper speed
const BD   = 0.71;  // dim amount
const BS   = 8.0;   // dim speed
const ED   = 0.17;  // boost amount
const ES   = 2.6;   // boost speed

// ── coordinate helpers ────────────────────────────────────────────────────
const tcx = x => (x - XMIN) / (XMAX - XMIN) * S;
const tcy = y => (YMAX - y) / (YMAX - YMIN) * S;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── envelope functions ────────────────────────────────────────────────────
function env(x, spd) { return Math.pow(Math.abs(Math.cos(x / 2)), spd); }

function lineWidth(x, wmax) { return wmax * env(x, WS); }

function lineAlpha(x) {
  const m = Math.max(0.03, 1 - BD);
  return m + (1 - m) * env(x, BS);
}

function lineLit(x) {
  return Math.min(100, LIT + (100 - LIT) * ED * env(x, ES));
}

function strokeColor(x) {
  const al = lineAlpha(x);
  const lt = lineLit(x);
  return `hsla(${HUE},${SAT}%,${lt.toFixed(1)}%,${al.toFixed(3)})`;
}

// ── easing ────────────────────────────────────────────────────────────────
const easeOut = t => 1 - (1 - t) * (1 - t);

// ── draw one line from xStart to xEnd ────────────────────────────────────
function drawLine(fn, wmax, xStart, xEnd) {
  for (let i = 0; i < NS; i++) {
    const x0 = XMIN + i * DX, x1 = x0 + DX, xm = (x0 + x1) / 2;
    if (xm < xStart || xm > xEnd) continue;
    const y0 = clamp(fn(x0), YMIN, YMAX);
    const y1 = clamp(fn(x1), YMIN, YMAX);
    ctx.beginPath();
    ctx.moveTo(tcx(x0), tcy(y0));
    ctx.lineTo(tcx(x1), tcy(y1));
    ctx.lineWidth   = lineWidth(xm, wmax);
    ctx.lineCap     = 'round';
    ctx.strokeStyle = strokeColor(xm);
    ctx.stroke();
  }
}

// ── state ─────────────────────────────────────────────────────────────────
let paused   = false;
let animStart = null;
let rafId    = null;

function getDuration() { return parseFloat(document.getElementById('dur').value); }
function getWmax()     { return parseFloat(document.getElementById('wmax').value); }
function getA()        { return parseFloat(document.getElementById('aIn').value) || 3.14; }
function getB()        { return parseFloat(document.getElementById('bIn').value) || 2.14; }

// ── cascade animation frame ───────────────────────────────────────────────
function frame(ts) {
  if (paused) { rafId = requestAnimationFrame(frame); return; }
  if (!animStart) animStart = ts;

  const dur  = getDuration();
  const raw  = ((ts - animStart) % dur) / dur;   // loops 0→1 continuously
  const wmax = getWmax();
  const a    = getA();
  const b    = getB();

  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S, S);

  // Three curves with staggered reveals
  // Line 0 starts at t=0,   fills by t=0.56
  // Line 1 starts at t=0.22, fills by t=0.78
  // Line 2 starts at t=0.44, fills by t=1.00
  const offsets = [0, 0.22, 0.44];
  const span    = 0.56;   // fraction of total duration each line takes

  const fns = [
    x =>  Math.PI * Math.sin(x) / b,
    x => -Math.PI * Math.sin(x) / b,
    x =>  Math.PI * Math.sin(x) / (a * b),
  ];

  offsets.forEach((off, li) => {
    const lt     = easeOut(clamp((raw - off) / span, 0, 1));
    const xEnd   = XMIN + lt * (XMAX - XMIN);
    drawLine(fns[li], wmax, XMIN, xEnd);
  });

  rafId = requestAnimationFrame(frame);
}

// ── start loop ────────────────────────────────────────────────────────────
rafId = requestAnimationFrame(frame);

// ── controls ──────────────────────────────────────────────────────────────
document.getElementById('pauseBtn').addEventListener('click', function() {
  paused = !paused;
  this.textContent = paused ? 'resume' : 'pause';
  if (!paused) animStart = null; // reset phase on resume
});

const wmaxSlider = document.getElementById('wmax');
const durSlider  = document.getElementById('dur');
wmaxSlider.addEventListener('input', () => {
  document.getElementById('wmaxV').textContent = wmaxSlider.value;
});
durSlider.addEventListener('input', () => {
  document.getElementById('durV').textContent = (durSlider.value / 1000).toFixed(1) + 's';
  animStart = null; // restart cycle at new speed
});

})();
</script>
</body>
</html>
"""

# ── write file ────────────────────────────────────────────────────────────────

OUT = "cascade_animation.html"

def write():
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(HTML)
    print(f"[✓] Written → {os.path.abspath(OUT)}")

# ── optional dev server ───────────────────────────────────────────────────────

def serve(port=8766):
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda *_: None
    with http.server.HTTPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/{OUT}"
        print(f"[✓] Serving at {url}")
        print("     Press Ctrl-C to stop.\n")
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[·] Server stopped.")

# ── entry ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    write()
    if "--no-serve" not in sys.argv:
        serve()
